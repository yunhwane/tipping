import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const tagRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.tag.findMany({
      include: { _count: { select: { tips: true } } },
      orderBy: { name: "asc" },
    });
  }),

  getPopular: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.tag.findMany({
      include: { _count: { select: { tips: true } } },
      orderBy: { tips: { _count: "desc" } },
      take: 20,
    });
  }),
});
