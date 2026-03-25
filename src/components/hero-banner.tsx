"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Lightbulb,
  Sparkles,
  Code2,
  Rocket,
  Users,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectFade, Autoplay, Pagination } from "swiper/modules";
import { cn } from "~/lib/utils";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

const slides = [
  {
    icon: Lightbulb,
    iconBg: "bg-amber-100 text-amber-600",
    iconRing: "ring-amber-200",
    bg: "from-amber-50 via-orange-50 to-yellow-50",
    blobA: "bg-amber-200/40",
    blobB: "bg-orange-200/40",
    blobC: "bg-yellow-200/30",
    primaryBtn:
      "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/25 hover:scale-[1.03]",
    secondaryBtn:
      "bg-white text-amber-600 border-amber-300 hover:bg-amber-50",
    dotActive: "bg-amber-500",
    badge: "bg-amber-100/80 text-amber-700 border-amber-200/60",
    title: (
      <>
        검색보다 빠른
        <br />
        <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
          개발 팁 한 줄
        </span>
      </>
    ),
    description: (
      <>
        개발하다 막힐 때, 검색보다 빠른 팁 한 줄.
        <br />
        개발자들이 직접 공유하는 실무 노하우.
      </>
    ),
    stat: "1,200+ 팁 공유됨",
    primaryLink: { href: "/tips", label: "팁 둘러보기", icon: Sparkles },
    secondaryLink: { href: "/tips/new", label: "팁 작성하기" },
  },
  {
    icon: Code2,
    iconBg: "bg-blue-100 text-blue-600",
    iconRing: "ring-blue-200",
    bg: "from-blue-50 via-indigo-50 to-sky-50",
    blobA: "bg-blue-200/40",
    blobB: "bg-indigo-200/40",
    blobC: "bg-sky-200/30",
    primaryBtn:
      "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.03]",
    secondaryBtn:
      "bg-white text-blue-600 border-blue-300 hover:bg-blue-50",
    dotActive: "bg-blue-500",
    badge: "bg-blue-100/80 text-blue-700 border-blue-200/60",
    title: (
      <>
        실전에서 바로 쓰는
        <br />
        <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
          코드 스니펫
        </span>
      </>
    ),
    description: (
      <>
        React, TypeScript, Node.js 등<br />
        현업 개발자의 검증된 코드를 만나보세요.
      </>
    ),
    stat: "500+ 코드 스니펫",
    primaryLink: { href: "/tips", label: "코드 보기", icon: Code2 },
    secondaryLink: { href: "/tips/new", label: "코드 공유하기" },
  },
  {
    icon: Rocket,
    iconBg: "bg-emerald-100 text-emerald-600",
    iconRing: "ring-emerald-200",
    bg: "from-emerald-50 via-teal-50 to-cyan-50",
    blobA: "bg-emerald-200/40",
    blobB: "bg-teal-200/40",
    blobC: "bg-cyan-200/30",
    primaryBtn:
      "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.03]",
    secondaryBtn:
      "bg-white text-emerald-600 border-emerald-300 hover:bg-emerald-50",
    dotActive: "bg-emerald-500",
    badge: "bg-emerald-100/80 text-emerald-700 border-emerald-200/60",
    title: (
      <>
        사이드 프로젝트를
        <br />
        <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
          공유하세요
        </span>
      </>
    ),
    description: (
      <>
        만들고 있는 프로젝트를 소개하고
        <br />
        다른 개발자의 피드백을 받아보세요.
      </>
    ),
    stat: "150+ 프로젝트 등록",
    primaryLink: { href: "/projects", label: "프로젝트 보기", icon: Rocket },
    secondaryLink: { href: "/projects/new", label: "프로젝트 등록" },
  },
  {
    icon: Users,
    iconBg: "bg-purple-100 text-purple-600",
    iconRing: "ring-purple-200",
    bg: "from-purple-50 via-fuchsia-50 to-pink-50",
    blobA: "bg-purple-200/40",
    blobB: "bg-fuchsia-200/40",
    blobC: "bg-pink-200/30",
    primaryBtn:
      "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.03]",
    secondaryBtn:
      "bg-white text-purple-600 border-purple-300 hover:bg-purple-50",
    dotActive: "bg-purple-500",
    badge: "bg-purple-100/80 text-purple-700 border-purple-200/60",
    title: (
      <>
        함께 성장하는
        <br />
        <span className="bg-gradient-to-r from-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
          개발 커뮤니티
        </span>
      </>
    ),
    description: (
      <>
        좋아요, 북마크, 댓글로 소통하고
        <br />
        서로의 노하우를 나눠보세요.
      </>
    ),
    stat: "300+ 활성 개발자",
    primaryLink: { href: "/tips", label: "커뮤니티 참여", icon: Users },
    secondaryLink: { href: "/tips/new", label: "첫 팁 작성하기" },
  },
];

