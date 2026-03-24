"use client";

import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Bookmark } from "lucide-react";
import { cn } from "~/lib/utils";

interface BookmarkButtonProps {
  tipId: string;
}

export function BookmarkButton({ tipId }: BookmarkButtonProps) {
  const { data: session } = useSession();
  const utils = api.useUtils();

  const { data: status } = api.bookmark.getStatus.useQuery(
    { tipId },
    { enabled: !!session },
  );

  const toggleBookmark = api.bookmark.toggle.useMutation({
    onSuccess: () => {
      void utils.bookmark.getStatus.invalidate({ tipId });
      void utils.bookmark.getMyBookmarks.invalidate();
    },
  });

  const bookmarked = status?.bookmarked ?? false;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => toggleBookmark.mutate({ tipId })}
      disabled={!session || toggleBookmark.isPending}
    >
      <Bookmark
        className={cn(
          "h-4 w-4",
          bookmarked && "fill-yellow-500 text-yellow-500",
        )}
      />
    </Button>
  );
}
