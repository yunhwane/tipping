import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const commentRouter = createTRPCRouter({
  getByTipId: publicProcedure
    .input(z.object({ tipId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.comment.findMany({
        where: { tipId: input.tipId },
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        tipId: z.string(),
        content: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Only allow commenting on APPROVED tips
      const tip = await ctx.db.tip.findUnique({
        where: { id: input.tipId },
        select: { status: true },
      });
      if (!tip || tip.status !== "APPROVED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot comment on non-approved content" });
      }

      return ctx.db.comment.create({
        data: {
          content: input.content,
          tipId: input.tipId,
          authorId: ctx.session.user.id,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.findUnique({
        where: { id: input.id },
      });
      if (!comment || comment.authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.comment.delete({ where: { id: input.id } });
    }),
});
