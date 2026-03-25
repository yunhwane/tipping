"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { TipCard } from "~/components/tip-card";
import { CategoryNav } from "~/components/category-nav";
import { HeroBanner } from "~/components/hero-banner";
import { TrendingUp, Clock, ArrowRight, Flame, Sparkles } from "lucide-react";

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
        <CategoryNav />
      </section>

      {/* 인기 팁 */}
      {popularTips && popularTips.length > 0 && (
        <section>
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
              <TrendingUp className="h-4 w-4 text-red-500" />
            </div>
            <h2 className="text-xl font-bold">인기 팁</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {popularTips.slice(0, 5).map((tip) => (
              <TipCard key={tip.id} tip={tip} />
            ))}
            <Link
              href="/tips?sort=popular"
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-orange-200/60 bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-200/30"
            >
              {/* 배경 데코 */}
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-orange-200/30 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-red-200/20 blur-xl" />

              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 shadow-md shadow-orange-300/40">
                  <Flame className="h-5 w-5 text-white" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900">
                  인기 팁 전체 보기
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  가장 많은 관심을 받은 팁을 모아봤어요
                </p>
              </div>

              <div className="relative mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 transition-colors group-hover:text-orange-700">
                둘러보기
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* 최신 팁 */}
      {latestTips && latestTips.items.length > 0 && (
        <section>
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold">최신 팁</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latestTips.items.slice(0, 5).map((tip) => (
              <TipCard key={tip.id} tip={tip} />
            ))}
            <Link
              href="/tips"
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-blue-200/60 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-200/30"
            >
              {/* 배경 데코 */}
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-200/30 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-violet-200/20 blur-xl" />

              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 shadow-md shadow-blue-300/40">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900">
                  최신 팁 전체 보기
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  방금 올라온 따끈한 팁을 확인하세요
                </p>
              </div>

              <div className="relative mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition-colors group-hover:text-blue-700">
                둘러보기
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
