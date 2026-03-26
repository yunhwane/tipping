# fix: 조회수 증가가 DB에 반영되지 않는 버그 수정

## 배경

- 팁 상세 페이지(`getById`)에서 조회수 증가를 `void` fire-and-forget 패턴으로 처리 중
- Vercel 서버리스 환경에서는 응답 반환 후 실행 컨텍스트가 종료되어 `void` promise가 실행되지 않음
- 결과: 상세 페이지에서는 `viewCount + 1`로 보여주지만, 실제 DB에는 미반영 → 카드 리스트에서 0으로 표시

## 요구사항

1. `void ctx.db.tip.update(...)` → `await ctx.db.tip.update(...)`로 변경
2. DB 업데이트 완료 후 응답 반환하여 데이터 정합성 보장
3. 주석 업데이트 (fire-and-forget 설명 제거)

## 영향 범위

- `src/server/api/routers/tip.ts` — `getById` 쿼리 1곳

## 기술 판단

- `await` 추가로 인한 응답 지연은 ~수십ms로, 사용자 체감 영향 미미
- 데이터 정합성이 성능보다 우선
