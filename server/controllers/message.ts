import { getConversation, getMessages } from "../db/queries";
import { Request, Response } from "express";
import type { Message } from "../db/schema";

export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res
        .status(400)
        .json({ error: "conversationId parameter is required." });
    }

    const conv = await getConversation(conversationId);
    const convParticipants = conv.map((c) => c.userId);

    if (!convParticipants.includes(req.userId!)) {
      return res
        .status(403)
        .json({ error: "You are not allowed to view these messages." });
    }

    const messages = (await getMessages(conversationId)) as any as Message[];

    return res.status(200).json({
      message: "Messages retrieved successfully.",
      data: messages,
    });
  } catch (err: any) {
    if (err.message) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Internal server error." });
  }
};
