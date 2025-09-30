import db from "./index";
import type { Conversation, FriendRequest } from "./schema";
import {
  user,
  conversationParticipant,
  conversation,
  message,
  friendRequest,
  friends,
} from "./schema";
import { and, eq, inArray, or, sql, asc, not } from "drizzle-orm";

export const getOrCreateConversation = async (
  userIdA: string,
  userIdB: string
) => {
  // Check if a conversation between userA and userB already exists
  const existing = await db
    .select({
      conversationId: conversationParticipant.conversationId,
    })
    .from(conversationParticipant)
    .where(inArray(conversationParticipant.userId, [userIdA, userIdB]))
    .groupBy(conversationParticipant.conversationId)
    .having(sql`COUNT(DISTINCT ${conversationParticipant.userId}) = 2`);

  console.log("Existing conversations:", existing);

  if (existing.length > 0) {
    return existing[0].conversationId;
  }

  // If not, create a new conversation
  const newConversation = (await db
    .insert(conversation)
    .values({})
    .returning()) as unknown as Conversation[];

  console.log("New conversation created:", newConversation);

  //   Add both users as participants
  await db
    .insert(conversationParticipant)
    .values([
      { conversationId: newConversation[0].id, userId: userIdA },
      { conversationId: newConversation[0].id, userId: userIdB },
    ])
    .returning();

  return newConversation[0].id;
};

export const insertMessage = async ({
  conversationId,
  senderId,
  content,
}: {
  conversationId: string;
  senderId: string;
  content: string;
}) => {
  return await db.transaction(async (tx) => {
    const [newMessage] = await tx
      .insert(message)
      .values({
        conversationId,
        senderId,
        content,
      })
      .returning();

    const messageWithUserRelation = await tx.query.message.findFirst({
      where: eq(message.id, newMessage.id),
      with: { user: true },
    });

    return messageWithUserRelation;
  });
};

export const validateCanChat = async (
  currentUserId: string,
  otherUserId: string
): Promise<boolean> => {
  const users = await db.select().from(user).where(eq(user.id, otherUserId)); // Check if the user exists
  const isFriend = await db
    .select()
    .from(friends)
    .where(
      and(eq(friends.userId, currentUserId), eq(friends.friendId, otherUserId))
    ); // Check if they are friends

  return users.length > 0 && isFriend.length > 0;
};

export const friendRequests = async (fromUserId: string, toUserId: string) => {
  const existingRequest = await db
    .select()
    .from(friendRequest)
    .where(
      or(
        and(
          eq(friendRequest.fromUserId, fromUserId),
          eq(friendRequest.toUserId, toUserId)
        ),
        and(
          eq(friendRequest.fromUserId, toUserId),
          eq(friendRequest.toUserId, fromUserId)
        )
      )
    );

  if (existingRequest.length > 0 && existingRequest[0].status === "rejected") {
    const requestAgain = await db
      .update(friendRequest)
      .set({
        status: "pending",
        fromUserId,
        toUserId,
      })
      .where(eq(friendRequest.id, existingRequest[0].id))
      .returning();
    return requestAgain[0];
  }

  if (existingRequest.length > 0 && existingRequest[0].status === "accepted")
    throw new Error("You're already friend with the requested user.");

  if (existingRequest.length > 0 && existingRequest[0].status === "pending") {
    throw new Error(
      "Friend request already sent from you or other away around."
    );
  }

  const newRequest = (await db
    .insert(friendRequest)
    .values({
      fromUserId,
      status: "pending",
      toUserId,
    })
    .returning()) as unknown as FriendRequest[];

  return newRequest[0];
};

export const respondtoFriendRequest = async (
  requestId: string,
  userId: string,
  status: "accepted" | "rejected"
) => {
  const requests = await db
    .select()
    .from(friendRequest)
    .where(
      and(
        eq(friendRequest.fromUserId, requestId),
        eq(friendRequest.toUserId, userId)
      )
    );

  if (requests.length === 0) {
    throw new Error("Friend request not found.");
  }

  if (requests[0].status !== "pending") {
    throw new Error("Friend request already responded to.");
  }

  return db.transaction(async (tx) => {
    // Update the friend request status
    const updatedRequest = await tx
      .update(friendRequest)
      .set({ status })
      .where(eq(friendRequest.id, requests[0].id))
      .returning();

    if (status === "accepted") {
      // Add each user to the other's friends list
      await tx.insert(friends).values([
        { userId: requestId, friendId: userId },
        { userId: userId, friendId: requestId },
      ]);
    }

    if (updatedRequest.length === 0) {
      throw new Error("Failed to update friend request.");
    }

    return updatedRequest[0];
  });
};

export const friendList = async (userId: string) => {
  const friendsList = await db.query.friends.findMany({
    columns: { userId: false, friendId: false },
    where: eq(friends.userId, userId),
    with: {
      user: true,
      friend: true,
    },
  });

  return friendsList;
};

export const getMessages = async (conversationId: string) => {
  const messages = await db.query.message.findMany({
    where: eq(message.conversationId, conversationId),
    orderBy: [asc(message.createdAt)],
    with: {
      user: true,
    },
  });

  return messages;
};

export const getUserIdByEmail = async (email: string) => {
  const users = await db.select().from(user).where(eq(user.email, email));
  if (users.length === 0) {
    throw new Error("User with the provided email does not exist.");
  }
  return users[0].id;
};

export const getFriendRequest = async (userId: string) => {
  const List = await db.query.friendRequest.findMany({
    where: and(
      eq(friendRequest.toUserId, userId),
      not(eq(friendRequest.status, "accepted")),
      not(eq(friendRequest.status, "rejected"))
    ),

    with: {
      fromUser: true,
    },
  });

  return List;
};

export const getSentFriendRequest = async (userId: string) => {
  const List = await db.query.friendRequest.findMany({
    where: and(
      eq(friendRequest.fromUserId, userId),
      eq(friendRequest.status, "pending")
    ),

    with: {
      toUser: true,
    },
  });

  return List;
};

export const cancelSentFriendRequest = async (
  id: string,
  fromUserId: string
) => {
  return await db
    .delete(friendRequest)
    .where(
      and(eq(friendRequest.id, id), eq(friendRequest.fromUserId, fromUserId))
    )
    .returning();
};

export const getConversation = async (conversationId: string) => {
  const conv = await db.query.conversationParticipant.findMany({
    where: eq(conversationParticipant.conversationId, conversationId),
  });

  return conv;
};
