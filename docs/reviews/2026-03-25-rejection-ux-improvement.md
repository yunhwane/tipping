# 리뷰: 반려 UI/UX 개선

## 구현 내용

### 1. 상세 페이지 반려 배너 (Tip + Project)
- 기존 한 줄 빨간 배너 → 알럿 스타일 그래디언트 배너
- AlertTriangle 아이콘 + "이 글/프로젝트는 반려되었습니다" 헤딩
- 반려 사유 + 검수 일시(reviewedAt) 표시
- 작성자에게 "수정하기 →" 인라인 CTA 버튼
- PENDING 배너는 기존 스타일 유지

### 2. 프로필 카드 반려 표시 (TipCard + ProjectShowcaseCard + ProjectCard)
- 반려된 카드: 보더 빨간색, 상단 컬러 바 빨간색
- 반려 사유를 별도 박스(bg-red-50)에 표시 (line-clamp-2)
- "수정하기" CTA 버튼 추가 (e.preventDefault로 Link 동작 차단)

### 3. 알림 벨 리디자인
- 반려 알림: 빨간 X 아이콘 + 왼쪽 빨간 보더 + "반려되었습니다" 라벨
- 승인 알림: 초록 체크 아이콘 + 왼쪽 초록 보더 + "승인" 라벨
- 타임스탬프를 라벨 옆에 인라인 배치
- 반려 알림에 "수정하기 →" CTA (편집 페이지로 직접 이동)

### 4. 백엔드 — 알림 메시지 포맷 변경
- 반려 알림 message에서 사유 제거: `"제목" 이(가) 반려되었습니다.`
- 사유는 콘텐츠의 rejectionReason 필드에서 직접 표시

## 변경 파일
| 파일 | 변경 |
|------|------|
| `src/app/tips/[id]/page.tsx` | 반려 배너 알럿 스타일 + CTA |
| `src/app/projects/[id]/page.tsx` | 동일 |
| `src/components/tip-card.tsx` | 카드 전체 빨간 강조 + 사유 박스 + CTA |
| `src/components/project-card.tsx` | 동일 |
| `src/components/project-showcase-card.tsx` | 동일 |
| `src/components/notification-bell.tsx` | 타입별 아이콘/색상 + CTA |
| `src/server/api/helpers/content-review.ts` | 알림 메시지 포맷 변경 |
| `docs/requirements/2026-03-25-rejection-ux-improvement.md` | 요구사항 문서 |

## 주요 결정
- DB 스키마 변경 없음 — Notification의 type 필드로 프론트에서 승인/반려 구분
- 알림 메시지에서 사유 분리 — 상세 페이지에서 rejectionReason 확인하는 흐름
- 카드 내 "수정하기" 버튼은 e.preventDefault + e.stopPropagation으로 Link 카드의 클릭 이벤트 차단

## 알려진 제한
- 기존에 생성된 반려 알림 message에는 사유가 포함되어 있을 수 있음 (하위 호환 문제 없음, 표시만 달라짐)
