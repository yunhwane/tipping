import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const authRouter = createTRPCRouter({
  checkEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });
      return { available: !existing };
    }),

  checkNickname: publicProcedure
    .input(z.object({ nickname: z.string().min(2).max(20) }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { nickname: input.nickname },
        select: { id: true },
      });
      return { available: !existing };
    }),

  syncUser: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        nickname: z.string().min(2, "닉네임은 2자 이상이어야 합니다").max(20, "닉네임은 20자 이하여야 합니다"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { id: input.id },
      });
      if (existing) {
        return { success: true, userId: existing.id };
      }

      const nicknameInUse = await ctx.db.user.findUnique({
        where: { nickname: input.nickname },
        select: { id: true },
      });
      if (nicknameInUse) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "이미 사용 중인 닉네임입니다",
        });
      }

      const user = await ctx.db.user.create({
        data: { id: input.id, email: input.email, nickname: input.nickname },
      });
      return { success: true, userId: user.id };
    }),
});
