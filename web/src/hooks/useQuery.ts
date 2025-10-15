import { useQuery, useMutation } from "@tanstack/react-query";
import type {
  FriendListResponse,
  SendFriendRequestData,
  SendFriendRequestResponse,
  FriendRequestResponse,
  RespondToFriendRequestData,
  RespondToFriendRequestResponse,
  SentFriendRequestResponse,
  RemoveSentFriendRequestData,
  RemoveSentFriendRequestResponse,
} from "../types/api";
import { api, ApiError } from "../lib/api-client";
import { toast } from "sonner";

export function useFriendList(userId: string) {
  return useQuery<FriendListResponse, ApiError>({
    queryKey: ["friends", userId],
    queryFn: () => api.get(`/friend/all/${userId}`),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: true,
  });
}

export function useFriendRequests(userId: string) {
  return useQuery<FriendRequestResponse, ApiError>({
    queryKey: ["friends-request", userId],
    queryFn: () => api.get(`/friend/all/requests/${userId}`),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: true,
  });
}

// Send friend request
export function useSendFriendRequest() {
  return useMutation<
    SendFriendRequestResponse,
    ApiError,
    SendFriendRequestData
  >({
    mutationFn: (data) => api.post("/friend/send-request", data),
    onSuccess: () => {
      toast.success("Friend request sent!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Respond to friend request
export function useRespondToFriendRequest() {
  return useMutation<
    RespondToFriendRequestResponse,
    ApiError,
    RespondToFriendRequestData
  >({
    mutationFn: (data) => api.post("/friend/response-request", data),
    onSuccess: (data) => {
      const { status } = data.data;

      if (status === "accepted") {
        toast.success(`Friend request accepted!`);
      } else {
        toast.success("Friend request rejected!");
      }
    },
  });
}

export function useSentFriendRequests(userId: string) {
  return useQuery<SentFriendRequestResponse, ApiError>({
    queryKey: ["sent-request", userId],
    queryFn: () => api.get(`/friend/all/sent-requests/${userId}`),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: true,
  });
}

export function useRemoveSentFriendRequest() {
  return useMutation<
    RemoveSentFriendRequestResponse,
    ApiError,
    RemoveSentFriendRequestData
  >({
    mutationFn: (data) => api.delete("/friend/remove-request", data),
    onSuccess: () => {
      toast.success("Friend request successfully deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete the request");
    },
  });
}
