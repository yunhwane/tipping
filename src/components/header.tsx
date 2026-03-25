"use client";

import Link from "next/link";
import { useAuth, signOut } from "~/hooks/use-auth";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { SearchBar } from "./search-bar";
import { Lightbulb, LogIn, UserPlus } from "lucide-react";
import { NotificationBell } from "./notification-bell";

export function Header() {
  const { user: session } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-1.5 text-xl font-bold">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Tipping
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            <Link
              href="/tips"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              팁
            </Link>
            <Link
              href="/projects"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              프로젝트
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <SearchBar />

          {session ? (
            <>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={session.image ?? ""}
                    alt={session.nickname ?? ""}
                  />
                  <AvatarFallback className="bg-amber-100 text-amber-700 text-sm font-semibold">
                    {session.nickname?.charAt(0) ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Link href="/profile" className="w-full">내 프로필</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/tips/new" className="w-full">팁 작성</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/projects/new" className="w-full">프로젝트 등록</Link>
                </DropdownMenuItem>
                {session.role === "ADMIN" && (
                  <DropdownMenuItem>
                    <Link href="/admin" className="w-full">관리자</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => signOut()}>
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link href="/auth/signin">
                <Button variant="outline" className="h-9 gap-2 px-4 text-sm font-medium">
                  <LogIn className="h-4 w-4" />
                  로그인
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="h-9 gap-2 bg-amber-500 px-4 text-sm font-medium text-white hover:bg-amber-600">
                  <UserPlus className="h-4 w-4" />
                  회원가입
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
