import FriendWindow from "./friend-window";
import ChatWindow from "./chat-window";
import { useSocket } from "../context/socket-hook";

const YahooMessengerChat = () => {
  const { socketState } = useSocket();
  return (
    <div>
      <div
        className={`flex-col w-[80vw] sm:flex-row sm:w-[90vw] h-[85vh] xl:w-[65vw] sm:h-[60vh] flex gap-2 ${
          !socketState.currentConversationId && "justify-center"
        }`}
      >
        {socketState.isConnected && (
          <>
            <FriendWindow /> <ChatWindow />
          </>
        )}
      </div>
    </div>
  );
};

export default YahooMessengerChat;
