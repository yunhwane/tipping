"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
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
import { Check, X } from "lucide-react";

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">검수 대기</h1>

      <Tabs defaultValue="tips">
        <TabsList>
          <TabsTrigger value="tips">팁</TabsTrigger>
          <TabsTrigger value="projects">프로젝트</TabsTrigger>
        </TabsList>

        <TabsContent value="tips" className="mt-4">
          <PendingTips />
        </TabsContent>
        <TabsContent value="projects" className="mt-4">
          <PendingProjects />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PendingTips() {
  const utils = api.useUtils();
  const { data, fetchNextPage, hasNextPage } =
    api.admin.getPendingTips.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const reviewTip = api.admin.reviewTip.useMutation({
    onSuccess: () => {
      void utils.admin.getPendingTips.invalidate();
      void utils.admin.getDashboardStats.invalidate();
    },
  });

  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const tips = data?.pages.flatMap((p) => p.items) ?? [];

  if (!tips.length) {
    return <p className="text-center text-muted-foreground py-8">검수 대기 중인 팁이 없습니다.</p>;
  }

  return (
    <>
      <div className="space-y-3">
        {tips.map((tip) => (
          <Card key={tip.id}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{tip.title}</h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={tip.author.image ?? ""} />
                    <AvatarFallback className="text-[10px]">
                      {tip.author.name?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{tip.author.name}</span>
                  <span>·</span>
                  <span>{new Date(tip.createdAt).toLocaleDateString("ko-KR")}</span>
                  {tip.category && (
                    <Badge variant="outline" className="text-[10px]">
                      {tip.category.name}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {tip.content.slice(0, 200)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  onClick={() => reviewTip.mutate({ id: tip.id, action: "approve" })}
                  disabled={reviewTip.isPending}
                >
                  <Check className="mr-1 h-3.5 w-3.5" /> 승인
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setRejectTarget(tip.id);
                    setRejectionReason("");
                  }}
                  disabled={reviewTip.isPending}
                >
                  <X className="mr-1 h-3.5 w-3.5" /> 거절
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {hasNextPage && (
          <Button variant="outline" className="w-full" onClick={() => fetchNextPage()}>
            더 보기
          </Button>
        )}
      </div>

      <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>거절 사유 입력</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="거절 사유를 입력하세요..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectionReason.trim() || reviewTip.isPending}
              onClick={() => {
                if (rejectTarget) {
                  reviewTip.mutate(
                    { id: rejectTarget, action: "reject", rejectionReason },
                    { onSuccess: () => setRejectTarget(null) },
                  );
                }
              }}
            >
              거절
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PendingProjects() {
  const utils = api.useUtils();
  const { data, fetchNextPage, hasNextPage } =
    api.admin.getPendingProjects.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const reviewProject = api.admin.reviewProject.useMutation({
    onSuccess: () => {
      void utils.admin.getPendingProjects.invalidate();
      void utils.admin.getDashboardStats.invalidate();
    },
  });

  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const projects = data?.pages.flatMap((p) => p.items) ?? [];

  if (!projects.length) {
    return (
      <p className="text-center text-muted-foreground py-8">
        검수 대기 중인 프로젝트가 없습니다.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{project.title}</h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={project.author.image ?? ""} />
                    <AvatarFallback className="text-[10px]">
                      {project.author.name?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{project.author.name}</span>
                  <span>·</span>
                  <span>
                    {new Date(project.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {project.description.slice(0, 200)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    reviewProject.mutate({ id: project.id, action: "approve" })
                  }
                  disabled={reviewProject.isPending}
                >
                  <Check className="mr-1 h-3.5 w-3.5" /> 승인
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setRejectTarget(project.id);
                    setRejectionReason("");
                  }}
                  disabled={reviewProject.isPending}
                >
                  <X className="mr-1 h-3.5 w-3.5" /> 거절
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {hasNextPage && (
          <Button variant="outline" className="w-full" onClick={() => fetchNextPage()}>
            더 보기
          </Button>
        )}
      </div>

      <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>거절 사유 입력</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="거절 사유를 입력하세요..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectionReason.trim() || reviewProject.isPending}
              onClick={() => {
                if (rejectTarget) {
                  reviewProject.mutate(
                    { id: rejectTarget, action: "reject", rejectionReason },
                    { onSuccess: () => setRejectTarget(null) },
                  );
                }
              }}
            >
              거절
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
