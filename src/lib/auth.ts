import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import jwt from "jsonwebtoken";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8001";
const NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production";

export const authOptions: NextAuthOptions = {
  secret: NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(
            `${BACKEND_URL}/api/credential-auth/verify`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            },
          );

          if (!res.ok) return null;

          const user = await res.json();

          // Admin-only: reject non-admin users
          if (user.role !== "admin") return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as { role?: string }).role || "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  jwt: {
    encode: async ({ token, secret }) => {
      if (!token) return "";
      return jwt.sign(token as object, secret as string, {
        algorithm: "HS256",
      });
    },
    decode: async ({ token, secret }) => {
      if (!token) return null;
      try {
        return jwt.verify(token, secret as string, {
          algorithms: ["HS256"],
        }) as ReturnType<typeof jwt.verify> & Record<string, unknown>;
      } catch {
        return null;
      }
    },
  },
};
