"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { DynamicIcon } from "~/components/dynamic-icon";

export function CategoryNav() {
  const pathname = usePathname();
  const { data: topCategories } = api.category.getTopCategories.useQuery();
  const [activeTopSlug, setActiveTopSlug] = useState<string | null>(null);

  if (!topCategories) return null;

  const currentCategorySlug = pathname.startsWith("/category/")
    ? pathname.split("/")[2]
    : null;

  const resolvedTopSlug =
    activeTopSlug ??
    topCategories.find((tc) =>
      tc.categories.some((c) => c.slug === currentCategorySlug),
    )?.slug ??
    topCategories[0]?.slug ??
    null;

  const activeTop = topCategories.find((tc) => tc.slug === resolvedTopSlug);

  return (
    <div className="space-y-3">
      {/* Segmented Control — TopCategory */}
      <div className="inline-flex rounded-2xl bg-muted p-1.5">
        {topCategories.map((tc) => {
          const isActive = tc.slug === resolvedTopSlug;
          const totalTips = tc.categories.reduce(
            (sum, c) => sum + c._count.tips,
            0,
          );
          return (
            <button
              key={tc.id}
              onClick={() => setActiveTopSlug(tc.slug)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold transition-all",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tc.icon && <DynamicIcon name={tc.icon} className="h-5 w-5" />}
              {tc.name}
              {totalTips > 0 && (
                <span
                  className={cn(
                    "min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-center text-xs font-medium",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground/60",
                  )}
                >
                  {totalTips}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Pill Chips — Sub-categories */}
      {activeTop && (
        <div className="flex flex-wrap gap-1.5">
          {activeTop.categories.map((cat) => {
            const isActive = pathname === `/category/${cat.slug}`;
            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {cat.icon && (
                  <DynamicIcon name={cat.icon} className="h-3 w-3" />
                )}
                {cat.name}
                {cat._count.tips > 0 && (
                  <span
                    className={cn(
                      "ml-0.5 text-[10px]",
                      isActive
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground/50",
                    )}
                  >
                    {cat._count.tips}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
