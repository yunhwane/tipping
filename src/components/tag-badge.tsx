"use client";

import { useRouter } from "next/navigation";
import { Hash } from "lucide-react";
import { cn } from "~/lib/utils";

interface TagBadgeProps {
  name: string;
  size?: "sm" | "md";
}

export function TagBadge({ name, size = "md" }: TagBadgeProps) {
  const router = useRouter();

  return (
    <span
      role="link"
      tabIndex={0}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/tag/${encodeURIComponent(name)}`);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          router.push(`/tag/${encodeURIComponent(name)}`);
        }
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-primary/10 bg-primary/5 font-medium text-primary transition-all hover:border-primary/25 hover:bg-primary/10 hover:shadow-sm cursor-pointer",
        size === "sm" && "px-2 py-0.5 text-[11px]",
        size === "md" && "px-2.5 py-1 text-xs",
      )}
    >
      <Hash
        className={cn(
          "shrink-0 opacity-50",
          size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3",
        )}
      />
      {name}
    </span>
  );
}
