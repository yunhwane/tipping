"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { TipCard } from "~/components/tip-card";
import { CategoryNav } from "~/components/category-nav";
import { buttonVariants } from "~/components/ui/button";
import { Lightbulb, TrendingUp, Clock, Sparkles } from "lucide-react";

export default function Home() {
  const { data: popularTips } = api.tip.getPopular.useQuery({});
  const { data: latestTips } = api.tip.getAll.useQuery({
    limit: 6,
    sortBy: "latest",
  });

  return (
    <div className="space-y-16">
      {/* 히어로 */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 px-6 py-16 text-center sm:px-12 sm:py-20">
        {/* 배경 장식 */}
        <div className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -right-8 h-36 w-36 rounded-full bg-orange-200/30 blur-3xl" />

        <div className="relative">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-amber-200">
            <Lightbulb className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Tip
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              ping
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-gray-600">
            개발하다 막힐 때, 검색보다 빠른 팁 한 줄.
            <br />
            개발자들이 직접 공유하는 실무 노하우.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/tips"
              className={buttonVariants({ size: "lg", className: "gap-2 shadow-md" })}
            >
              <Sparkles className="h-4 w-4" />
              팁 둘러보기
            </Link>
            <Link
              href="/tips/new"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "gap-2 bg-white/80 backdrop-blur",
              })}
            >
              팁 작성하기
            </Link>
          </div>
        </div>
      </section>

      {/* 카테고리 */}
      <section>
        <div className="mb-5 flex items-center gap-2">
          <h2 className="text-xl font-bold">카테고리</h2>
        </div>
        <CategoryNav />
      </section>

      {/* 인기 팁 */}
      {popularTips && popularTips.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                <TrendingUp className="h-4 w-4 text-red-500" />
              </div>
              <h2 className="text-xl font-bold">인기 팁</h2>
            </div>
            <Link
              href="/tips?sort=popular"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              전체 보기 →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {popularTips.slice(0, 6).map((tip) => (
              <TipCard key={tip.id} tip={tip} />
            ))}
          </div>
        </section>
      )}

      {/* 최신 팁 */}
      {latestTips && latestTips.items.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <h2 className="text-xl font-bold">최신 팁</h2>
            </div>
            <Link
              href="/tips"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              전체 보기 →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latestTips.items.map((tip) => (
              <TipCard key={tip.id} tip={tip} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
