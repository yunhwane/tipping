import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import type { Role } from "../../../generated/prisma";

import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    GitHubProvider,
  ],
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user?.id) {
        token.sub = user.id;
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        token.role = dbUser?.role ?? "USER";
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub!,
        role: (token.role as Role) ?? "USER",
      },
    }),
  },
} satisfies NextAuthConfig;
