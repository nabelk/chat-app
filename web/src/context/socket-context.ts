import { createContext, type Dispatch, type SetStateAction } from "react";
import { Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketState,
} from "../types/socket";
import { type Message as M } from "../types/api";
import { type UserTyping } from "./socket-provider";

interface SocketContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  socketState: SocketState;
  joinConversation: (otherUserId: string) => void;
  sendMessage: (conversationID: string, content: string) => void;
  clearMessages: () => void;
  messages: {
    [conversationId: string]: M[];
  };
  onlineUsers: string[];
  setSocketState: Dispatch<SetStateAction<SocketState>>;
  handleIsTyping: (conversationId: string) => void;
  setIsUserTyping: Dispatch<SetStateAction<UserTyping[]>>;
  isUserTyping: UserTyping[];
  handleRemoveIsTyping: (conversationId: string) => void;
  sendMessageToPublic: (content: string) => void;
}

export const SocketContext = createContext<SocketContextType | undefined>(
  undefined
);
