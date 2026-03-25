import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { ensureApprovedTip } from "~/server/api/helpers/content-review";

export const bookmarkRouter = createTRPCRouter({
  toggle: protectedProcedure
    .input(z.object({ tipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ensureApprovedTip(ctx.db, input.tipId);

      const existing = await ctx.db.bookmark.findUnique({
        where: {
          userId_tipId: {
            userId: ctx.session.user.id,
            tipId: input.tipId,
          },
        },
      });

      if (existing) {
        await ctx.db.bookmark.delete({
          where: {
            userId_tipId: {
              userId: ctx.session.user.id,
              tipId: input.tipId,
            },
          },
        });
        return { bookmarked: false };
      }

      await ctx.db.bookmark.create({
        data: {
          userId: ctx.session.user.id,
          tipId: input.tipId,
        },
      });
      return { bookmarked: true };
    }),

  getStatus: protectedProcedure
    .input(z.object({ tipId: z.string() }))
    .query(async ({ ctx, input }) => {
      const bookmark = await ctx.db.bookmark.findUnique({
        where: {
          userId_tipId: {
            userId: ctx.session.user.id,
            tipId: input.tipId,
          },
        },
      });
      return { bookmarked: !!bookmark };
    }),

  getMyBookmarks: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const items = await ctx.db.bookmark.findMany({
        take: limit + 1,
        cursor: cursor
          ? { userId_tipId: { userId: ctx.session.user.id, tipId: cursor } }
          : undefined,
        where: {
          userId: ctx.session.user.id,
          tip: { status: "APPROVED" },
        },
        include: {
          tip: {
            include: {
              author: { select: { id: true, name: true, image: true } },
              category: true,
              tags: true,
              _count: { select: { likes: true, comments: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.tipId;
      }

      return { items, nextCursor };
    }),
});
