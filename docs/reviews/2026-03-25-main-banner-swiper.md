# 메인 배너 Swiper 전환 + 반응형 개선 — 리뷰

## 구현 내용
- 커스텀 슬라이더 → Swiper (EffectFade + Autoplay + Pagination) 전환
- Fade crossFade 전환 효과 적용
- Autoplay 5초 + hover 시 일시정지
- 모바일 터치 스와이프 지원 (Swiper 내장)
- loop 모드 활성화

## 반응형 개선
- 모바일: min-h-[320px], 아이콘 h-12/w-12, 텍스트 text-3xl/text-sm, 버튼 h-10
- 태블릿(sm): min-h-[420px], 아이콘 h-16/w-16, 텍스트 text-4xl/text-base, 버튼 h-11
- 데스크톱(lg): min-h-[460px], 텍스트 text-5xl
- blob 장식도 반응형 크기 조정

## 주요 결정
- Swiper `renderBullet` + CSS 변수로 테마별 dot 색상 유지
- `activeIndex` state로 active bullet CSS 색상 동적 변경
- `style jsx global`로 Swiper 기본 스타일 오버라이드

## 변경 파일
- `src/components/hero-banner.tsx` — 전면 리팩토링
- `package.json` — swiper 패키지 추가
- `docs/requirements/2026-03-25-main-banner-swiper.md` — 요구사항 문서

## 제거된 코드
- `useState`(current, direction, isAnimating), `useCallback`(goTo, next), `useEffect`(setInterval)
- Tailwind animate-in / slide-in-from-right/left 애니메이션 클래스
- 커스텀 dot indicator JSX

## 알려진 제한사항
- 빌드 시 Supabase 환경변수 필요 (기존 이슈, 본 변경과 무관)
