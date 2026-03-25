import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { TagBadge } from "./tag-badge";
import { Heart, Eye } from "lucide-react";
import { cn } from "~/lib/utils";

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    url: string | null;
    imageUrl: string | null;
    viewCount: number;
    createdAt: Date;
    status?: string;
    rejectionReason?: string | null;
    author: { id: string; nickname: string; image: string | null };
    tags: { id: string; name: string }[];
    _count: { likes: number };
  };
  showStatus?: boolean;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "검수 대기", className: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "공개", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "반려", className: "bg-red-100 text-red-800" },
};

export function ProjectCard({ project, showStatus = false }: ProjectCardProps) {
  const router = useRouter();
  const isRejected = showStatus && project.status === "REJECTED";

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className={cn(
        "transition-shadow hover:shadow-md",
        isRejected && "border-red-200",
      )}>
        {project.imageUrl && (
          <div className="relative aspect-video overflow-hidden rounded-t-lg">
            <Image
              src={project.imageUrl}
              alt={project.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <h3 className="line-clamp-1 text-lg font-semibold flex-1">
              {project.title}
            </h3>
            {showStatus && project.status && statusConfig[project.status] && (
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[project.status]!.className}`}>
                {statusConfig[project.status]!.label}
              </span>
            )}
          </div>
          {isRejected && (
            <div className="mt-1 space-y-2">
              {project.rejectionReason && (
                <div className="rounded-lg border border-red-200 bg-red-50/50 px-3 py-2">
                  <p className="text-xs font-medium text-red-600 mb-0.5">반려 사유</p>
                  <p className="text-xs leading-relaxed text-gray-600 line-clamp-2">{project.rejectionReason}</p>
                </div>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/projects/${project.id}/edit`);
                }}
                className="w-full rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-600"
              >
                수정하기
              </button>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Avatar className="h-5 w-5">
              <AvatarImage
                src={project.author.image ?? ""}
                alt={project.author.nickname}
              />
              <AvatarFallback className="text-[10px]">
                {project.author.nickname.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span>{project.author.nickname}</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
            {project.description}
          </p>
          {project.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag) => (
                <TagBadge key={tag.id} name={tag.name} />
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" /> {project._count.likes}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" /> {project.viewCount}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
