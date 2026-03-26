# fix: 조회수 증가가 DB에 반영되지 않는 버그 수정 — 리뷰

## 변경 내용

- `src/server/api/routers/tip.ts` — `getById` 쿼리에서 `void` fire-and-forget 패턴을 `await`로 변경

## 핵심 결정

- Vercel 서버리스 환경에서 `void` promise는 응답 반환 후 실행 보장이 안 됨
- `await`로 변경 시 ~수십ms 응답 지연이 발생하지만, 데이터 정합성이 우선
- `waitUntil()` API 대신 `await`를 선택한 이유: 단순하고, Prisma update는 충분히 빠름

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/server/api/routers/tip.ts` | `void ctx.db.tip.update(...)` → `await ctx.db.tip.update(...)` |

## 알려진 제한

- 기존 admin, e2e 관련 타입 에러는 이 PR 범위 밖 (기존 이슈)
