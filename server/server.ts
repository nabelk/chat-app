import "dotenv/config";
import Express, { Request, NextFunction, Response } from "express";
import http from "http";
import { Socket, Server } from "socket.io";
import { auth } from "./lib/auth";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import cors from "cors";
import authMiddleware from "./middleware/auth";
import {
  getOrCreateConversation,
  insertMessage,
  validateCanChat,
  insertPublicRoomMessage,
} from "./db/queries";
import { friendRouter, messageRouter } from "./routes/routers";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = Express();
const httpServer = http.createServer(app);

const { FRONTEND_URL, PUBLIC_ROOM } = process.env;

const corsOptions = {
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "DELETE"],
  credentials: true,
  preflightContinue: false,
};

// CSRF protection
app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.referer;
  const allowedOrigins = [FRONTEND_URL] as string[];

  // Check for actual requests (not OPTIONS)
  if (req.method !== "OPTIONS" && req.headers["sec-fetch-mode"] !== "cors") {
    if (
      !origin ||
      !allowedOrigins.some((allowed) => origin.startsWith(allowed))
    ) {
      return res.status(403).json({ error: "Forbidden origin" });
    }
  }

  next();
});

app.use(cors(corsOptions));

app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

const io = new Server(httpServer, { cors: corsOptions });

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(Express.urlencoded({ extended: true }));
app.use(Express.json());

// Protected route example
app.get(
  "/api/test",
  authMiddleware,
  async (req: Express.Request, res: Express.Response): Promise<any> => {
    return res.json({ message: "You are logged in" });
  }
);

app.use("/friend", authMiddleware, friendRouter);
app.use("/message", authMiddleware, messageRouter);

io.use(async (socket, next) => {
  const origin =
    socket.handshake.headers.origin || socket.handshake.headers.referer;
  const allowedOrigins = [FRONTEND_URL] as string[];

  // Check origin
  if (
    !origin ||
    !allowedOrigins.some((allowed) => origin.startsWith(allowed))
  ) {
    return next(new Error("Forbidden origin"));
  }

  const session = await auth.api.getSession({
    headers: fromNodeHeaders(socket.handshake.headers),
  });

  if (!session) {
    socket.emit("error", "Unauthorized");
    return next(new Error("Unauthorized"));
  } else {
    (socket as any).userId = session.user.id;
    (socket as any).name = session.user.name;
    next();
  }
});

const onlineUsers = new Map<string, Set<string>>();

io.on("connection", async (socket: Socket) => {
  const { userId, name } = socket as any;
  // Log when a user connects
  console.log("A user connected:", socket.id, name);

  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId)!.add(socket.id);

  io.emit("user_online", Array.from(onlineUsers.keys()));

  socket.join(PUBLIC_ROOM as string);

  socket.on("join_conversation", async (otherUserId: string) => {
    const canChat = await validateCanChat(userId, otherUserId);
    if (!canChat) {
      socket.emit("error", "You are not allowed to chat with this user.");
      return;
    }
    const conversationID = await getOrCreateConversation(userId, otherUserId);

    socket.join(conversationID);
    // console.log(`User ${socket.id} joined conversation ${conversationID}`);
    socket.emit("joined_conversation", { conversationId: conversationID });
  });

  socket.on("conversation_message", async (conversationID, content) => {
    // Ensure the user has joined the conversation before sending messages
    if (!socket.rooms.has(conversationID)) {
      socket.emit(
        "error",
        "You must join the conversation before sending messages."
      );
      return;
    }

    try {
      const newMessage = await insertMessage({
        conversationId: conversationID,
        senderId: userId,
        content,
      });

      io.to(conversationID).emit("conversation_message", {
        from: userId,
        fromName: name,
        content,
        newMessage,
      });
    } catch (err) {
      socket.emit("error", "Having problem sending message");
      return;
    }
  });

  socket.on("public_room_message", async (content: string) => {
    try {
      const newMessage = await insertPublicRoomMessage({
        senderId: userId,
        content,
      });

      io.to(PUBLIC_ROOM as string).emit("public_room_message", {
        newMessage,
      });
    } catch (err) {
      socket.emit("error", "Having problem sending message");
    }
  });

  socket.on("typing", (conversationId) => {
    if (socket.rooms.has(conversationId)) {
      io.to(conversationId).emit("typing", {
        from: userId,
        fromName: name,
        conversationId,
      });
    }
  });

  socket.on("remove_typing", (conversationId) => {
    if (socket.rooms.has(conversationId)) {
      io.to(conversationId).emit("remove_typing", {
        from: userId,
        conversationId,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);

    const sockets = onlineUsers.get(userId);
    if (!sockets) return;

    sockets.delete(socket.id);

    if (sockets.size === 0) {
      onlineUsers.delete(userId);
      io.emit("user_offline", { userId });
    }
  });
});

app.use((err: any, _: Request, res: Response, __: NextFunction) => {
  console.error(err.message || err);

  if (app.get("env") === "production") {
    res.status(500).json({ message: "Something went wrong" });
  } else {
    res.status(500).json({
      message: err.message || "Something broke",
      stack: err.stack,
    });
  }
});

export { io, onlineUsers };

httpServer.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
