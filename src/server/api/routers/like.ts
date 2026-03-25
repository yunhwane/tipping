import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { ensureApprovedTip } from "~/server/api/helpers/content-review";

export const likeRouter = createTRPCRouter({
  toggle: protectedProcedure
    .input(z.object({ tipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ensureApprovedTip(ctx.db, input.tipId);

      const existing = await ctx.db.like.findUnique({
        where: {
          userId_tipId: {
            userId: ctx.user.id,
            tipId: input.tipId,
          },
        },
      });

      if (existing) {
        await ctx.db.like.delete({
          where: {
            userId_tipId: {
              userId: ctx.user.id,
              tipId: input.tipId,
            },
          },
        });
        return { liked: false };
      }

      await ctx.db.like.create({
        data: {
          userId: ctx.user.id,
          tipId: input.tipId,
        },
      });
      return { liked: true };
    }),

  getStatus: protectedProcedure
    .input(z.object({ tipId: z.string() }))
    .query(async ({ ctx, input }) => {
      const like = await ctx.db.like.findUnique({
        where: {
          userId_tipId: {
            userId: ctx.user.id,
            tipId: input.tipId,
          },
        },
      });
      return { liked: !!like };
    }),

  getCount: publicProcedure
    .input(z.object({ tipId: z.string() }))
    .query(async ({ ctx, input }) => {
      const count = await ctx.db.like.count({
        where: { tipId: input.tipId },
      });
      return { count };
    }),
});