/* 테마별 dot 색상을 active bullet에 적용하기 위한 매핑 */
const dotColorMap: Record<string, string> = {
  "bg-amber-500": "#f59e0b",
  "bg-blue-500": "#3b82f6",
  "bg-emerald-500": "#10b981",
  "bg-purple-500": "#a855f7",
};

export function HeroBanner() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="relative overflow-hidden rounded-2xl">
      <Swiper
        modules={[EffectFade, Autoplay, Pagination]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{
          clickable: true,
          el: ".hero-pagination",
          renderBullet(index, className) {
            const slide = slides[index];
            const color = slide ? dotColorMap[slide.dotActive] ?? "#6b7280" : "#6b7280";
            return `<button class="${className}" aria-label="슬라이드 ${index + 1}" data-color="${color}"></button>`;
          },
        }}
        loop
        speed={600}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        className="hero-swiper"
      >
        {slides.map((slide, i) => {
          const Icon = slide.icon;
          const PrimaryIcon = slide.primaryLink.icon;
          return (
            <SwiperSlide key={i}>
              <div
                className={cn(
                  "relative flex min-h-[320px] items-center justify-center bg-gradient-to-br px-5 pt-8 pb-14 text-center sm:min-h-[420px] sm:px-12 sm:pt-10 sm:pb-16 lg:min-h-[460px]",
                  slide.bg,
                )}
              >
                {/* 배경 장식 — 3개 blob */}
                <div
                  className={cn(
                    "pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full blur-3xl sm:h-64 sm:w-64",
                    slide.blobA,
                  )}
                />
                <div
                  className={cn(
                    "pointer-events-none absolute -bottom-12 -right-12 h-44 w-44 rounded-full blur-3xl sm:h-56 sm:w-56",
                    slide.blobB,
                  )}
                />
                <div
                  className={cn(
                    "pointer-events-none absolute left-1/2 top-1/3 h-32 w-32 -translate-x-1/2 rounded-full blur-3xl sm:h-40 sm:w-40",
                    slide.blobC,
                  )}
                />

                {/* 도트 패턴 오버레이 */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, currentColor 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />

                <div className="relative">
                  {/* 아이콘 */}
                  <div
                    className={cn(
                      "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-2 animate-bounce sm:mb-5 sm:h-16 sm:w-16",
                      slide.iconRing,
                    )}
                    style={{ animationDuration: "3s" }}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6 sm:h-8 sm:w-8",
                        slide.iconBg.split(" ")[1],
                      )}
                    />
                  </div>

                  <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 leading-tight sm:text-4xl lg:text-5xl">
                    {slide.title}
                  </h1>

                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600 sm:mt-4 sm:text-base">
                    {slide.description}
                  </p>

                  {/* 통계 뱃지 */}
                  <div className="mt-2.5 flex justify-center sm:mt-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm",
                        slide.badge,
                      )}
                    >
                      <Sparkles className="h-3 w-3" />
                      {slide.stat}
                    </span>
                  </div>

                  {/* 버튼 */}
                  <div className="mt-5 flex flex-wrap justify-center gap-2.5 sm:mt-7 sm:gap-3">
                    <Link
                      href={slide.primaryLink.href}
                      className={cn(
                        "inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all duration-200 sm:h-11 sm:px-6",
                        slide.primaryBtn,
                      )}
                    >
                      <PrimaryIcon className="h-4 w-4" />
                      {slide.primaryLink.label}
                    </Link>
                    <Link
                      href={slide.secondaryLink.href}
                      className={cn(
                        "inline-flex h-10 items-center gap-2 rounded-xl border px-5 text-sm font-semibold transition-all duration-200 sm:h-11 sm:px-6",
                        slide.secondaryBtn,
                      )}
                    >
                      {slide.secondaryLink.label}
                    </Link>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* 커스텀 dot pagination */}
      <div className="hero-pagination absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-4" />

      <style jsx global>{`
        .hero-swiper {
          border-radius: inherit;
        }
        .hero-pagination .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: rgba(31, 41, 55, 0.25);
          opacity: 1;
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
          padding: 0;
        }
        .hero-pagination .swiper-pagination-bullet:hover {
          background: rgba(31, 41, 55, 0.4);
        }
        .hero-pagination .swiper-pagination-bullet-active {
          width: 24px;
          background: ${dotColorMap[slides[activeIndex]?.dotActive ?? ""] ?? "#6b7280"};
        }
      `}</style>
    </section>
  );
}
