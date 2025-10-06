import {
  friendList,
  friendRequests,
  respondtoFriendRequest,
  getUserIdByEmail,
  getFriendRequest,
  getSentFriendRequest,
  cancelSentFriendRequest,
} from "../db/queries";
import { Request, Response } from "express";
import { type Friend, type FriendRequest } from "../db/schema";
import { io, onlineUsers } from "../server";

const sendRequestToFriend = async (req: Request, res: Response) => {
  try {
    const { toUserEmail } = req.body;

    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const getToUserIdfromEmail = (await getUserIdByEmail(
      toUserEmail
    )) as string;

    if (getToUserIdfromEmail === req.userId)
      return res.status(403).json({ error: "Cannot add yourself" });

    if (!getToUserIdfromEmail) {
      return res.status(400).json({ error: " toUserId are required." });
    }

    const friends = (await friendRequests(
      req.userId,
      getToUserIdfromEmail
    )) as any as FriendRequest;

    if (friends) {
      const targetSockets = {
        from: onlineUsers.get(friends.fromUserId),
        to: onlineUsers.get(friends.toUserId),
      };

      if (targetSockets.to?.size) {
        io.to([...targetSockets.to]).emit("newFriendRequest", {
          toUserId: friends.toUserId,
        });
      }

      if (targetSockets.from?.size) {
        io.to([...targetSockets.from]).emit("newFriendRequest", {
          fromUserId: friends.fromUserId,
        });
      }
    }

    return res.status(201).json({
      message: "Friend request sent successfully.",
      data: friends,
    });
  } catch (err: any) {
    if (err.message) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Internal server error." });
  }
};

const respondToFriendRequest = async (req: Request, res: Response) => {
  try {
    const { requestId, userId, status } = req.body;

    if (userId !== req.userId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    if (!requestId || !userId || !status) {
      return res
        .status(400)
        .json({ error: "requestId, userId, and status are required." });
    }

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    const updatedRequest = (await respondtoFriendRequest(
      requestId,
      userId,
      status
    )) as any as FriendRequest;

    if (updatedRequest) {
      const [targetSockets, otherTargetSockets] = [
        onlineUsers.get(updatedRequest.fromUserId),
        onlineUsers.get(updatedRequest.toUserId),
      ];

      if (targetSockets && targetSockets.size > 0) {
        io.to(Array.from(targetSockets)).emit("respond_friend_req", {
          requestorId: updatedRequest.fromUserId,
        });
      }

      if (otherTargetSockets && otherTargetSockets.size > 0) {
        io.to(Array.from(otherTargetSockets)).emit("respond_friend_req", {
          toUserId: updatedRequest.toUserId,
        });
      }
    }

    return res.status(200).json({
      message: `Friend request ${status} successfully.`,
      data: updatedRequest,
    });
  } catch (error: any) {
    if (error.message) {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ error: "Internal server error." });
  }
};

const getFrendList = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (userId !== req.userId)
      return res
        .status(401)
        .json({ error: "You aren't able to see other's friends" });

    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }

    const friends = (await friendList(userId)) as any as Friend[];

    return res.status(200).json({
      message: "Friend list fetched successfully.",
      data: friends,
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error." });
  }
};

const getFriendRequestList = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (userId !== req.userId)
      return res
        .status(401)
        .json({ error: "You aren't able to see other's friends'requests" });

    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }

    const friends = (await getFriendRequest(userId)) as any as FriendRequest[];

    return res.status(200).json({
      message: "Friend requests list fetched successfully.",
      data: friends,
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error." });
  }
};

const getSentFriendRequestList = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (userId !== req.userId)
      return res.status(401).json({
        error: "You aren't able to see other's sent friend requests.",
      });

    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }

    const sent = (await getSentFriendRequest(userId)) as any as FriendRequest[];

    return res.status(200).json({
      message: "Sent friend requests fetched successfully.",
      data: sent,
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error." });
  }
};

const removeSentFriendRequest = async (req: Request, res: Response) => {
  try {
    const { requestId, id } = req.body;

    if (requestId !== req.userId) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    if (!requestId || !id) {
      return res.status(400).json({ error: "requestId & id are required." });
    }

    const [removeRequest, ...rest] = (await cancelSentFriendRequest(
      id,
      requestId
    )) as any as FriendRequest[];

    if (removeRequest) {
      const [targetSockets, otherTargetSockets] = [
        onlineUsers.get(removeRequest.fromUserId),
        onlineUsers.get(removeRequest.toUserId),
      ];

      if (targetSockets && targetSockets.size > 0) {
        io.to(Array.from(targetSockets)).emit("remove_friend_req", {
          requestorId: removeRequest.fromUserId,
        });
      }

      if (otherTargetSockets && otherTargetSockets.size > 0) {
        io.to(Array.from(otherTargetSockets)).emit("remove_friend_req", {
          toUserId: removeRequest.toUserId,
        });
      }
    }

    return res.status(200).json({
      message: `Friend request successfully deleted.`,
      data: removeRequest,
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error." });
  }
};

export {
  sendRequestToFriend,
  getFrendList,
  respondToFriendRequest,
  getFriendRequestList,
  removeSentFriendRequest,
  getSentFriendRequestList,
};
