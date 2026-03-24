import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { TagBadge } from "./tag-badge";
import { Heart, Eye, ExternalLink } from "lucide-react";

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
    author: { id: string; name: string | null; image: string | null };
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
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      {/* Image Area */}
      <Link href={`/projects/${project.id}`}>
        <div className="aspect-video overflow-hidden">
          {project.imageUrl ? (
            <img
              src={project.imageUrl}
              alt={project.title}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
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

        {/* Rejection Reason */}
        {showStatus &&
          project.status === "REJECTED" &&
          project.rejectionReason && (
            <p className="text-xs text-red-600">
              사유: {project.rejectionReason}
            </p>
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
