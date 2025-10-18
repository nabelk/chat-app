import "./App.css";
import YahooMessengerAuth from "./components/home-auth";
import { useSession } from "./lib/auth-client";
import YahooMessengerChat from "./components/main-chatbox";
import { SocketProvider } from "./context/socket-provider";
import { LoaderIcon } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";

function App() {
  const { data: session, isPending } = useSession();

  if (isPending) return <LoaderIcon className="text-black animate-pulse" />;

  return (
    <>
      <ErrorBoundary
        fallback={<div className="text-red-600">Something went wrong</div>}
      >
        {session ? (
          <SocketProvider isAuthenticated={session.session}>
            <YahooMessengerChat />
          </SocketProvider>
        ) : (
          <YahooMessengerAuth />
        )}
      </ErrorBoundary>
    </>
  );
}

export default App;
