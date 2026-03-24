"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { SearchBar } from "./search-bar";
import { Lightbulb } from "lucide-react";

export function Header() {
  const { data: session } = useSession();

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
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={session.user.image ?? ""}
                    alt={session.user.name ?? ""}
                  />
                  <AvatarFallback>
                    {session.user.name?.charAt(0) ?? "U"}
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
                <DropdownMenuItem onClick={() => signOut()}>
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => signIn("github")} size="sm">
              GitHub 로그인
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
