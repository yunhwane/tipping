"use client";

import { api } from "~/trpc/react";
import { useAuth } from "~/hooks/use-auth";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Shield, ShieldOff } from "lucide-react";

export default function AdminUsersPage() {
  const { user: session } = useAuth();
  const utils = api.useUtils();

  const { data, fetchNextPage, hasNextPage } =
    api.admin.getAllUsers.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const updateRole = api.admin.updateUserRole.useMutation({
    onSuccess: () => {
      void utils.admin.getAllUsers.invalidate();
    },
  });

  const users = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">유저 관리</h1>

      <div className="space-y-3">
        {users.map((user) => {
          const isSelf = user.id === session?.id;
          return (
            <Card key={user.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} />
                  <AvatarFallback>
                    {user.name?.charAt(0) ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.name}</span>
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "secondary"}
                    >
                      {user.role}
                    </Badge>
                    {isSelf && (
                      <span className="text-xs text-muted-foreground">(나)</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {user.email} · 팁 {user._count.tips} · 프로젝트{" "}
                    {user._count.projects}
                  </div>
                </div>
                {!isSelf && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
                      if (
                        confirm(
                          `${user.name}의 역할을 ${newRole}로 변경하시겠습니까?`,
                        )
                      ) {
                        updateRole.mutate({ userId: user.id, role: newRole });
                      }
                    }}
                    disabled={updateRole.isPending}
                  >
                    {user.role === "ADMIN" ? (
                      <>
                        <ShieldOff className="mr-1 h-3.5 w-3.5" /> USER로 변경
                      </>
                    ) : (
                      <>
                        <Shield className="mr-1 h-3.5 w-3.5" /> ADMIN으로 변경
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        {hasNextPage && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fetchNextPage()}
          >
            더 보기
          </Button>
        )}
      </div>
    </div>
  );
}
