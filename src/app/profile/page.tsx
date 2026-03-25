"use client";

import Link from "next/link";
import { useAuth } from "~/hooks/use-auth";
import { redirect } from "next/navigation";
import { api } from "~/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { TipCard } from "~/components/tip-card";
import { ProjectShowcaseCard } from "~/components/project-showcase-card";
import {
  Settings,
  FileText,
  FolderOpen,
  Bookmark,
  Heart,
  ExternalLink,
} from "lucide-react";

export default function ProfilePage() {
  const { user: session, status } = useAuth();
  const { data: profile } = api.user.getProfile.useQuery(undefined, {
    enabled: !!session,
  });
  const { data: stats } = api.user.getProfileStats.useQuery(undefined, {
    enabled: !!session,
  });

  if (status === "loading") return null;
  if (!session) redirect("/auth/signin");

  const displayName = profile?.nickname ?? session.nickname;
  const displayImage = profile?.image ?? session.image;
  const bio = profile?.bio as string | null;
  const links = (profile?.links ?? []) as { label: string; url: string }[];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Profile Header Card */}
      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20 ring-2 ring-foreground/5 ring-offset-2 ring-offset-background">
              <AvatarImage
                src={displayImage ?? ""}
                alt={displayName ?? ""}
              />
              <AvatarFallback className="bg-amber-100 text-2xl text-amber-700">
                {displayName?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold">{displayName}</h1>
              {bio && (
                <p className="text-sm text-muted-foreground">{bio}</p>
              )}
              {links.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Link href="/profile/settings">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-6 flex gap-4">
          <div className="flex flex-1 flex-col items-center rounded-lg border border-border/60 bg-muted/20 py-3">
            <span className="text-lg font-bold">
              {stats?.tipCount ?? "--"}
            </span>
            <span className="text-xs text-muted-foreground">팁</span>
          </div>
          <div className="flex flex-1 flex-col items-center rounded-lg border border-border/60 bg-muted/20 py-3">
            <span className="text-lg font-bold">
              {stats?.projectCount ?? "--"}
            </span>
            <span className="text-xs text-muted-foreground">프로젝트</span>
          </div>
          <div className="flex flex-1 flex-col items-center rounded-lg border border-border/60 bg-muted/20 py-3">
            <span className="text-lg font-bold">
              {stats?.totalLikes ?? "--"}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="h-3 w-3" />
              좋아요
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tips">
        <TabsList>
          <TabsTrigger value="tips" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            내 팁
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            내 프로젝트
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="gap-1.5">
            <Bookmark className="h-3.5 w-3.5" />
            북마크
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tips" className="mt-4">
          <MyTips />
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          <MyProjects />
        </TabsContent>

        <TabsContent value="bookmarks" className="mt-4">
          <MyBookmarks />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MyTips() {
  const { data, fetchNextPage, hasNextPage } =
    api.tip.getMyTips.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const tips = data?.pages.flatMap((page) => page.items) ?? [];

  if (!tips.length) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        작성한 팁이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tips.map((tip) => (
          <TipCard key={tip.id} tip={tip} showStatus />
        ))}
      </div>
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
  );
}

function MyProjects() {
  const { data, fetchNextPage, hasNextPage } =
    api.project.getMyProjects.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const projects = data?.pages.flatMap((page) => page.items) ?? [];

  if (!projects.length) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        등록한 프로젝트가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-5 sm:grid-cols-2">
        {projects.map((project) => (
          <ProjectShowcaseCard key={project.id} project={project} showStatus />
        ))}
      </div>
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
  );
}

function MyBookmarks() {
  const { data, fetchNextPage, hasNextPage } =
    api.bookmark.getMyBookmarks.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const bookmarks = data?.pages.flatMap((page) => page.items) ?? [];

  if (!bookmarks.length) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        북마크한 팁이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bookmarks.map((bookmark) => (
          <TipCard key={bookmark.tip.id} tip={bookmark.tip} />
        ))}
      </div>
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
  );
}
