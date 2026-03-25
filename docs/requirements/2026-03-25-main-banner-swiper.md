# 메인 배너 Swiper 전환 + 반응형 개선

## 배경
현재 메인 배너(`hero-banner.tsx`)는 외부 라이브러리 없이 `useState` + `setInterval`로 구현되어 있음.
- exit 애니메이션 부재 (React key 기반 DOM 재생성 방식)
- 모바일 터치 스와이프 미지원
- 모바일 반응형 최적화 부족

## 요구사항
1. Swiper 라이브러리로 슬라이더 엔진 전환
2. Fade 전환 효과 적용
3. 모바일 터치 스와이프 지원
4. Autoplay 5초 + hover 시 일시정지
5. 모바일 반응형 개선 (높이, 텍스트, 버튼 크기)

## 범위
- `swiper` 패키지 설치
- `src/components/hero-banner.tsx` 리팩토링
- 반응형 breakpoint 조정

## 유지 사항
- 4개 슬라이드 콘텐츠 및 테마 컬러
- 닷 인디케이터 (Swiper pagination)
- 배경 blob 장식 + 도트 패턴

## 기술 접근
- Swiper React + EffectFade, Autoplay, Pagination 모듈
- Swiper의 커스텀 pagination으로 기존 테마별 dot 색상 유지
- Tailwind 반응형 클래스로 모바일/태블릿/데스크톱 분기

## 영향 파일
- `src/components/hero-banner.tsx`
- `package.json` (swiper 추가)
