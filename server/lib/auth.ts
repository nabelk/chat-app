import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import db from "../db/index"; // your drizzle instance
import { user, session, account, verification } from "../db/schema"; // your schema
const { FRONTEND_URL } = process.env;

export const auth = betterAuth({
  emailAndPassword: { enabled: true },
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    httpOnly: true,
  },
  plugins: [openAPI()],
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
  },
  session: {
    cookieCache: { enabled: true, maxAge: 10 * 60 },
  },
  trustedOrigins: [FRONTEND_URL!], // Add your trusted origins here
});
