import { type ApiResponse } from "../lib/api-client";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FriendRequest {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  fromUserId: string;
  toUserId: string;
  status: string;
  fromUser?: User;
  toUser?: User;
}

export interface Friend {
  id: string;
  createdAt: Date;
  userId: string;
  friendId: string;
  user?: User;
  friend?: User;
}

export interface Message {
  conversationId?: string;
  id: string;
  createdAt: Date;
  senderId: string;
  content: string;
  user?: User;
}

export type SendFriendRequestData = {
  toUserEmail: string;
};

export type RemoveSentFriendRequestData = {
  id: string;
  requestId: string;
};

export type RespondToFriendRequestData = {
  requestId: string;
  userId: string;
  status: "accepted" | "rejected";
};

export type FriendListResponse = ApiResponse<Friend[]>;
export type SendFriendRequestResponse = ApiResponse<FriendRequest>;
export type FriendRequestResponse = ApiResponse<FriendRequest[]>;
export type RespondToFriendRequestResponse = ApiResponse<FriendRequest>;
export type MessagesResponse = ApiResponse<Message[]>;
export type SentFriendRequestResponse = ApiResponse<FriendRequest[]>;
export type RemoveSentFriendRequestResponse = ApiResponse<FriendRequest[]>;
