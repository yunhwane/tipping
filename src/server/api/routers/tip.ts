import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { checkContentAccess } from "~/server/api/helpers/content-review";

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
        status: "APPROVED" as const,
        ...(categorySlug && { category: { slug: categorySlug } }),
        ...(tagName && { tags: { some: { name: tagName } } }),
      };

      // viewCount 기반 정렬 — likes COUNT 서브쿼리 제거, 인덱스 활용
      const orderBy =
        sortBy === "popular"
          ? [
              { viewCount: "desc" as const },
              { createdAt: "desc" as const },
            ]
          : [{ createdAt: "desc" as const }];

      const items = await ctx.db.tip.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where,
        orderBy,
        include: {
          author: { select: { id: true, nickname: true, image: true } },
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

      return {
        items: items.map((item) => ({
          ...item,
          content: item.content.slice(0, 200),
        })),
        nextCursor,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tip = await ctx.db.tip.findUnique({
        where: { id: input.id },
        include: {
          author: { select: { id: true, nickname: true, image: true } },
          category: true,
          tags: true,
          _count: {
            select: { likes: true, comments: true, bookmarks: true },
          },
        },
      });

      if (!tip) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tip not found" });
      }

      checkContentAccess(tip, ctx.user);

      // Fire-and-forget: 응답 차단 없이 비동기 증가
      void ctx.db.tip.update({
        where: { id: input.id },
        data: { viewCount: { increment: 1 } },
      });

      return { ...tip, viewCount: tip.viewCount + 1 };
    }),

  getPopular: publicProcedure
    .input(
      z
        .object({ limit: z.number().min(1).max(20).default(10) })
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.tip.findMany({
        take: input.limit,
        where: { status: "APPROVED" },
        orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
        include: {
          author: { select: { id: true, nickname: true, image: true } },
          category: true,
          tags: true,
          _count: { select: { likes: true, comments: true } },
        },
      });
      return items.map((item) => ({
        ...item,
        content: item.content.slice(0, 200),
      }));
    }),

  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.tip.findMany({
        where: {
          status: "APPROVED",
          OR: [
            { title: { contains: input.query, mode: "insensitive" } },
            { content: { contains: input.query, mode: "insensitive" } },
          ],
        },
        include: {
          author: { select: { id: true, nickname: true, image: true } },
          category: true,
          tags: true,
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return items.map((item) => ({
        ...item,
        content: item.content.slice(0, 200),
      }));
    }),

  getMyTips: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const items = await ctx.db.tip.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: { authorId: ctx.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, nickname: true, image: true } },
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

      return {
        items: items.map((item) => ({
          ...item,
          content: item.content.slice(0, 200),
        })),
        nextCursor,
      };
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
          authorId: ctx.user.id,
          categoryId: input.categoryId,
          status: "PENDING",
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
      if (!tip || tip.authorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // APPROVED 상태는 수정해도 유지 (사후 관리 방식)
      // REJECTED인 경우에만 PENDING으로 재제출
      const newStatus = tip.status === "REJECTED" ? "PENDING" : tip.status;

      return ctx.db.tip.update({
        where: { id: input.id },
        data: {
          title: input.title,
          content: input.content,
          categoryId: input.categoryId,
          status: newStatus,
          ...(tip.status === "REJECTED" && {
            rejectionReason: null,
            reviewedAt: null,
            reviewedBy: null,
          }),
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
      if (!tip || tip.authorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.tip.delete({ where: { id: input.id } });
    }),
});
