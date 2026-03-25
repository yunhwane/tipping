import { api, HydrateClient } from "~/trpc/server";
import { CategoryNav } from "~/components/category-nav";
import { HeroBanner } from "~/components/hero-banner";
import {
  PopularSectionClient,
  LatestSectionClient,
} from "~/components/home-sections";

export const dynamic = "force-dynamic";

export default async function Home() {
  // 서버에서 prefetch — 클라이언트 React Query 캐시에 주입됨
  void api.tip.getPopular({});
  void api.tip.getAll({ limit: 6, sortBy: "latest" });

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
