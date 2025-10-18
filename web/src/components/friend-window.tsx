import {
  useState,
  type SetStateAction,
  type Dispatch,
  type FormEvent,
  useEffect,
} from "react";
import { authClient } from ".././lib/auth-client";
import { UserPlus, LogOut, RefreshCw, LoaderIcon } from "lucide-react";
import { toast } from "sonner";
import {
  useFriendList,
  useFriendRequests,
  useSendFriendRequest,
  useRespondToFriendRequest,
  useSentFriendRequests,
  useRemoveSentFriendRequest,
} from "../hooks/useQuery";
import { useSession } from "../lib/auth-client";
import { type Friend } from "../types/api";
import { useSocket } from "../context/socket-hook";
import StatusIcon, { GroupIcon } from "./status-icon";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const SendFriendRequestSection = ({
  showAddFriend,
  setShowAddFriend,
}: {
  showAddFriend: boolean;
  setShowAddFriend: Dispatch<SetStateAction<boolean>>;
}) => {
  const [newFriendEmail, setNewFriendEmail] = useState("");
  const { mutate, isPending } = useSendFriendRequest();

  const handleAddFriend = async (e: FormEvent) => {
    e.preventDefault();

    if (newFriendEmail.trim()) {
      mutate(
        {
          toUserEmail: newFriendEmail,
        },
        {
          onSuccess: () => {
            setShowAddFriend(false);
            setNewFriendEmail("");
          },
        }
      );
    }
  };

  return (
    <>
      {showAddFriend && (
        <div className="fixed inset-0 backdrop-blur bg-black/80  flex items-center justify-center z-50">
          <div
            className="bg-white border-2 border-gray-400 shadow-2xl"
            style={{ fontFamily: "Tahoma, sans-serif" }}
          >
            {/* Modal header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-1 flex items-center justify-between border-b border-purple-800">
              <span className="text-white font-normal text-xs">
                ADD A FRIEND
              </span>
              <button
                onClick={() => setShowAddFriend(false)}
                className="w-4 h-4 bg-red-500 border border-red-400 text-white text-xs flex items-center justify-center hover:bg-red-400"
              >
                ×
              </button>
            </div>

            {/* Modal content */}
            <form onSubmit={handleAddFriend} className="p-6">
              <div className="mb-4">
                <label className="block text-xs text-gray-700 mb-1">
                  Friend's Email:
                </label>
                <input
                  type="email"
                  value={newFriendEmail}
                  onChange={(e) => setNewFriendEmail(e.target.value)}
                  placeholder="friend@email.com"
                  className="w-64 text-black px-2 py-1 border border-gray-400 text-sm focus:border-blue-500 focus:outline-none"
                  style={{ fontFamily: "Tahoma, sans-serif" }}
                  required
                />
              </div>
              <div className="text-center space-x-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 inline-block disabled:cursor-not-allowed disabled:opacity-50 py-1 bg-gradient-to-b from-purple-400 to-purple-600 text-white text-sm border border-purple-700 hover:from-purple-500 hover:to-purple-700 focus:outline-none"
                >
                  {isPending && (
                    <span className="mr-2">
                      <LoaderIcon
                        className="animate-pulse inline-block"
                        size={"15px"}
                      />
                    </span>
                  )}
                  Add Friend
                </button>
                <button
                  onClick={() => {
                    setShowAddFriend(false);
                    setNewFriendEmail("");
                  }}
                  className="px-4 py-1 bg-gradient-to-b from-gray-400 to-gray-600 text-white text-sm border border-gray-700 hover:from-gray-500 hover:to-gray-700 focus:outline-none"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const FriendRequestSection = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id as string;
  const { data: data, isFetching, error, refetch } = useFriendRequests(userId);
  const friendRequests = data?.data;
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const { mutate } = useRespondToFriendRequest();

  if (error) {
    toast.error("Failed to load friend requests.");
  }

  const handleAcceptRequest = (requestId: string) => {
    mutate({
      status: "accepted",
      userId: userId,
      requestId: requestId,
    });
  };

  const handleRejectRequest = (requestId: string) => {
    mutate({
      status: "rejected",
      userId: userId,
      requestId: requestId,
    });
  };

  return (
    <>
      {/* Friend Requests Section */}

      <div className="mb-4 ">
        <div className="text-xs text-gray-600 font-semibold mb-2 px-1 text-left">
          Friend Requests ({friendRequests?.length || 0})
          <ChevronDown
            onClick={() => setIsOpen(!isOpen)}
            size={"15px"}
            className={`ml-1 inline-block cursor-pointer transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>

        {error && !isFetching && (
          <RefreshCw
            color="black"
            className="mx-auto cursor-pointer"
            size={"1rem"}
            onClick={() => refetch()}
          />
        )}

        {isFetching && (
          <div className="text-black text-xs">Loading friend requests...</div>
        )}

        {!isFetching &&
          !error &&
          isOpen &&
          friendRequests!.map((request) => (
            <div
              key={request.id}
              className="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded mb-2"
            >
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                {request?.fromUser?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-800">
                  {request?.fromUser?.name}
                </div>
                <div className="text-xs text-gray-500">
                  wants to be your friend
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleAcceptRequest(request.fromUser!.id)}
                  className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                  title="Accept"
                >
                  ✓
                </button>
                <button
                  onClick={() => handleRejectRequest(request.fromUser!.id)}
                  className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  title="Reject"
                >
                  ✗
                </button>
              </div>
            </div>
          ))}
      </div>
    </>
  );
};

const SentFriendRequestSection = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id as string;
  const {
    data: data,
    isFetching,
    error,
    refetch,
  } = useSentFriendRequests(userId);
  const sentFriendRequests = data?.data;
  const [isOpen, setIsOpen] = useState<boolean>(true);

  const { mutate } = useRemoveSentFriendRequest();

  if (error) {
    toast.error("Failed to load sent friend requests.");
  }

  const handleRejectRequest = (requestId: string, id: string) => {
    mutate({
      id,
      requestId,
    });
  };

  return (
    <>
      <div className="mb-4">
        <div className="text-xs text-gray-600 font-semibold mb-2 px-1 text-left">
          Sent Friend Requests ({sentFriendRequests?.length || 0})
          <ChevronDown
            onClick={() => setIsOpen(!isOpen)}
            size={"15px"}
            className={`ml-1 inline-block cursor-pointer transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>

        {error && !isFetching && (
          <RefreshCw
            color="black"
            className="mx-auto cursor-pointer"
            size={"1rem"}
            onClick={() => refetch()}
          />
        )}

        {isFetching && (
          <div className="text-black text-xs">
            Loading sent friend requests...
          </div>
        )}

        {!isFetching &&
          !error &&
          isOpen &&
          sentFriendRequests!.map((request) => (
            <div
              key={request.id}
              className="flex items-center space-x-2 p-2 mb-2"
            >
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                {request?.toUser?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-xs text-left font-medium text-gray-800">
                  {request?.toUser?.name}
                </div>
              </div>
              <div className="flex">
                <button
                  onClick={() => handleRejectRequest(userId, request.id)}
                  className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  title="Reject"
                >
                  Cancel Request
                </button>
              </div>
            </div>
          ))}
      </div>
    </>
  );
};

const FriendWindow = () => {
  const { data: session } = useSession();
  const { id, name } = session!.user;
  const { data, isFetching, error, refetch } = useFriendList(id);
  const friends = data?.data;
  const [showAddFriend, setShowAddFriend] = useState(false);
  const { socket, joinConversation, onlineUsers, socketState, setSocketState } =
    useSocket();
  const [activeConv, setActiveConv] = useState("");
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isWide, setIsWide] = useState(false);
  const { VITE_PUBLIC_ROOM } = import.meta.env;

  if (error) {
    toast.error("Failed to load friends list.");
  }

  const bye = async () => {
    const { error } = await authClient.signOut();
    if (error) {
      toast.error("You're not allowed to got out. Stay here! this is an error");
      return;
    }

    socket?.disconnect();
  };

  useEffect(() => {
    const handleResize = () => {
      setIsWide(window.innerWidth > 693);
    };

    // check once on mount
    handleResize();

    // listen for resize
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Add Friend Modal */}
      <SendFriendRequestSection
        showAddFriend={showAddFriend}
        setShowAddFriend={setShowAddFriend}
      />
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ y: "30%", opacity: 0 }}
          animate={{
            y: socketState.currentConversationId && !isWide ? -10 : 0,
            opacity: 1,
            x: socketState.currentConversationId && isWide ? -10 : 0,
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-[50%] sm:h-[60vh] sm:w-[50%] md:w-[45%] xl:w-80  bg-white shadow-2xl border-2 border-gray-400 flex flex-col"
          style={{ fontFamily: "Tahoma, sans-serif" }}
        >
          {/* Window header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-1 flex items-center justify-between border-b border-purple-800">
            <span className="text-white font-bold text-xs">
              YAHOO! MESSENGER
            </span>
          </div>

          {/* Menu bar */}
          <div className="bg-gray-100 px-2 py-1 border-b border-gray-300">
            <div className="flex justify-end items-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowAddFriend(true)}
                  className="cursor-pointer text-xs text-blue-600 hover:text-blue-800"
                  title="Add Friend"
                >
                  <UserPlus size={12} />
                </button>
                <button
                  className="text-xs cursor-pointer text-red-600 hover:text-red-800"
                  title="Sign Out"
                  onClick={bye}
                >
                  <LogOut size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* User info */}
          <div className="p-3 border-b border-gray-300 bg-gradient-to-b from-gray-50 to-white">
            <div className="flex items-center space-x-3">
              <div className="relative flex items-center">
                <StatusIcon status="online" title="Online" />
              </div>
              <div className="flex gap-2 items-center">
                <div className="text-xs font-semibold text-gray-800">
                  {name}
                </div>
                <div className="text-xs text-gray-600"> - Available</div>
              </div>
            </div>
          </div>

          {/* Friends list */}
          <div className="flex-1 overflow-y-auto p-2">
            <SentFriendRequestSection />
            <FriendRequestSection />

            <div className="text-xs text-gray-600 font-semibold mb-2 px-1 text-left">
              Friends ({friends?.length || 0}){" "}
              <ChevronDown
                onClick={() => setIsOpen(!isOpen)}
                size={"15px"}
                className={`ml-1 inline-block cursor-pointer transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>

            {error && !isFetching && (
              <RefreshCw
                color="black"
                className="mx-auto cursor-pointer"
                size={"1rem"}
                onClick={() => refetch()}
              />
            )}

            {isFetching && (
              <div className="text-black text-xs">Loading friend list...</div>
            )}

            <div
              onClick={() => {
                setActiveConv(VITE_PUBLIC_ROOM);
                setSocketState((prev) => ({
                  ...prev,
                  currentConversationId: VITE_PUBLIC_ROOM,
                }));
              }}
              className={`flex items-center space-x-3 p-2 mb-1 hover:bg-purple-100 cursor-pointer rounded ${
                activeConv === VITE_PUBLIC_ROOM &&
                socketState.currentConversationId &&
                "bg-purple-100"
              }`}
            >
              <div className="relative">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                  <GroupIcon title="Group" />
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xs text-left text-gray-800 font-bold">
                  General
                </div>
              </div>
            </div>

            {!isFetching &&
              !error &&
              isOpen &&
              friends?.map((f: Friend) => (
                <div
                  key={f?.friend?.id}
                  onClick={() => {
                    setActiveConv(f.friend!.id);
                    joinConversation(f.friend!.id);
                  }}
                  className={`flex items-center space-x-3 p-2 mb-1 hover:bg-purple-100 cursor-pointer rounded ${
                    activeConv === f.friend!.id &&
                    socketState.currentConversationId &&
                    "bg-purple-100"
                  }`}
                >
                  <div className="relative">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                      <StatusIcon
                        status={
                          onlineUsers.includes(f.friend!.id)
                            ? "online"
                            : "offline"
                        }
                        title={
                          onlineUsers.includes(f.friend!.id)
                            ? "Online"
                            : "Offline"
                        }
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div
                      className="text-xs text-left text-gray-800"
                      style={{
                        fontWeight: onlineUsers.includes(f.friend!.id)
                          ? "bold"
                          : "medium",
                      }}
                    >
                      {f?.friend?.name}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default FriendWindow;
