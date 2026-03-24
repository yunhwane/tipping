"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import {
  Globe,
  Server,
  Container,
  Database,
  Smartphone,
  Brain,
  MoreHorizontal,
} from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  frontend: <Globe className="h-4 w-4" />,
  backend: <Server className="h-4 w-4" />,
  devops: <Container className="h-4 w-4" />,
  database: <Database className="h-4 w-4" />,
  mobile: <Smartphone className="h-4 w-4" />,
  "ai-ml": <Brain className="h-4 w-4" />,
  etc: <MoreHorizontal className="h-4 w-4" />,
};

export function CategoryNav() {
  const pathname = usePathname();
  const { data: categories } = api.category.getAll.useQuery();

  if (!categories) return null;

  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href="/tips"
        className={cn(
          "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
          pathname === "/tips"
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background hover:bg-muted",
        )}
      >
        전체
      </Link>
      {categories.map((cat) => {
        const isActive = pathname === `/category/${cat.slug}`;
        return (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:bg-muted",
            )}
          >
            {categoryIcons[cat.slug]}
            {cat.name}
            {cat._count.tips > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs",
                  isActive
                    ? "bg-primary-foreground/20"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {cat._count.tips}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
