"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "~/hooks/use-auth";
import { api } from "~/trpc/react";
import { Button, buttonVariants } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { TagBadge } from "~/components/tag-badge";
import { LikeButton } from "~/components/like-button";
import { BookmarkButton } from "~/components/bookmark-button";
import { CommentSection } from "~/components/comment-section";
import { MarkdownContent } from "~/components/markdown-content";
import { Eye, Pencil, Trash2, Calendar, ArrowLeft, AlertTriangle } from "lucide-react";
import { cn } from "~/lib/utils";
import Link from "next/link";

const categoryColors: Record<string, string> = {
  frontend: "bg-blue-50 text-blue-700 ring-blue-200",
  backend: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  devops: "bg-orange-50 text-orange-700 ring-orange-200",
  database: "bg-purple-50 text-purple-700 ring-purple-200",
  mobile: "bg-pink-50 text-pink-700 ring-pink-200",
  "ai-ml": "bg-indigo-50 text-indigo-700 ring-indigo-200",
  etc: "bg-gray-50 text-gray-700 ring-gray-200",
};

export default function TipDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user: session } = useAuth();

  const { data: tip } = api.tip.getById.useQuery({ id: params.id });

  const deleteTip = api.tip.delete.useMutation({
    onSuccess: () => router.push("/tips"),
  });

  if (!tip) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const isAuthor = session?.id === tip.author.id;
  const colorClass =
    categoryColors[tip.category.slug] ?? categoryColors.etc;

  const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: "검수 대기", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    REJECTED: { label: "반려", className: "bg-red-100 text-red-800 border-red-300" },
  };

  return (
    <article className="mx-auto max-w-3xl">
      {/* 뒤로가기 */}
      <Link
        href="/tips"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        팁 목록
      </Link>

      {/* 검수 대기 배너 */}
      {tip.status === "PENDING" && (
        <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-100 px-4 py-3 text-sm text-yellow-800">
          <span className="font-medium">검수 대기</span>
          <span> — 관리자 검수 후 공개됩니다.</span>
        </div>
      )}

      {/* 반려 배너 — 알럿 스타일 + 인라인 CTA */}
      {tip.status === "REJECTED" && (
        <div className="mb-4 rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-bold text-red-600">이 글은 반려되었습니다</span>
              </div>
              {tip.rejectionReason && (
                <p className="text-sm leading-relaxed text-gray-700">{tip.rejectionReason}</p>
              )}
              {tip.reviewedAt && (
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(tip.reviewedAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}검수
                </p>
              )}
            </div>
            {isAuthor && (
              <Link
                href={`/tips/${tip.id}/edit`}
                className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
              >
                수정하기 →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 헤더 */}
      <header className="space-y-4">
        <div className="flex items-center gap-2">
          <Link href={`/category/${tip.category.slug}`}>
            <span
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ring-inset transition-opacity hover:opacity-80",
                colorClass,
              )}
            >
              {tip.category.name}
            </span>
          </Link>
        </div>

        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {tip.title}
        </h1>

        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-background">
              <AvatarImage
                src={tip.author.image ?? ""}
                alt={tip.author.nickname ?? ""}
              />
              <AvatarFallback className="bg-primary/10 text-primary">
                {tip.author.nickname?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-sm font-semibold">
                {tip.author.nickname}
              </span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(tip.createdAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  조회 {tip.viewCount}
                </span>
              </div>
            </div>
          </div>

          {isAuthor && (
            <div className="flex items-center gap-2">
              <Link
                href={`/tips/${tip.id}/edit`}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" /> 수정
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm("정말 삭제하시겠습니까?")) {
                    deleteTip.mutate({ id: tip.id });
                  }
                }}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> 삭제
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* 본문 */}
      <div className="mt-8 rounded-xl border bg-card p-6 sm:p-8">
        <MarkdownContent content={tip.content} />
      </div>

      {/* 태그 */}
      {tip.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {tip.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} />
          ))}
        </div>
      )}

      {/* 액션 */}
      <div className="mt-6 flex items-center gap-3 rounded-lg border bg-card p-3">
        <LikeButton tipId={tip.id} initialCount={tip._count.likes} />
        <BookmarkButton tipId={tip.id} />
      </div>

      {/* 댓글 */}
      <div className="mt-8">
        <CommentSection tipId={tip.id} />
      </div>
    </article>
  );
}
