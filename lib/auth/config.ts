import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models";
import { consumeRateLimit, getClientIp } from "@/lib/security/rate-limit";

const authUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "";
const isLocalAuthUrl =
  authUrl.includes("localhost") || authUrl.includes("127.0.0.1");
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, request) {
      if (!credentials?.email || !credentials?.password) return null;
      const email = String(credentials.email).trim().toLowerCase();
      const ip = request?.headers ? getClientIp(request.headers) : "unknown";

      const ipLimit = consumeRateLimit(`login:ip:${ip}`, {
        maxAttempts: 50,
        windowMs: 10 * 60 * 1000,
        blockMs: 15 * 60 * 1000,
      });
      const emailLimit = consumeRateLimit(`login:email:${email}`, {
        maxAttempts: 10,
        windowMs: 10 * 60 * 1000,
        blockMs: 15 * 60 * 1000,
      });
      if (!ipLimit.allowed || !emailLimit.allowed) return null;

      await connectDB();

      const user = await User.findOne({ email });
      if (!user) return null;

      const isValid = await bcrypt.compare(
        credentials.password as string,
        user.passwordHash
      );
      if (!isValid) return null;

      return {
        id: user._id.toString(),
        email: user.email,
        name: user.companyName || user.email,
      };
    },
  }),
];

if (googleClientId && googleClientSecret) {
  providers.unshift(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
}

export const authConfig: NextAuthConfig = {
  secret: authSecret,
  trustHost: process.env.AUTH_TRUST_HOST === "true" || isLocalAuthUrl,
  providers,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) {
        return true;
      }

      await connectDB();

      const normalizedEmail = user.email.toLowerCase();
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (existingUser) {
        user.id = existingUser._id.toString();
        return true;
      }

      const createdUser = await User.create({
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(randomUUID(), 12),
        companyName: user.name || normalizedEmail.split("@")[0],
      });

      user.id = createdUser._id.toString();
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }

      if (!token.id && typeof token.email === "string") {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email.toLowerCase() })
          .select("_id")
          .lean();

        if (dbUser?._id) {
          token.id = dbUser._id.toString();
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
