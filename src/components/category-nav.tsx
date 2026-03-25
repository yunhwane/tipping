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

  // 현재 URL에서 활성 TopCategory 자동 감지
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
      {/* TopCategory 탭 */}
      <div className="flex gap-2">
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
                "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted",
              )}
            >
              {tc.icon && <DynamicIcon name={tc.icon} className="h-4 w-4" />}
              {tc.name}
              {totalTips > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs",
                    isActive
                      ? "bg-primary-foreground/20"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {totalTips}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 하위 Category 목록 */}
      {activeTop && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/tips"
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/tips"
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-background hover:bg-muted",
            )}
          >
            전체
          </Link>
          {activeTop.categories.map((cat) => {
            const isActive = pathname === `/category/${cat.slug}`;
            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-muted",
                )}
              >
                {cat.icon && (
                  <DynamicIcon name={cat.icon} className="h-3.5 w-3.5" />
                )}
                {cat.name}
                {cat._count.tips > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-xs",
                      isActive
                        ? "bg-primary/20"
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
      )}
    </div>
  );
}
