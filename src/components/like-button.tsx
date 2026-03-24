"use client";

import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "~/lib/utils";

interface LikeButtonProps {
  tipId: string;
  initialCount: number;
}

export function LikeButton({ tipId, initialCount }: LikeButtonProps) {
  const { data: session } = useSession();
  const utils = api.useUtils();

  const { data: status } = api.like.getStatus.useQuery(
    { tipId },
    { enabled: !!session },
  );

  const { data: countData } = api.like.getCount.useQuery({ tipId });

  const toggleLike = api.like.toggle.useMutation({
    onSuccess: () => {
      void utils.like.getStatus.invalidate({ tipId });
      void utils.like.getCount.invalidate({ tipId });
      void utils.tip.getById.invalidate({ id: tipId });
    },
  });

  const liked = status?.liked ?? false;
  const count = countData?.count ?? initialCount;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => toggleLike.mutate({ tipId })}
      disabled={!session || toggleLike.isPending}
      className="gap-1"
    >
      <Heart
        className={cn("h-4 w-4", liked && "fill-red-500 text-red-500")}
      />
      <span>{count}</span>
    </Button>
  );
}
