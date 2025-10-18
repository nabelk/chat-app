import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { useSocket } from "../context/socket-hook";
import { useSession } from "../lib/auth-client";
import { type Message } from "../types/api";
type GroupedMessages = Record<string, Message[]>;
import { motion, AnimatePresence } from "motion/react";

const groupMessagesByDate = (messages: Message[]): GroupedMessages => {
  return messages.reduce<GroupedMessages>((groups, msg) => {
    const dateKey = new Date(msg.createdAt).toDateString(); // "Mon Sep 29 2025"
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});
};

const formatDateLabel = (dateString: string) => {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (dateString === today) return "Today";
  if (dateString === yesterday) return "Yesterday";
  return dateString;
};

const ChatWindow = () => {
  const [newMessage, setNewMessage] = useState("");
  const {
    sendMessage,
    messages,
    socketState,
    setSocketState,
    handleIsTyping,
    isUserTyping,
    handleRemoveIsTyping,
    sendMessageToPublic,
  } = useSocket();
  const { data } = useSession();
  const { user } = data!;
  const endRef = useRef<HTMLDivElement>(null);
  const usersTyping =
    isUserTyping.length > 0
      ? isUserTyping.filter(
          (typing) =>
            typing.conversationId === socketState.currentConversationId &&
            typing.from !== user.id
        )
      : [];

  const { VITE_PUBLIC_ROOM } = import.meta.env;

  const handleMessageOnChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    const { currentConversationId } = socketState;
    const isTypingStored = isUserTyping.some(
      (typing) =>
        typing.conversationId === currentConversationId &&
        typing.from === user.id
    );
    if (
      e.target.value.trim() !== "" &&
      currentConversationId &&
      !isTypingStored
    ) {
      handleIsTyping(currentConversationId);
    }
    if (e.target.value.trim() === "" && currentConversationId) {
      handleRemoveIsTyping(currentConversationId);
    }
  };

  // Store previous conversationId to handle removeIsTyping
  const prevConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      prevConversationIdRef.current &&
      prevConversationIdRef.current !== socketState.currentConversationId
    ) {
      handleRemoveIsTyping(prevConversationIdRef.current);
    }
    prevConversationIdRef.current = socketState.currentConversationId;
    setNewMessage("");
  }, [socketState.currentConversationId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (prevConversationIdRef.current) {
        handleRemoveIsTyping(prevConversationIdRef.current);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [socketState.currentConversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "auto" });
  }, [socketState.currentConversationId, messages, isUserTyping]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const { currentConversationId } = socketState;

      if (currentConversationId) {
        if (currentConversationId === VITE_PUBLIC_ROOM) {
          sendMessageToPublic(newMessage);
        } else {
          sendMessage(currentConversationId, newMessage);
        }

        handleRemoveIsTyping(currentConversationId);
      }
    }
    setNewMessage("");
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {socketState.currentConversationId && (
          <motion.div
            initial={{ y: "30%", opacity: 0 }} // starts off screen
            animate={{ y: 0, opacity: 1 }} // slides up into view
            exit={{ y: "30%", opacity: 0 }} // slides back down when closing
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-[50%] sm:h-full sm:flex-1 bg-white shadow-2xl border-2 border-gray-400"
            style={{ fontFamily: "Tahoma, sans-serif" }}
          >
            {/* Window header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-1 flex items-center justify-between border-b border-purple-800">
              <span className="text-white font-bold text-xs">
                Instant Message
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() =>
                    setSocketState((prev) => ({
                      ...prev,
                      currentConversationId: null,
                    }))
                  }
                  className="cursor-pointer w-4 h-4 bg-red-500 border border-red-400 text-white text-xs flex items-center justify-center hover:bg-red-400"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="bg-gray-100 px-2 py-1 border-b border-gray-300 h-5"></div>

            {/* Chat messages area */}
            <div className="flex-1 flex flex-col h-[90%]">
              <div className="flex-1 overflow-y-auto p-3 bg-white">
                {messages[socketState.currentConversationId!] &&
                  Object.entries(
                    groupMessagesByDate(
                      messages[socketState.currentConversationId!]
                    )
                  ).map(([date, messages], idx) => (
                    <div key={date}>
                      {/* Divider */}

                      <div
                        className={`text-left text-sm text-gray-500 ${
                          idx === 0 ? "mb-2" : "my-2"
                        }`}
                      >
                        {formatDateLabel(date)}
                      </div>

                      {messages.map((message) => (
                        <div key={message.id} className="mb-0.5 text-left">
                          <span
                            className={
                              message.senderId !== user.id
                                ? "font-bold text-[#666666]"
                                : "font-bold text-[#0000CC]"
                            }
                          >
                            {message.user?.name}:
                          </span>

                          <span className="text-sm w-full ml-1 text-black">
                            {message.content}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}

                {usersTyping.length > 0 &&
                  usersTyping.map((t) => (
                    <div
                      key={t.from}
                      className="flex items-center space-x-2 mb-2"
                    >
                      <span className="animate-pulse text-purple-700 font-semibold text-xs">
                        {t.fromName} is typing...
                      </span>
                    </div>
                  ))}

                <div ref={endRef} />
              </div>

              {/* Message input area */}
              <div className="border-t border-gray-300 bg-gray-50 p-3">
                <div className="flex items-center space-x-2">
                  <textarea
                    value={newMessage}
                    onChange={handleMessageOnChange}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      (e.preventDefault(), handleSendMessage())
                    }
                    className="flex-1 px-2 py-1 border border-gray-400 text-sm h-14 text-black focus:border-black bg-white focus:outline-none resize-none"
                    style={{ fontFamily: "Tahoma, sans-serif" }}
                  />

                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-1 h-14  text-black text-sm border-2 rounded-xs border-gray-500 focus:outline-none"
                    style={{ fontFamily: "Tahoma, sans-serif" }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWindow;
