"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Trash2 } from "lucide-react";

const STATUS_OPTIONS = [
  { value: undefined, label: "전체" },
  { value: "PENDING" as const, label: "검수 대기" },
  { value: "APPROVED" as const, label: "공개" },
  { value: "REJECTED" as const, label: "반려" },
];

export default function AdminTipsPage() {
  const [statusFilter, setStatusFilter] = useState<
    "PENDING" | "APPROVED" | "REJECTED" | undefined
  >(undefined);

  const utils = api.useUtils();
  const { data, fetchNextPage, hasNextPage } =
    api.admin.getAllTips.useInfiniteQuery(
      { limit: 20, status: statusFilter },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const deleteTip = api.admin.deleteTip.useMutation({
    onSuccess: () => {
      void utils.admin.getAllTips.invalidate();
    },
  });

  const tips = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">팁 관리</h1>

      <div className="flex gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <Button
            key={opt.label}
            variant={statusFilter === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {tips.map((tip) => (
          <Card key={tip.id}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{tip.title}</h3>
                  <StatusBadge status={tip.status} />
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={tip.author.image ?? ""} />
                    <AvatarFallback className="text-[10px]">
                      {tip.author.name?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{tip.author.name}</span>
                  <span>·</span>
                  <span>
                    {new Date(tip.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                  <span>·</span>
                  <span>좋아요 {tip._count.likes}</span>
                  <span>·</span>
                  <span>댓글 {tip._count.comments}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive shrink-0"
                onClick={() => {
                  if (confirm("정말 삭제하시겠습니까? 댓글, 좋아요, 북마크가 함께 삭제됩니다.")) {
                    deleteTip.mutate({ id: tip.id });
                  }
                }}
                disabled={deleteTip.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {!tips.length && (
          <p className="text-center text-muted-foreground py-8">팁이 없습니다.</p>
        )}
        {hasNextPage && (
          <Button variant="outline" className="w-full" onClick={() => fetchNextPage()}>
            더 보기
          </Button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    PENDING: { label: "검수 대기", variant: "outline" as const, className: "border-yellow-300 text-yellow-700" },
    APPROVED: { label: "공개", variant: "outline" as const, className: "border-green-300 text-green-700" },
    REJECTED: { label: "반려", variant: "outline" as const, className: "border-red-300 text-red-700" },
  }[status] ?? { label: status, variant: "outline" as const, className: "" };

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
