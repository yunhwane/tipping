"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Bell, Check, CheckCheck } from "lucide-react";
import { cn } from "~/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = useState(false);

  const { data: unreadData } = api.notification.getUnreadCount.useQuery(
    undefined,
    { refetchInterval: 30000 },
  );

  const { data, fetchNextPage, hasNextPage } =
    api.notification.getAll.useInfiniteQuery(
      { limit: 10 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        enabled: open,
      },
    );

  const utils = api.useUtils();

  const markAsRead = api.notification.markAsRead.useMutation({
    onSuccess: () => {
      void utils.notification.getUnreadCount.invalidate();
      void utils.notification.getAll.invalidate();
    },
  });

  const markAllAsRead = api.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      void utils.notification.getUnreadCount.invalidate();
      void utils.notification.getAll.invalidate();
    },
  });

  const unreadCount = unreadData?.count ?? 0;
  const notifications = data?.pages.flatMap((p) => p.items) ?? [];

  function getContentLink(n: { contentType: string | null; contentId: string | null }) {
    if (!n.contentType || !n.contentId) return null;
    return n.contentType === "tip"
      ? `/tips/${n.contentId}`
      : `/projects/${n.contentId}`;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold">알림</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              모두 읽음
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              알림이 없습니다.
            </p>
          ) : (
            notifications.map((n) => {
              const link = getContentLink(n);
              const content = (
                <div
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50",
                    !n.read && "bg-amber-50/50",
                  )}
                >
                  <div
                    className={cn(
                      "mt-1 h-2 w-2 shrink-0 rounded-full",
                      n.read ? "bg-transparent" : "bg-amber-500",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        markAsRead.mutate({ id: n.id });
                      }}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );

              return link ? (
                <Link key={n.id} href={link} onClick={() => {
                  if (!n.read) markAsRead.mutate({ id: n.id });
                  setOpen(false);
                }}>
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              );
            })
          )}
          {hasNextPage && (
            <Button
              variant="ghost"
              className="w-full rounded-none text-xs"
              onClick={() => fetchNextPage()}
            >
              더 보기
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
