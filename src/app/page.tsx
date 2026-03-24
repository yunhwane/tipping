"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { TipCard } from "~/components/tip-card";
import { CategoryNav } from "~/components/category-nav";
import { HeroBanner } from "~/components/hero-banner";
import { TrendingUp, Clock, ArrowRight } from "lucide-react";

export default function Home() {
  const { data: popularTips } = api.tip.getPopular.useQuery({});
  const { data: latestTips } = api.tip.getAll.useQuery({
    limit: 6,
    sortBy: "latest",
  });

  return (
    <div className="space-y-16">
      {/* 히어로 배너 */}
      <HeroBanner />

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
              className="group inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:shadow-sm"
            >
              전체 보기
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
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
              className="group inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:shadow-sm"
            >
              전체 보기
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
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
