import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { ensureApprovedTip } from "~/server/api/helpers/content-review";

export const commentRouter = createTRPCRouter({
  getByTipId: publicProcedure
    .input(
      z.object({
        tipId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tipId, limit, cursor } = input;

      const items = await ctx.db.comment.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: { tipId },
        include: {
          author: { select: { id: true, nickname: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      let nextCursor: string | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return { items, nextCursor };
    }),

  create: protectedProcedure
    .input(
      z.object({
        tipId: z.string(),
        content: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ensureApprovedTip(ctx.db, input.tipId);

      return ctx.db.comment.create({
        data: {
          content: input.content,
          tipId: input.tipId,
          authorId: ctx.user.id,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.findUnique({
        where: { id: input.id },
      });
      if (!comment || comment.authorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.comment.delete({ where: { id: input.id } });
    }),
});
