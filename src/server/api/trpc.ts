import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { createClient } from "~/lib/supabase/server";
import { db } from "~/server/db";

type DbUser = { id: string; nickname: string; email: string; image: string | null; role: string };

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const supabase = await createClient();

  // Lazy auth — Supabase Auth API 호출을 protectedProcedure에서만 수행
  type SupabaseUser = { id: string; email?: string };
  let cachedSupabaseUser: SupabaseUser | null | undefined;
  const getSupabaseUser = async (): Promise<SupabaseUser | null> => {
    if (cachedSupabaseUser !== undefined) return cachedSupabaseUser;
    const { data: { user } } = await supabase.auth.getUser();
    cachedSupabaseUser = user;
    return user;
  };

  // Lazy user getter — DB 조회는 실제로 호출될 때만 수행
  let cachedUser: DbUser | null | undefined;
  const getUser = async (): Promise<DbUser | null> => {
    if (cachedUser !== undefined) return cachedUser;
    const supabaseUser = await getSupabaseUser();
    if (!supabaseUser) {
      cachedUser = null;
      return null;
    }
    const user = await db.user.findUnique({
      where: { id: supabaseUser.id },
      select: { id: true, nickname: true, email: true, image: true, role: true },
    });
    cachedUser = user;
    return user;
  };

  return { db, getUser, supabase, ...opts };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();
  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  const result = await next();
  if (t._config.isDev) {
    const end = Date.now();
    console.log(`[TRPC] ${path} took ${end - start}ms to execute`);
  }
  return result;
});

export const publicProcedure = t.procedure.use(timingMiddleware);

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ ctx, next }) => {
    const user = await ctx.getUser();

    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next({ ctx: { user } });
  });

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});
