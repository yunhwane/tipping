import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const categoryRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.category.findMany({
      include: {
        topCategory: true,
        _count: { select: { tips: { where: { status: "APPROVED" } } } },
      },
      orderBy: [
        { topCategory: { sortOrder: "asc" } },
        { sortOrder: "asc" },
      ],
    });
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.category.findUnique({
        where: { slug: input.slug },
        include: { topCategory: true },
      });
    }),

  getTopCategories: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.topCategory.findMany({
      include: {
        categories: {
          include: {
            _count: { select: { tips: { where: { status: "APPROVED" } } } },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });
  }),
});
