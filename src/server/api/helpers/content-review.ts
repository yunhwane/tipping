import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "../../../../generated/prisma";

/**
 * APPROVED 상태인지 확인하고, 아니면 에러를 던집니다.
 * like, comment, bookmark 등 인터랙션 전에 호출합니다.
 */
export async function ensureApprovedTip(db: PrismaClient, tipId: string) {
  const tip = await db.tip.findUnique({
    where: { id: tipId },
    select: { status: true },
  });
  if (!tip || tip.status !== "APPROVED") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cannot interact with non-approved content",
    });
  }
  return tip;
}

/**
 * 비공개 콘텐츠(PENDING/REJECTED) 접근 제어.
 * 작성자 본인이거나 ADMIN만 접근 가능합니다.
 */
export function checkContentAccess(
  content: { status: string; authorId: string },
  user: { id: string; role: string } | null,
) {
  if (content.status === "APPROVED") return;

  const userId = user?.id;
  const userRole = user?.role;
  if (content.authorId !== userId && userRole !== "ADMIN") {
    throw new TRPCError({ code: "NOT_FOUND", message: "Content not found" });
  }
}

/**
 * 콘텐츠 검수 처리 (승인/반려) + 작성자 알림 생성.
 * admin 라우터에서 호출합니다.
 */
export async function reviewContent(
  db: PrismaClient,
  params: {
    type: "tip" | "project";
    id: string;
    action: "approve" | "reject";
    rejectionReason?: string;
    reviewerId: string;
  },
) {
  const { type, id, action, rejectionReason, reviewerId } = params;

  if (action === "reject" && !rejectionReason) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Rejection reason is required",
    });
  }

  const status = action === "approve" ? "APPROVED" : "REJECTED";
  const data = {
    status: status as "APPROVED" | "REJECTED",
    rejectionReason: action === "reject" ? rejectionReason! : null,
    reviewedAt: new Date(),
    reviewedBy: reviewerId,
  };

  // 트랜잭션으로 검수 처리 + 알림 생성을 원자적으로 실행
  const model = type === "tip" ? db.tip : db.project;
  const content = await (model as typeof db.tip).findUnique({
    where: { id },
    select: { authorId: true, title: true },
  });

  if (!content) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Content not found" });
  }

  const notificationType =
    action === "approve" ? "CONTENT_APPROVED" : "CONTENT_REJECTED";
  const message =
    action === "approve"
      ? `"${content.title}" 이(가) 승인되었습니다.`
      : `"${content.title}" 이(가) 반려되었습니다.`;

  return db.$transaction([
    (model as typeof db.tip).update({ where: { id }, data }),
    db.notification.create({
      data: {
        userId: content.authorId,
        type: notificationType,
        message,
        contentType: type,
        contentId: id,
      },
    }),
  ]);
}
