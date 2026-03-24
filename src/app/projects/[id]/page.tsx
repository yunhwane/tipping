"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { Button, buttonVariants } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";
import { TagBadge } from "~/components/tag-badge";
import { Heart, Eye, ExternalLink, Trash2 } from "lucide-react";
import { cn } from "~/lib/utils";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();

  const { data: project } = api.project.getById.useQuery({ id: params.id });
  const utils = api.useUtils();

  const toggleLike = api.project.toggleLike.useMutation({
    onSuccess: () => {
      void utils.project.getById.invalidate({ id: params.id });
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

  const isAuthor = session?.user.id === project.author.id;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
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
                alt={project.author.name ?? ""}
              />
              <AvatarFallback>
                {project.author.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {project.author.name}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            {project.viewCount}
          </div>
        </div>
      </div>

      <Separator />

      <div className="whitespace-pre-wrap">{project.description}</div>

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
