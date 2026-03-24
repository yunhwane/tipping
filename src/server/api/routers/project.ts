import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const projectRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(20),
          cursor: z.string().nullish(),
        })
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const items = await ctx.db.project.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, image: true } },
          tags: true,
          _count: { select: { likes: true } },
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
      return ctx.db.project.update({
        where: { id: input.id },
        data: { viewCount: { increment: 1 } },
        include: {
          author: { select: { id: true, name: true, image: true } },
          tags: true,
          _count: { select: { likes: true } },
        },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().min(1),
        url: z.string().url().optional(),
        imageUrl: z.string().url().optional(),
        tagNames: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.project.create({
        data: {
          title: input.title,
          description: input.description,
          url: input.url,
          imageUrl: input.imageUrl,
          authorId: ctx.session.user.id,
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
        description: z.string().min(1),
        url: z.string().url().optional(),
        imageUrl: z.string().url().optional(),
        tagNames: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
      });
      if (!project || project.authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.project.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          url: input.url,
          imageUrl: input.imageUrl,
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
      const project = await ctx.db.project.findUnique({
        where: { id: input.id },
      });
      if (!project || project.authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.project.delete({ where: { id: input.id } });
    }),

  toggleLike: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.projectLike.findUnique({
        where: {
          userId_projectId: {
            userId: ctx.session.user.id,
            projectId: input.projectId,
          },
        },
      });

      if (existing) {
        await ctx.db.projectLike.delete({
          where: {
            userId_projectId: {
              userId: ctx.session.user.id,
              projectId: input.projectId,
            },
          },
        });
        return { liked: false };
      }

      await ctx.db.projectLike.create({
        data: {
          userId: ctx.session.user.id,
          projectId: input.projectId,
        },
      });
      return { liked: true };
    }),
});
