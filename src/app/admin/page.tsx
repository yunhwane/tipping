"use client";

import { api } from "~/trpc/react";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Users, Lightbulb, FolderKanban, ClipboardCheck } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { data: stats } = api.admin.getDashboardStats.useQuery();

  if (!stats) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="전체 유저"
          value={stats.userCount}
          icon={<Users className="h-5 w-5 text-blue-500" />}
        />
        <StatCard
          title="전체 팁"
          value={stats.tipCount}
          icon={<Lightbulb className="h-5 w-5 text-amber-500" />}
        />
        <StatCard
          title="전체 프로젝트"
          value={stats.projectCount}
          icon={<FolderKanban className="h-5 w-5 text-emerald-500" />}
        />
        <Link href="/admin/reviews">
          <StatCard
            title="검수 대기"
            value={stats.pendingTipCount + stats.pendingProjectCount}
            icon={<ClipboardCheck className="h-5 w-5 text-orange-500" />}
            detail={`팁 ${stats.pendingTipCount} / 프로젝트 ${stats.pendingProjectCount}`}
          />
        </Link>
      </div>

      {/* Recent content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">최근 가입 유저</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} />
                  <AvatarFallback className="text-xs">
                    {user.name?.charAt(0) ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                  {user.role}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold">최근 생성 콘텐츠</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentTips.map((tip) => (
              <div key={tip.id} className="flex items-center gap-3">
                <Badge variant="outline" className="shrink-0">팁</Badge>
                <span className="text-sm truncate flex-1">{tip.title}</span>
                <StatusBadge status={tip.status} />
              </div>
            ))}
            {stats.recentProjects.map((project) => (
              <div key={project.id} className="flex items-center gap-3">
                <Badge variant="outline" className="shrink-0">프로젝트</Badge>
                <span className="text-sm truncate flex-1">{project.title}</span>
                <StatusBadge status={project.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  detail,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  detail?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {detail && (
              <p className="text-xs text-muted-foreground mt-1">{detail}</p>
            )}
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    PENDING: { label: "검수 대기", className: "bg-yellow-100 text-yellow-800" },
    APPROVED: { label: "공개", className: "bg-green-100 text-green-800" },
    REJECTED: { label: "반려", className: "bg-red-100 text-red-800" },
  }[status] ?? { label: status, className: "" };

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
