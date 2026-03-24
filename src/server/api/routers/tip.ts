import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const tipRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().nullish(),
        categorySlug: z.string().optional(),
        tagName: z.string().optional(),
        sortBy: z.enum(["latest", "popular"]).default("latest"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, categorySlug, tagName, sortBy } = input;

      const where = {
        ...(categorySlug && { category: { slug: categorySlug } }),
        ...(tagName && { tags: { some: { name: tagName } } }),
      };

      const orderBy =
        sortBy === "popular"
          ? [
              { likes: { _count: "desc" as const } },
              { viewCount: "desc" as const },
            ]
          : [{ createdAt: "desc" as const }];

      const items = await ctx.db.tip.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy,
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: true,
          tags: true,
          _count: { select: { likes: true, comments: true } },
        },
      });

      let nextCursor: typeof cursor = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return { items, nextCursor };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tip = await ctx.db.tip.update({
        where: { id: input.id },
        data: { viewCount: { increment: 1 } },
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: true,
          tags: true,
          _count: {
            select: { likes: true, comments: true, bookmarks: true },
          },
        },
      });
      return tip;
    }),

  getPopular: publicProcedure
    .input(
      z
        .object({ limit: z.number().min(1).max(20).default(10) })
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.tip.findMany({
        take: input.limit,
        orderBy: [{ likes: { _count: "desc" } }, { viewCount: "desc" }],
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: true,
          tags: true,
          _count: { select: { likes: true, comments: true } },
        },
      });
    }),

  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tip.findMany({
        where: {
          OR: [
            { title: { contains: input.query, mode: "insensitive" } },
            { content: { contains: input.query, mode: "insensitive" } },
          ],
        },
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: true,
          tags: true,
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(1),
        categoryId: z.string(),
        tagNames: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tip.create({
        data: {
          title: input.title,
          content: input.content,
          authorId: ctx.session.user.id,
          categoryId: input.categoryId,
          tags: {
            connectOrCreate: input.tagNames.map((name) => ({
              where: { name },
              create: { name },
            })),
          },
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200),
        content: z.string().min(1),
        categoryId: z.string(),
        tagNames: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tip = await ctx.db.tip.findUnique({ where: { id: input.id } });
      if (!tip || tip.authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.tip.update({
        where: { id: input.id },
        data: {
          title: input.title,
          content: input.content,
          categoryId: input.categoryId,
          tags: {
            set: [],
            connectOrCreate: input.tagNames.map((name) => ({
              where: { name },
              create: { name },
            })),
          },
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tip = await ctx.db.tip.findUnique({ where: { id: input.id } });
      if (!tip || tip.authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.tip.delete({ where: { id: input.id } });
    }),
});
