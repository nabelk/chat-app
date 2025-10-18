import { useEffect, useState, type ReactNode, useRef } from "react";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketState,
} from "../types/socket";
import socketService from "../services/socket-services";
import { SocketContext } from "./socket-context";
import { Socket } from "socket.io-client";
import { type Session } from "better-auth";
import { api, ApiError } from "../lib/api-client";
import { type MessagesResponse, type Message as M } from "../types/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface SocketProviderProps {
  children: ReactNode;
  isAuthenticated: Session;
  token?: string;
}

interface ExistingMessagesByConvID {
  [conversationId: string]: M[];
}

export interface UserTyping {
  from: string;
  fromName: string;
  conversationId: string;
}

const getPublicMessages = async () => {
  try {
    const response: MessagesResponse = await api.get(`/message/all/msg/public`);

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      // Handle your custom API errors
      toast.error(error.message);
    } else {
      // Handle other errors (network, etc.)
      toast.error("Network error occurred");
    }
  }
};

export function SocketProvider({
  children,
  isAuthenticated,
}: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [messages, setMessages] = useState<ExistingMessagesByConvID>({});
  const messagesRef = useRef(messages);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [socketState, setSocketState] = useState<SocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    currentConversationId: null,
  });
  const [isUserTyping, setIsUserTyping] = useState<UserTyping[]>([]);
  const queryClient = useQueryClient();
  const { VITE_PUBLIC_ROOM } = import.meta.env;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (isAuthenticated) {
      setSocketState((prev) => ({ ...prev, isConnecting: true }));

      const socketInstance = socketService.connect();
      setSocket(socketInstance);

      socketInstance.on("connect", async () => {
        setSocketState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
        }));
        const publicMessages = await getPublicMessages();
        setMessages((prev) => ({
          ...prev,
          [VITE_PUBLIC_ROOM]: publicMessages?.data || [],
        }));
      });

      socketInstance.on("connect_error", () => {
        toast.error("Having a problem connecting");
      });

      socketInstance.on("disconnect", () => {
        setSocketState((prev) => ({ ...prev, isConnected: false }));
      });

      socketInstance.on("error", (error: string) => {
        toast.error(error);
        setSocketState((prev) => ({ ...prev, error, isConnecting: false }));
      });

      socketInstance.on("joined_conversation", async ({ conversationId }) => {
        setSocketState((prev) => ({
          ...prev,
          currentConversationId: conversationId,
        }));

        if (messagesRef.current[conversationId]) {
          return;
        }

        try {
          // Using your API client - adjust the endpoint as needed
          const response: MessagesResponse = await api.get(
            `/message/all/${conversationId}`
          );

          // Your API returns { message: "success", data: { messages: [...] } }
          setMessages((prev) => ({
            ...prev,
            [conversationId]: response.data || [],
          }));
        } catch (error) {
          if (error instanceof ApiError) {
            // Handle your custom API errors
            toast.error("Failed to load messages");
          } else {
            // Handle other errors (network, etc.)
            toast.error("Network error occurred");
          }
        }
      });

      // Handle incoming messages directly in provider
      socketInstance.on("conversation_message", (data) => {
        const { newMessage } = data;
        setMessages((prev) => ({
          ...prev,
          [newMessage.conversationId!]: [
            ...(prev[newMessage.conversationId!] || []),
            newMessage,
          ],
        }));
      });

      socketInstance.on("public_room_message", (data) => {
        const { newMessage } = data;
        setMessages((prev) => ({
          ...prev,
          [VITE_PUBLIC_ROOM]: [...(prev[VITE_PUBLIC_ROOM] || []), newMessage],
        }));
      });

      socketInstance.on("user_online", (onlineUsers) => {
        setOnlineUsers(onlineUsers);
      });

      socketInstance.on("user_offline", ({ userId }) => {
        setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      });

      socketInstance.on("newFriendRequest", (data) => {
        if (data.toUserId)
          queryClient.invalidateQueries({
            queryKey: ["friends-request", data.toUserId],
          });

        if (data.fromUserId)
          queryClient.invalidateQueries({
            queryKey: ["sent-request", data.fromUserId],
          });
      });

      socketInstance.on("respond_friend_req", (data) => {
        if (data.requestorId) {
          queryClient.invalidateQueries({
            queryKey: ["friends", data.requestorId],
          });
          queryClient.invalidateQueries({
            queryKey: ["sent-request", data.requestorId],
          });
        }

        if (data.toUserId) {
          queryClient.invalidateQueries({
            queryKey: ["friends", data.toUserId],
          });
          queryClient.invalidateQueries({
            queryKey: ["friends-request", data.toUserId],
          });
        }
      });

      socketInstance.on("remove_friend_req", (data) => {
        if (data.requestorId)
          queryClient.invalidateQueries({
            queryKey: ["sent-request", data.requestorId],
          });

        if (data.toUserId) {
          queryClient.invalidateQueries({
            queryKey: ["friends-request", data.toUserId],
          });
        }
      });

      socketInstance.on("typing", (data) => {
        setIsUserTyping((prev) => {
          if (
            prev.some(
              (item) =>
                item.from === data.from &&
                item.conversationId === data.conversationId
            )
          ) {
            return prev;
          }
          return [...prev, data];
        });

        socketInstance.on("remove_typing", (data) => {
          setIsUserTyping((prev) =>
            prev.filter(
              (item) =>
                !(
                  item.from === data.from &&
                  item.conversationId === data.conversationId
                )
            )
          );
        });
      });
    } else {
      socketService.disconnect();
      setSocket(null);
      setSocketState({
        isConnected: false,
        isConnecting: false,
        error: null,
        currentConversationId: null,
      });
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated]);

  const joinConversation = (otherUserId: string) => {
    socket?.emit("join_conversation", otherUserId);
  };

  const sendMessage = (conversationID: string, content: string) => {
    socket?.emit("conversation_message", conversationID, content);
  };

  const handleIsTyping = (conversationID: string) => {
    socket?.emit("typing", conversationID);
  };

  const handleRemoveIsTyping = (conversationID: string) => {
    socket?.emit("remove_typing", conversationID);
  };

  const sendMessageToPublic = (content: string) => {
    socket?.emit("public_room_message", content);
  };

  const clearMessages = () => {
    setMessages({});
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        socketState,
        messages,
        joinConversation,
        sendMessage,
        clearMessages,
        onlineUsers,
        setSocketState,
        handleIsTyping,
        setIsUserTyping,
        isUserTyping,
        handleRemoveIsTyping,
        sendMessageToPublic,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
