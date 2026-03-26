"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useAuth } from "~/hooks/use-auth";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import {
  Shield,
  ShieldOff,
  Search,
  MailCheck,
  MailX,
  Clock,
} from "lucide-react";

type RoleFilter = "USER" | "ADMIN" | undefined;
type EmailVerifiedFilter = "verified" | "unverified" | undefined;

export default function AdminUsersPage() {
  const { user: session } = useAuth();
  const utils = api.useUtils();

  const [role, setRole] = useState<RoleFilter>(undefined);
  const [emailVerified, setEmailVerified] = useState<EmailVerifiedFilter>(undefined);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, fetchNextPage, hasNextPage } =
    api.admin.getAllUsers.useInfiniteQuery(
      { limit: 20, role, emailVerified, search: search || undefined },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const updateRole = api.admin.updateUserRole.useMutation({
    onSuccess: () => {
      void utils.admin.getAllUsers.invalidate();
    },
  });

  const users = data?.pages.flatMap((p) => p.items) ?? [];

  const handleSearch = () => {
    setSearch(searchInput);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">유저 관리</h1>

      {/* 필터 영역 */}
      <div className="space-y-3">
        {/* 검색 */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="닉네임 또는 이메일로 검색"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} variant="outline">
            검색
          </Button>
        </div>

        {/* 필터 버튼 */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">역할:</span>
            <div className="flex gap-1">
              {([undefined, "USER", "ADMIN"] as const).map((v) => (
                <Button
                  key={v ?? "all"}
                  size="sm"
                  variant={role === v ? "default" : "outline"}
                  onClick={() => setRole(v)}
                  className="h-7 px-2.5 text-xs"
                >
                  {v ?? "전체"}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">이메일 인증:</span>
            <div className="flex gap-1">
              {([undefined, "verified", "unverified"] as const).map((v) => (
                <Button
                  key={v ?? "all"}
                  size="sm"
                  variant={emailVerified === v ? "default" : "outline"}
                  onClick={() => setEmailVerified(v)}
                  className="h-7 px-2.5 text-xs"
                >
                  {v === "verified" ? "인증완료" : v === "unverified" ? "미인증" : "전체"}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 유저 목록 */}
      <div className="space-y-3">
        {users.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            조건에 맞는 유저가 없습니다.
          </p>
        )}
        {users.map((user) => {
          const isSelf = user.id === session?.id;
          const isEmailVerified = !!user.auth?.emailConfirmedAt;

          return (
            <Card key={user.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user.image ?? ""}
                    alt={user.nickname ?? ""}
                  />
                  <AvatarFallback>
                    {user.nickname?.charAt(0) ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.nickname}</span>
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "secondary"}
                    >
                      {user.role}
                    </Badge>
                    {isEmailVerified ? (
                      <Badge variant="outline" className="gap-1 border-green-300 text-green-700">
                        <MailCheck className="h-3 w-3" />
                        인증
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 border-red-300 text-red-700">
                        <MailX className="h-3 w-3" />
                        미인증
                      </Badge>
                    )}
                    {isSelf && (
                      <span className="text-xs text-muted-foreground">
                        (나)
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span>{user.email}</span>
                    <span>·</span>
                    <span>팁 {user._count.tips}</span>
                    <span>·</span>
                    <span>프로젝트 {user._count.projects}</span>
                    {user.auth?.createdAt && (
                      <>
                        <span>·</span>
                        <span>가입 {formatDate(user.auth.createdAt)}</span>
                      </>
                    )}
                    {user.auth?.lastSignInAt && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {formatDate(user.auth.lastSignInAt)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {!isSelf && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newRole =
                        user.role === "ADMIN" ? "USER" : "ADMIN";
                      if (
                        confirm(
                          `${user.nickname}의 역할을 ${newRole}로 변경하시겠습니까?`,
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

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}
