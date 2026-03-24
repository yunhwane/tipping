import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const adminRouter = createTRPCRouter({
  getDashboardStats: adminProcedure.query(async ({ ctx }) => {
    const [userCount, tipCount, projectCount, pendingTipCount, pendingProjectCount] =
      await Promise.all([
        ctx.db.user.count(),
        ctx.db.tip.count(),
        ctx.db.project.count(),
        ctx.db.tip.count({ where: { status: "PENDING" } }),
        ctx.db.project.count({ where: { status: "PENDING" } }),
      ]);

    const recentUsers = await ctx.db.user.findMany({
      take: 5,
      orderBy: { id: "desc" },
      select: { id: true, name: true, email: true, image: true, role: true },
    });

    const recentTips = await ctx.db.tip.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    const recentProjects = await ctx.db.project.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return {
      userCount,
      tipCount,
      projectCount,
      pendingTipCount,
      pendingProjectCount,
      recentUsers,
      recentTips,
      recentProjects,
    };
  }),

  getPendingTips: adminProcedure
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
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: true,
          tags: true,
        },
      });

      let nextCursor: typeof cursor = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return { items, nextCursor };
    }),

  getPendingProjects: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const items = await ctx.db.project.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, image: true } },
          tags: true,
        },
      });

      let nextCursor: typeof cursor = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return { items, nextCursor };
    }),

  reviewTip: adminProcedure
    .input(
      z.object({
        id: z.string(),
        action: z.enum(["approve", "reject"]),
        rejectionReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.action === "reject" && !input.rejectionReason) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Rejection reason is required" });
      }

      return ctx.db.tip.update({
        where: { id: input.id },
        data: {
          status: input.action === "approve" ? "APPROVED" : "REJECTED",
          rejectionReason: input.action === "reject" ? input.rejectionReason : null,
          reviewedAt: new Date(),
          reviewedBy: ctx.session.user.id,
        },
      });
    }),

  reviewProject: adminProcedure
    .input(
      z.object({
        id: z.string(),
        action: z.enum(["approve", "reject"]),
        rejectionReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.action === "reject" && !input.rejectionReason) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Rejection reason is required" });
      }

      return ctx.db.project.update({
        where: { id: input.id },
        data: {
          status: input.action === "approve" ? "APPROVED" : "REJECTED",
          rejectionReason: input.action === "reject" ? input.rejectionReason : null,
          reviewedAt: new Date(),
          reviewedBy: ctx.session.user.id,
        },
      });
    }),

  getAllTips: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().nullish(),
        status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status } = input;

      const items = await ctx.db.tip.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: status ? { status } : undefined,
        orderBy: { createdAt: "desc" },
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

  getAllProjects: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().nullish(),
        status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status } = input;

      const items = await ctx.db.project.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        where: status ? { status } : undefined,
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

  deleteTip: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tip.delete({ where: { id: input.id } });
    }),

  deleteProject: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.project.delete({ where: { id: input.id } });
    }),

  deleteComment: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.comment.delete({ where: { id: input.id } });
    }),

  getAllUsers: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const items = await ctx.db.user.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { id: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          _count: { select: { tips: true, projects: true } },
        },
      });

      let nextCursor: typeof cursor = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return { items, nextCursor };
    }),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["USER", "ADMIN"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Cannot change own role
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot change your own role" });
      }

      return ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });
    }),
});
