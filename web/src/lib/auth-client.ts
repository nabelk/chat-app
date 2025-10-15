import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL, // The base URL of your auth server
});

export const { useSession } = authClient;
