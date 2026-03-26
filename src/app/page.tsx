import { api, HydrateClient } from "~/trpc/server";
import { CategoryNav } from "~/components/category-nav";
import { HeroBanner } from "~/components/hero-banner";
import {
  PopularSectionClient,
  LatestSectionClient,
} from "~/components/home-sections";

// 60초마다 ISR 재생성 — force-dynamic 대비 TTFB 대폭 개선
export const revalidate = 60;

export default async function Home() {
  // 서버에서 prefetch — 클라이언트 React Query 캐시에 주입됨
  // .catch: 빌드 시 DB 미접속 환경에서 prerender 실패 방지
  void api.tip.getPopular({}).catch(() => {});
  void api.tip.getAll({ limit: 6, sortBy: "latest" }).catch(() => {});

  return (
    <HydrateClient>
      <div className="space-y-16">
        <HeroBanner />

        <section>
          <CategoryNav />
        </section>

        <PopularSectionClient />

        <LatestSectionClient />
      </div>
    </HydrateClient>
  );
}
