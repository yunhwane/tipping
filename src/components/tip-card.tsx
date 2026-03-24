import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { TagBadge } from "./tag-badge";
import { Heart, MessageCircle, Eye, ArrowUpRight } from "lucide-react";
import { cn } from "~/lib/utils";

interface TipCardProps {
  tip: {
    id: string;
    title: string;
    content: string;
    viewCount: number;
    createdAt: Date;
    status?: string;
    rejectionReason?: string | null;
    author: { id: string; name: string | null; image: string | null };
    category: { name: string; slug: string };
    tags: { id: string; name: string }[];
    _count: { likes: number; comments: number };
  };
  showStatus?: boolean;
  variant?: "default" | "compact";
}

const categoryStyle: Record<
  string,
  { bg: string; icon: string }
> = {
  frontend: {
    bg: "bg-blue-100/80 text-blue-700 border-blue-200/60",
    icon: "🎨",
  },
  backend: {
    bg: "bg-emerald-100/80 text-emerald-700 border-emerald-200/60",
    icon: "⚙️",
  },
  devops: {
    bg: "bg-orange-100/80 text-orange-700 border-orange-200/60",
    icon: "🚀",
  },
  database: {
    bg: "bg-purple-100/80 text-purple-700 border-purple-200/60",
    icon: "🗄️",
  },
  mobile: {
    bg: "bg-pink-100/80 text-pink-700 border-pink-200/60",
    icon: "📱",
  },
  "ai-ml": {
    bg: "bg-indigo-100/80 text-indigo-700 border-indigo-200/60",
    icon: "🤖",
  },
  etc: {
    bg: "bg-gray-100/80 text-gray-600 border-gray-200/60",
    icon: "💡",
  },
};

const categoryBarColor: Record<string, string> = {
  frontend: "bg-blue-500",
  backend: "bg-emerald-500",
  devops: "bg-orange-500",
  database: "bg-purple-500",
  mobile: "bg-pink-500",
  "ai-ml": "bg-indigo-500",
  etc: "bg-gray-400",
};

function getPreview(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/#{1,6}\s+/g, "")
    .replace(/[*_~>|\-\[\]()!]/g, "")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 120);
}

function timeAgo(date: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(date).toLocaleDateString("ko-KR");
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "검수 대기", className: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "공개", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "반려", className: "bg-red-100 text-red-800" },
};

export function TipCard({ tip, showStatus = false, variant = "default" }: TipCardProps) {
  const style = categoryStyle[tip.category.slug] ?? categoryStyle.etc!;

  if (variant === "compact") {
    return (
      <Link
        href={`/tips/${tip.id}`}
        className="group flex items-start gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/50"
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium leading-snug group-hover:text-primary truncate">
            {tip.title}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] leading-none font-semibold",
                style.bg,
              )}
            >
              <span className="text-[10px]">{style.icon}</span>
              {tip.category.name}
            </span>
            <span className="flex items-center gap-0.5">
              <Heart className="h-3 w-3" /> {tip._count.likes}
            </span>
            <span>{timeAgo(tip.createdAt)}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/tips/${tip.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
    >
      {/* 상단 컬러 바 */}
      <div
        className={cn(
          "h-1 w-full transition-all group-hover:h-1.5",
          categoryBarColor[tip.category.slug] ?? "bg-gray-400",
        )}
      />

      <div className="flex flex-1 flex-col p-5">
        {/* 카테고리 + 시간 */}
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold",
              style.bg,
            )}
          >
            <span className="text-sm leading-none">{style.icon}</span>
            {tip.category.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {timeAgo(tip.createdAt)}
          </span>
        </div>

        {/* 제목 */}
        <h3 className="mt-3 line-clamp-2 text-base font-semibold leading-snug tracking-tight group-hover:text-primary transition-colors">
          {tip.title}
        </h3>

        {/* 상태 뱃지 */}
        {showStatus && tip.status && statusConfig[tip.status] && (
          <div className="mt-2 space-y-1">
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusConfig[tip.status]!.className)}>
              {statusConfig[tip.status]!.label}
            </span>
            {tip.status === "REJECTED" && tip.rejectionReason && (
              <p className="text-xs text-red-600">사유: {tip.rejectionReason}</p>
            )}
          </div>
        )}

        {/* 미리보기 */}
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {getPreview(tip.content)}
        </p>

        {/* 태그 + 하단: 작성자 + 통계 */}
        <div className="mt-auto">
          {tip.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 pb-4">
              {tip.tags.slice(0, 3).map((tag) => (
                <TagBadge key={tag.id} name={tag.name} size="sm" />
              ))}
              {tip.tags.length > 3 && (
                <span className="inline-flex items-center rounded-lg bg-muted/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  +{tip.tags.length - 3}
                </span>
              )}
            </div>
          )}

        <div className="pt-4 flex items-center justify-between border-t border-dashed border-border/60">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 ring-2 ring-background">
              <AvatarImage
                src={tip.author.image ?? ""}
                alt={tip.author.name ?? ""}
              />
              <AvatarFallback className="text-[10px] bg-muted">
                {tip.author.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-muted-foreground">
              {tip.author.name}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {tip._count.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {tip._count.comments}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {tip.viewCount}
            </span>
          </div>
        </div>
        </div>
      </div>

      {/* 호버 시 화살표 */}
      <ArrowUpRight className="absolute right-3 top-4 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
