import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const bookmarkRouter = createTRPCRouter({
  toggle: protectedProcedure
    .input(z.object({ tipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
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

  getMyBookmarks: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.bookmark.findMany({
      where: { userId: ctx.session.user.id },
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
  }),
});
