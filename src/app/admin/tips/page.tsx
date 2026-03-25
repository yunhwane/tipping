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
  const { data } = api.admin.getAllContents.useQuery({
    limit: 50,
    type: "tip",
    status: statusFilter,
  });

  const deleteContent = api.admin.deleteContent.useMutation({
    onSuccess: () => {
      void utils.admin.getAllContents.invalidate();
    },
  });

  const tips = data?.items ?? [];

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
                      {tip.author.nickname?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{tip.author.nickname}</span>
                  <span>·</span>
                  <span>
                    {new Date(tip.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                  <span>·</span>
                  <span>좋아요 {tip.likeCount}</span>
                  <span>·</span>
                  <span>댓글 {tip.commentCount}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive shrink-0"
                onClick={() => {
                  if (confirm("정말 삭제하시겠습니까? 댓글, 좋아요, 북마크가 함께 삭제됩니다.")) {
                    deleteContent.mutate({ type: "tip", id: tip.id });
                  }
                }}
                disabled={deleteContent.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {!tips.length && (
          <p className="text-center text-muted-foreground py-8">팁이 없습니다.</p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    PENDING: { label: "검수 대기", className: "border-yellow-300 text-yellow-700" },
    APPROVED: { label: "공개", className: "border-green-300 text-green-700" },
    REJECTED: { label: "반려", className: "border-red-300 text-red-700" },
  }[status] ?? { label: status, className: "" };

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
