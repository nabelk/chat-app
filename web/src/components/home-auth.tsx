import { type ChangeEvent, useState, type FormEvent } from "react";
import { authClient } from "../lib/auth-client";
import { toast } from "sonner";
import { LoaderIcon } from "lucide-react";

type CustomErr = {
  code?: string | undefined;
  message?: string | undefined;
  status: number;
  statusText: string;
  details: {
    cause: {
      detail: string;
    };
  };
};

const YahooMessengerAuth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    setIsLoading(true);
    e.preventDefault();

    const { username, confirmPassword, password, email } = formData;

    if (isSignUp && password !== confirmPassword) {
      setIsLoading(false);
      return toast.error("Password not match");
    }

    const { error } = isSignUp
      ? await authClient.signUp.email({
          email: email,
          name: username,
          password: password,
        })
      : await authClient.signIn.email({
          email: email,
          password: password,
        });
    if (error) {
      const err = error as CustomErr;

      if (err?.details && err.details.cause.detail?.includes("Key (name)=(")) {
        setIsLoading(false);
        return toast.error("Username has been taken");
      }

      setIsLoading(false);
      return toast.error(error.message);
    }
    setIsLoading(false);
    return toast.success("You're sucessfully logged in");
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="h-[100dvh] flex items-center justify-center p-4">
      <div className="relative w-[80dvw] sm:min-w-sm sm:w-full  ">
        <div
          className="bg-white rounded-none shadow-2xl border-2 border-gray-400 overflow-hidden"
          style={{ fontFamily: "Tahoma, sans-serif" }}
        >
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-1 flex items-center justify-between border-b border-purple-800">
            <div className="flex items-center space-x-2">
              <span className="text-white font-normal text-xs">
                YAHOO! MESSENGER
              </span>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
            <div className="text-center mb-6">
              <div className="relative inline-block mb-4">
                <img src="Yahoo_logo.svg" />
              </div>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit}>
              {isSignUp && (
                <div>
                  <label className="text-left block text-xs text-gray-700 mb-1 font-normal">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    placeholder="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="text-black w-full px-2 py-1 border border-gray-400 text-sm focus:border-blue-500 focus:outline-none bg-white"
                    style={{ fontFamily: "Tahoma, sans-serif" }}
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-left block text-xs text-gray-700 mb-1 font-normal">
                  Email address:
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="email@domain.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  autoComplete="email"
                  className="text-black w-full px-2 py-1 border border-gray-400 text-sm focus:border-blue-500 focus:outline-none bg-white"
                  style={{ fontFamily: "Tahoma, sans-serif" }}
                  required
                />
              </div>

              <div>
                <label className="text-left block text-xs text-gray-700 mb-1 font-normal">
                  Password:
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="text-black w-full px-2 py-1 border border-gray-400 text-sm focus:border-blue-500 focus:outline-none bg-white"
                  style={{ fontFamily: "Tahoma, sans-serif" }}
                  required
                  autoComplete="password"
                />
              </div>

              {isSignUp && (
                <div>
                  <label className="text-left block text-xs text-gray-700 mb-1 font-normal">
                    Confirm password:
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    autoComplete="confirm-password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="text-black w-full px-2 py-1 border border-gray-400 text-sm focus:border-blue-500 focus:outline-none bg-white"
                    style={{ fontFamily: "Tahoma, sans-serif" }}
                    required
                  />
                </div>
              )}

              {!isSignUp && (
                <div className="text-center py-2">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-blue-600 hover:text-blue-800 text-xs underline"
                    style={{ fontFamily: "Tahoma, sans-serif" }}
                  >
                    Get a new Yahoo! ID...
                  </button>
                </div>
              )}

              <div className="pt-4 text-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 px-8 py-2 bg-gradient-to-b from-purple-400 to-purple-600 text-white text-sm border border-purple-700 hover:from-purple-500 hover:to-purple-700 focus:outline-none shadow-sm"
                  style={{ fontFamily: "Tahoma, sans-serif" }}
                >
                  {isLoading && (
                    <LoaderIcon
                      className="animate-pulse inline-block"
                      size={"15px"}
                    />
                  )}{" "}
                  {isSignUp ? "Create Account" : "Sign In"}
                </button>
              </div>

              {!isSignUp && (
                <div className="text-center pt-3">
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 text-xs underline"
                    style={{ fontFamily: "Tahoma, sans-serif" }}
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
            </form>

            {isSignUp && (
              <div className="mt-4 text-center">
                <span
                  className="text-gray-600 text-xs"
                  style={{ fontFamily: "Tahoma, sans-serif" }}
                >
                  Already have an account?
                </span>
                <button
                  onClick={toggleMode}
                  className="ml-2 text-blue-600 hover:text-blue-800 text-xs underline"
                  style={{ fontFamily: "Tahoma, sans-serif" }}
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YahooMessengerAuth;
