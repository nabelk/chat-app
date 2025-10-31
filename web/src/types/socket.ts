import { type Message } from "./api";

export interface ServerToClientEvents {
  conversation_message: (data: {
    from: string;
    fromName: string;
    content: string;
    newMessage: Message;
  }) => void;
  joined_conversation: (data: {
    conversationId: string;
    e2eEnabled: boolean;
  }) => void;
  error: (message: string) => void;
  user_online: (onlineUsers: string[]) => void;
  user_offline: (data: { userId: string }) => void;
  newFriendRequest: (data: { fromUserId: string; toUserId: string }) => void;
  respond_friend_req: (data: {
    requestorId?: string;
    toUserId?: string;
  }) => void;
  remove_friend_req: (data: {
    requestorId?: string;
    toUserId?: string;
  }) => void;
  typing: (data: {
    from: string;
    fromName: string;
    conversationId: string;
  }) => void;
  remove_typing: (data: { from: string; conversationId: string }) => void;
  public_room_message: (data: { newMessage: Message }) => void;
}

export interface ClientToServerEvents {
  join_conversation: (otherUserId: string) => void;
  conversation_message: (conversationID: string, content: string) => void;
  typing: (conversationID: string) => void;
  remove_typing: (conversationID: string) => void;
  public_room_message: (content: string) => void;
}

export interface SocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  currentConversationId: string | null;
}
