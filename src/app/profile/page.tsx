"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { api } from "~/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { TipCard } from "~/components/tip-card";
import { ProjectCard } from "~/components/project-card";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;
  if (!session) redirect("/api/auth/signin");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage
            src={session.user.image ?? ""}
            alt={session.user.name ?? ""}
          />
          <AvatarFallback className="text-xl">
            {session.user.name?.charAt(0) ?? "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{session.user.name}</h1>
          <p className="text-muted-foreground">{session.user.email}</p>
        </div>
      </div>

      <Tabs defaultValue="tips">
        <TabsList>
          <TabsTrigger value="tips">내 팁</TabsTrigger>
          <TabsTrigger value="bookmarks">북마크</TabsTrigger>
          <TabsTrigger value="projects">내 프로젝트</TabsTrigger>
        </TabsList>

        <TabsContent value="tips" className="mt-4">
          <MyTips />
        </TabsContent>

        <TabsContent value="bookmarks" className="mt-4">
          <MyBookmarks />
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          <MyProjects />
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
      <p className="text-center text-muted-foreground">
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

function MyBookmarks() {
  const { data, fetchNextPage, hasNextPage } =
    api.bookmark.getMyBookmarks.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const bookmarks = data?.pages.flatMap((page) => page.items) ?? [];

  if (!bookmarks.length) {
    return (
      <p className="text-center text-muted-foreground">
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

function MyProjects() {
  const { data, fetchNextPage, hasNextPage } =
    api.project.getMyProjects.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const projects = data?.pages.flatMap((page) => page.items) ?? [];

  if (!projects.length) {
    return (
      <p className="text-center text-muted-foreground">
        등록한 프로젝트가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} showStatus />
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
