import Link from "next/link";
import { Hash } from "lucide-react";

interface TagBadgeProps {
  name: string;
}

export function TagBadge({ name }: TagBadgeProps) {
  return (
    <Link
      href={`/tag/${encodeURIComponent(name)}`}
      className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
    >
      <Hash className="h-3 w-3 opacity-50" />
      {name}
    </Link>
  );
}
