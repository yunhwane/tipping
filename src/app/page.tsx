import { api, HydrateClient } from "~/trpc/server";
import { CategoryNav } from "~/components/category-nav";
import { HeroBanner } from "~/components/hero-banner";
import {
  PopularSectionClient,
  LatestSectionClient,
} from "~/components/home-sections";

export default async function Home() {
  // await하면 Next.js가 headers() 호출을 감지하여 자동으로 dynamic 페이지로 처리
  await Promise.all([
    api.tip.getPopular({}).catch(() => {}),
    api.tip.getAll({ limit: 6, sortBy: "latest" }).catch(() => {}),
  ]);

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
