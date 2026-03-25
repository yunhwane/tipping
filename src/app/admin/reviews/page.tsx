"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import { Check, X, FileText, Folder, CheckCheck } from "lucide-react";

type ContentType = "tip" | "project" | undefined;

export default function ReviewsPage() {
  const [typeFilter, setTypeFilter] = useState<ContentType>(undefined);
  const [selectedIds, setSelectedIds] = useState<
    Map<string, "tip" | "project">
  >(new Map());
  const [rejectTarget, setRejectTarget] = useState<{
    type: "tip" | "project";
    id: string;
  } | null>(null);
  const [bulkRejectMode, setBulkRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const utils = api.useUtils();

  const { data } = api.admin.getPendingContents.useQuery({
    limit: 50,
    type: typeFilter,
  });

  const review = api.admin.reviewContent.useMutation({
    onSuccess: () => {
      void utils.admin.getPendingContents.invalidate();
      void utils.admin.getDashboardStats.invalidate();
    },
  });

  const bulkReview = api.admin.bulkReview.useMutation({
    onSuccess: () => {
      setSelectedIds(new Map());
      void utils.admin.getPendingContents.invalidate();
      void utils.admin.getDashboardStats.invalidate();
    },
  });

  const items = data?.items ?? [];

  function toggleSelect(id: string, type: "tip" | "project") {
    setSelectedIds((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, type);
      }
      return next;
    });
  }

  function selectAll() {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Map());
    } else {
      const next = new Map<string, "tip" | "project">();
      items.forEach((item) => next.set(item.id, item.contentType));
      setSelectedIds(next);
    }
  }

  function handleBulkApprove() {
    const itemsToReview = Array.from(selectedIds.entries()).map(
      ([id, type]) => ({ id, type }),
    );
    bulkReview.mutate({ items: itemsToReview, action: "approve" });
  }

  function handleBulkReject() {
    setBulkRejectMode(true);
    setRejectionReason("");
  }

  function handleRejectSubmit() {
    if (bulkRejectMode) {
      const itemsToReview = Array.from(selectedIds.entries()).map(
        ([id, type]) => ({ id, type }),
      );
      bulkReview.mutate({
        items: itemsToReview,
        action: "reject",
        rejectionReason,
      });
      setBulkRejectMode(false);
      setRejectTarget(null);
    } else if (rejectTarget) {
      review.mutate(
        {
          type: rejectTarget.type,
          id: rejectTarget.id,
          action: "reject",
          rejectionReason,
        },
        { onSuccess: () => setRejectTarget(null) },
      );
    }
  }

  const isPending = review.isPending || bulkReview.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">검수 대기</h1>
        <span className="text-sm text-muted-foreground">
          {items.length}건 대기 중
        </span>
      </div>

      {/* 필터 + 일괄 처리 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {(
            [
              [undefined, "전체"],
              ["tip", "팁"],
              ["project", "프로젝트"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={label}
              variant={typeFilter === value ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>

        {items.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              {selectedIds.size === items.length ? "선택 해제" : "전체 선택"}
            </Button>
            {selectedIds.size > 0 && (
              <>
                <span className="text-xs text-muted-foreground">
                  {selectedIds.size}건 선택
                </span>
                <Button
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={isPending}
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  일괄 승인
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkReject}
                  disabled={isPending}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  일괄 거절
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 대기열 */}
      {items.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          검수 대기 중인 콘텐츠가 없습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className={
                selectedIds.has(item.id) ? "ring-2 ring-amber-400" : ""
              }
            >
              <CardContent className="flex items-center gap-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => toggleSelect(item.id, item.contentType)}
                  className="h-4 w-4 shrink-0 rounded border-gray-300"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {item.contentType === "tip" ? (
                      <FileText className="h-4 w-4 shrink-0 text-blue-500" />
                    ) : (
                      <Folder className="h-4 w-4 shrink-0 text-purple-500" />
                    )}
                    <Badge
                      variant="outline"
                      className="text-[10px]"
                    >
                      {item.contentType === "tip" ? "팁" : "프로젝트"}
                    </Badge>
                    <h3 className="font-medium truncate">{item.title}</h3>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={item.author.image ?? ""} />
                      <AvatarFallback className="text-[10px]">
                        {item.author.name?.charAt(0) ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{item.author.name}</span>
                    <span>·</span>
                    <span>
                      {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                    {item.category && (
                      <Badge variant="outline" className="text-[10px]">
                        {item.category.name}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {item.preview}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      review.mutate({
                        type: item.contentType,
                        id: item.id,
                        action: "approve",
                      })
                    }
                    disabled={isPending}
                  >
                    <Check className="mr-1 h-3.5 w-3.5" /> 승인
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setRejectTarget({
                        type: item.contentType,
                        id: item.id,
                      });
                      setBulkRejectMode(false);
                      setRejectionReason("");
                    }}
                    disabled={isPending}
                  >
                    <X className="mr-1 h-3.5 w-3.5" /> 거절
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 거절 사유 다이얼로그 */}
      <Dialog
        open={!!rejectTarget || bulkRejectMode}
        onOpenChange={() => {
          setRejectTarget(null);
          setBulkRejectMode(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkRejectMode
                ? `${selectedIds.size}건 일괄 거절 사유`
                : "거절 사유 입력"}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="거절 사유를 입력하세요..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setBulkRejectMode(false);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectionReason.trim() || isPending}
              onClick={handleRejectSubmit}
            >
              거절
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
