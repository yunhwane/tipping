"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "~/hooks/use-auth";
import { api } from "~/trpc/react";
import { Button, buttonVariants } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";
import { TagBadge } from "~/components/tag-badge";
import { Heart, Eye, ExternalLink, Trash2, AlertTriangle, Pencil } from "lucide-react";
import { cn } from "~/lib/utils";
import { MarkdownContent } from "~/components/markdown-content";
import Link from "next/link";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user: session } = useAuth();

  const { data: project } = api.project.getById.useQuery({ id: params.id });
  const utils = api.useUtils();

  const toggleLike = api.project.toggleLike.useMutation({
    onSuccess: () => {
      void utils.project.invalidate();
    },
  });

  const deleteProject = api.project.delete.useMutation({
    onSuccess: () => router.push("/projects"),
  });

  if (!project) {
    return (
      <div className="flex justify-center py-20">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  const isAuthor = session?.id === project.author.id;

  const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: "검수 대기", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    REJECTED: { label: "반려", className: "bg-red-100 text-red-800 border-red-300" },
  };

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      {/* 검수 대기 배너 */}
      {project.status === "PENDING" && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-100 px-4 py-3 text-sm text-yellow-800">
          <span className="font-medium">검수 대기</span>
          <span> — 관리자 검수 후 공개됩니다.</span>
        </div>
      )}

      {/* 반려 배너 — 알럿 스타일 + 인라인 CTA */}
      {project.status === "REJECTED" && (
        <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-bold text-red-600">이 프로젝트는 반려되었습니다</span>
              </div>
              {project.rejectionReason && (
                <p className="text-sm leading-relaxed text-gray-700">{project.rejectionReason}</p>
              )}
              {project.reviewedAt && (
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(project.reviewedAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}검수
                </p>
              )}
            </div>
            {isAuthor && (
              <Link
                href={`/projects/${project.id}/edit`}
                className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
              >
                수정하기 →
              </Link>
            )}
          </div>
        </div>
      )}

      {project.imageUrl && (
        <div className="aspect-video overflow-hidden rounded-lg">
          <img
            src={project.imageUrl}
            alt={project.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold">{project.title}</h1>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={project.author.image ?? ""}
                alt={project.author.nickname ?? ""}
              />
              <AvatarFallback>
                {project.author.nickname?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {project.author.nickname}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            {project.viewCount}
          </div>
        </div>
      </div>

      <Separator />

      <MarkdownContent content={project.description} />

      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} />
          ))}
        </div>
      )}

      <Separator />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleLike.mutate({ projectId: project.id })}
            disabled={!session || toggleLike.isPending}
            className="gap-1"
          >
            <Heart
              className={cn(
                "h-4 w-4",
                // TODO: add liked status check
              )}
            />
            <span>{project._count.likes}</span>
          </Button>
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ExternalLink className="mr-1 h-3 w-3" /> 프로젝트 보기
            </a>
          )}
        </div>
        {isAuthor && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("정말 삭제하시겠습니까?")) {
                deleteProject.mutate({ id: project.id });
              }
            }}
          >
            <Trash2 className="mr-1 h-3 w-3" /> 삭제
          </Button>
        )}
      </div>
    </article>
  );
}
