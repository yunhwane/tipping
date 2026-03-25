import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: { id: true, nickname: true, email: true, image: true, bio: true, links: true, role: true },
    });
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "사용자를 찾을 수 없습니다" });
    }
    return user;
  }),

  getProfileStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const [tipCount, projectCount, tipLikes, projectLikes] = await Promise.all([
      ctx.db.tip.count({ where: { authorId: userId, status: "APPROVED" } }),
      ctx.db.project.count({ where: { authorId: userId, status: "APPROVED" } }),
      ctx.db.like.count({ where: { tip: { authorId: userId } } }),
      ctx.db.projectLike.count({ where: { project: { authorId: userId } } }),
    ]);
    return { tipCount, projectCount, totalLikes: tipLikes + projectLikes };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        nickname: z.string().min(2, "닉네임은 2자 이상이어야 합니다").max(20, "닉네임은 20자 이하여야 합니다").transform((v) => v.trim()).optional(),
        image: z.string().url("올바른 URL이어야 합니다").optional(),
        bio: z.string().max(100, "한줄 소개는 100자 이하여야 합니다").transform((v) => v.trim() || null).nullish(),
        links: z.array(z.object({
          label: z.string().min(1).max(20).transform((v) => v.trim()),
          url: z.string().url("올바른 URL이어야 합니다").refine((url) => /^https?:\/\//.test(url), "HTTP(S) URL만 허용됩니다"),
        })).max(5).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const data: { nickname?: string; image?: string; bio?: string | null; links?: { label: string; url: string }[] } = {};
      if (input.nickname !== undefined) data.nickname = input.nickname;
      if (input.image !== undefined) data.image = input.image;
      if (input.bio !== undefined) data.bio = input.bio;
      if (input.links !== undefined) data.links = input.links;
      const user = await ctx.db.user.update({
        where: { id: ctx.user.id },
        data,
        select: { id: true, nickname: true, email: true, image: true, bio: true, links: true },
      });
      return user;
    }),
});
