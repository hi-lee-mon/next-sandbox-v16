import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

export const auth = betterAuth({
  appName: "next-sandbox",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),

  emailAndPassword: {
    enabled: true,
  },

  // SFでログインのようなcookieを扱う処理を行うために必要 https://better-auth.com/docs/integrations/next#server-action-cookies
  plugins: [nextCookies()]
});

export type Session = typeof auth.$Infer.Session;
