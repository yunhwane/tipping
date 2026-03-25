import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const notificationRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const items = await ctx.db.notification.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: { userId: ctx.session.user.id },
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: typeof cursor = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return { items, nextCursor };
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.notification.count({
      where: { userId: ctx.session.user.id, read: false },
    });
    return { count };
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.notification.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: { read: true },
      });
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.db.notification.updateMany({
      where: { userId: ctx.session.user.id, read: false },
      data: { read: true },
    });
  }),
});
