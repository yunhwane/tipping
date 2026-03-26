import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "~/components/ui/card";
import { TagBadge } from "./tag-badge";
import { Heart, Eye, ExternalLink } from "lucide-react";
import { cn } from "~/lib/utils";

interface ProjectShowcaseCardProps {
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

export function ProjectShowcaseCard({
  project,
  showStatus = false,
}: ProjectShowcaseCardProps) {
  const router = useRouter();
  const isRejected = showStatus && project.status === "REJECTED";

  return (
    <Card className={cn(
      "overflow-hidden transition-shadow hover:shadow-md",
      isRejected && "border-red-200",
    )}>
      {/* Image Area */}
      <Link href={`/projects/${project.id}`}>
        <div className="relative aspect-video overflow-hidden">
          {project.imageUrl ? (
            <Image
              src={project.imageUrl}
              alt={project.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
              <span className="px-4 text-center text-sm font-medium text-amber-700/60">
                {project.title}
              </span>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="space-y-3 p-4">
        {/* Title + Status */}
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${project.id}`}
            className="flex-1 text-base font-semibold hover:underline line-clamp-1"
          >
            {project.title}
          </Link>
          {showStatus && project.status && statusConfig[project.status] && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[project.status]!.className}`}
            >
              {statusConfig[project.status]!.label}
            </span>
          )}
        </div>

        {/* Rejection Reason — 강조 박스 + 수정 CTA */}
        {isRejected && (
          <div className="space-y-2">
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

        {/* Description */}
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {project.description}
        </p>

        {/* Tags + Stats */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {project.tags.slice(0, 3).map((tag) => (
              <TagBadge key={tag.id} name={tag.name} size="sm" />
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" /> {project._count.likes}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" /> {project.viewCount}
            </span>
          </div>
        </div>

        {/* Service Link */}
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          >
            <ExternalLink className="h-3 w-3" />
            서비스 바로가기
          </a>
        )}
      </CardContent>
    </Card>
  );
}
