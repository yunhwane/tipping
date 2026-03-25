import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { reviewContent } from "~/server/api/helpers/content-review";

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

  // --- 통합 검수 대기열 ---

  getPendingContents: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        type: z.enum(["tip", "project"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, type } = input;

      const fetchTips = !type || type === "tip";
      const fetchProjects = !type || type === "project";

      const [tips, projects] = await Promise.all([
        fetchTips
          ? ctx.db.tip.findMany({
              where: { status: "PENDING" },
              orderBy: { createdAt: "asc" },
              take: limit,
              include: {
                author: { select: { id: true, name: true, image: true } },
                category: true,
                tags: true,
              },
            })
          : [],
        fetchProjects
          ? ctx.db.project.findMany({
              where: { status: "PENDING" },
              orderBy: { createdAt: "asc" },
              take: limit,
              include: {
                author: { select: { id: true, name: true, image: true } },
                tags: true,
              },
            })
          : [],
      ]);

      const items = [
        ...tips.map((t) => ({
          id: t.id,
          contentType: "tip" as const,
          title: t.title,
          preview: t.content.slice(0, 200),
          author: t.author,
          category: t.category,
          tags: t.tags,
          createdAt: t.createdAt,
        })),
        ...projects.map((p) => ({
          id: p.id,
          contentType: "project" as const,
          title: p.title,
          preview: p.description.slice(0, 200),
          author: p.author,
          category: null,
          tags: p.tags,
          createdAt: p.createdAt,
        })),
      ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      return { items: items.slice(0, limit) };
    }),

  // --- 통합 콘텐츠 관리 ---

  getAllContents: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        type: z.enum(["tip", "project"]).optional(),
        status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, type, status } = input;

      const fetchTips = !type || type === "tip";
      const fetchProjects = !type || type === "project";

      const statusFilter = status ? { status } : undefined;

      const [tips, projects] = await Promise.all([
        fetchTips
          ? ctx.db.tip.findMany({
              take: limit,
              where: statusFilter,
              orderBy: { createdAt: "desc" },
              include: {
                author: { select: { id: true, name: true, image: true } },
                category: true,
                tags: true,
                _count: { select: { likes: true, comments: true } },
              },
            })
          : [],
        fetchProjects
          ? ctx.db.project.findMany({
              take: limit,
              where: statusFilter,
              orderBy: { createdAt: "desc" },
              include: {
                author: { select: { id: true, name: true, image: true } },
                tags: true,
                _count: { select: { likes: true } },
              },
            })
          : [],
      ]);

      const items = [
        ...tips.map((t) => ({
          id: t.id,
          contentType: "tip" as const,
          title: t.title,
          status: t.status,
          author: t.author,
          category: t.category,
          tags: t.tags,
          likeCount: t._count.likes,
          commentCount: t._count.comments,
          createdAt: t.createdAt,
        })),
        ...projects.map((p) => ({
          id: p.id,
          contentType: "project" as const,
          title: p.title,
          status: p.status,
          author: p.author,
          category: null,
          tags: p.tags,
          likeCount: p._count.likes,
          commentCount: 0,
          createdAt: p.createdAt,
        })),
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return { items: items.slice(0, limit) };
    }),

  // --- 통합 검수 처리 ---

  reviewContent: adminProcedure
    .input(
      z.object({
        type: z.enum(["tip", "project"]),
        id: z.string(),
        action: z.enum(["approve", "reject"]),
        rejectionReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return reviewContent(ctx.db, {
        type: input.type,
        id: input.id,
        action: input.action,
        rejectionReason: input.rejectionReason,
        reviewerId: ctx.session.user.id,
      });
    }),

  // --- 일괄 검수 ---

  bulkReview: adminProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            type: z.enum(["tip", "project"]),
            id: z.string(),
          }),
        ),
        action: z.enum(["approve", "reject"]),
        rejectionReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.action === "reject" && !input.rejectionReason) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Rejection reason is required for bulk reject",
        });
      }

      const results = await Promise.allSettled(
        input.items.map((item) =>
          reviewContent(ctx.db, {
            type: item.type,
            id: item.id,
            action: input.action,
            rejectionReason: input.rejectionReason,
            reviewerId: ctx.session.user.id,
          }),
        ),
      );

      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return { succeeded, failed, total: input.items.length };
    }),

  // --- 삭제 ---

  deleteContent: adminProcedure
    .input(
      z.object({
        type: z.enum(["tip", "project"]),
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.type === "tip") {
        return ctx.db.tip.delete({ where: { id: input.id } });
      }
      return ctx.db.project.delete({ where: { id: input.id } });
    }),

  deleteComment: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.comment.delete({ where: { id: input.id } });
    }),

  // --- 사용자 관리 ---

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
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot change your own role" });
      }

      return ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });
    }),
});
