"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Trash2 } from "lucide-react";

interface CommentSectionProps {
  tipId: string;
}

export function CommentSection({ tipId }: CommentSectionProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const utils = api.useUtils();

  const { data: comments } = api.comment.getByTipId.useQuery({ tipId });

  const createComment = api.comment.create.useMutation({
    onSuccess: () => {
      setContent("");
      void utils.comment.getByTipId.invalidate({ tipId });
      void utils.tip.getById.invalidate({ id: tipId });
    },
  });

  const deleteComment = api.comment.delete.useMutation({
    onSuccess: () => {
      void utils.comment.getByTipId.invalidate({ tipId });
      void utils.tip.getById.invalidate({ id: tipId });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      createComment.mutate({ tipId, content: content.trim() });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        댓글 {comments?.length ? `(${comments.length})` : ""}
      </h3>

      {session && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder="댓글을 입력하세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || createComment.isPending}
            >
              댓글 작성
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {comments?.map((comment) => (
          <div key={comment.id} className="flex gap-3 rounded-lg border p-3">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={comment.author.image ?? ""}
                alt={comment.author.name ?? ""}
              />
              <AvatarFallback className="text-xs">
                {comment.author.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {comment.author.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                  {session?.user.id === comment.author.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => deleteComment.mutate({ id: comment.id })}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="mt-1 text-sm">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
