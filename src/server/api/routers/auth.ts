import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { createClient } from "@supabase/supabase-js";

export const authRouter = createTRPCRouter({
  /**
   * Sync Supabase Auth user to Prisma User table.
   * Verifies the user actually exists in Supabase Auth before creating.
   */
  syncUser: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        name: z.string().min(2, "이름은 2자 이상이어야 합니다"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { id: input.id },
      });
      if (existing) {
        return { success: true, userId: existing.id };
      }

      // Verify user exists in Supabase Auth using service role key
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(input.id);
      if (error || !data.user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "유효하지 않은 사용자입니다",
        });
      }

      const user = await ctx.db.user.create({
        data: { id: input.id, email: input.email, name: input.name },
      });
      return { success: true, userId: user.id };
    }),
});
