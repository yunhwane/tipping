# Disquiet 스타일 마이페이지 리디자인

## Overview

프로필 페이지를 Disquiet 스타일로 리뉴얼한다. 풍부한 프로필 카드(bio, 소셜 링크, 활동 통계), 프로젝트 쇼케이스 카드, 설정 페이지 분리를 포함한다. 향후 생활/요리 등 다양한 카테고리가 추가될 예정이므로 소셜 링크는 범용적인 JSON 배열로 설계한다.

## 1. DB Schema Changes

### User 모델 필드 추가

```prisma
model User {
  // ... 기존 필드
  bio    String?  // 한줄 소개 (최대 100자)
  links  Json?    // 소셜 링크 배열: [{ label: string, url: string }]
}
```

- `bio`: 자유로운 한줄 소개. 100자 제한은 Zod에서 검증. 빈 문자열은 `null`로 변환 (`.transform(v => v.trim() || null)`)
- `links`: JSON 배열. 최대 5개. 각 요소는 `{ label: string, url: string }` 형태. URL은 HTTP(S)만 허용
- 기존 유저는 `bio: null`, `links: null`로 유지 (migration 시 기본값 불필요)

### 활동 통계

DB 필드 없이 쿼리로 집계 (각각 `count` 쿼리 사용, 전체 레코드 fetch 금지):
- 작성한 팁 수 (`Tip` where `authorId = userId AND status = APPROVED`)
- 등록한 프로젝트 수 (`Project` where `authorId = userId AND status = APPROVED`)
- 받은 총 좋아요 수: 두 개의 count 쿼리로 집계
  - `Like` count where `tip.authorId = userId`
  - `ProjectLike` count where `project.authorId = userId`
- 현재는 self-only. 타인 프로필 조회 기능은 이 스펙 범위 밖

## 2. tRPC API Changes

### user.getProfile 변경

기존 반환 필드에 추가:
```typescript
select: {
  id: true,
  name: true,
  email: true,
  image: true,
  bio: true,     // 추가
  links: true,   // 추가
}
```

### user.getProfileStats 신규

```typescript
user.getProfileStats: protectedProcedure
  .query() => {
    tipCount,       // APPROVED 팁 수
    projectCount,   // APPROVED 프로젝트 수
    totalLikes,     // 받은 총 좋아요 수 (팁 + 프로젝트)
  }
```

### user.updateProfile 변경

기존 input에 추가:
```typescript
input: z.object({
  name: z.string().min(2).max(20).transform(v => v.trim()).optional(),
  image: z.string().url().optional(),
  bio: z.string().max(100).transform(v => v.trim() || null).nullish(),  // 추가: 빈 문자열 → null
  links: z.array(z.object({                     // 추가
    label: z.string().min(1).max(20).transform(v => v.trim()),
    url: z.string().url().refine(
      url => /^https?:\/\//.test(url),
      "HTTP(S) URL만 허용됩니다"
    ),
  })).max(5).optional(),
})
```

**구현 노트:**
- 기존 `updateProfile`의 `data` 객체 타입이 `Record<string, string>`이므로, `links`(Json)를 수용하도록 리팩터링 필요
- Prisma `Json` 타입에 배열을 직접 전달: `data: { ...fields, links: input.links ?? undefined }`

## 3. Profile Header Card

### 레이아웃

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ┌──────┐                                          │
│   │Avatar│  이름                              ⚙️    │
│   │ 80px │  한줄 소개 (bio)                          │
│   └──────┘  📎 블로그  📎 유튜브  📎 GitHub           │
│                                                     │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│   │  팁 12개  │ │프로젝트 3 │ │ 좋아요 48 │            │
│   └──────────┘ └──────────┘ └──────────┘            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 구성 요소

- **아바타**: 80px, dicebear 아바타 (기존 유지)
- **이름**: text-2xl font-bold
- **bio**: text-sm text-muted-foreground, bio가 null/빈문자열이면 비표시
- **소셜 링크**: pill 형태 배지 (아이콘 + label), 클릭 시 새 탭. links가 비어있으면 비표시
- **활동 통계**: 3개 stat box (숫자 bold + 라벨 muted). border로 구분된 미니 카드. 로딩 중에는 `--`로 표시
- **설정 버튼**: 우측 상단 Settings 아이콘, 클릭 시 `/profile/settings` 이동

### 탭 구조

기존: 내 팁 / 북마크 / 내 프로젝트 / 설정
변경: **내 팁 / 내 프로젝트 / 북마크**

- 설정 탭 제거 → 헤더 ⚙️ 버튼으로 이동
- 탭 순서 변경: 프로젝트를 북마크보다 앞으로 (메이커 포트폴리오 강조)
- 기존 `handleProfileUpdate` 콜백 및 settings 관련 `activeTab` 로직 제거 (dead code 정리)

## 4. Project Showcase Card

프로필 내 프로젝트 탭 전용 카드 컴포넌트. 기존 `ProjectCard`는 변경하지 않는다.

### 레이아웃

```
┌─────────────────────────────────────────────────┐
│  🖼️ 프로젝트 이미지 (imageUrl)                    │
│  (없으면 그라데이션 플레이스홀더)                    │
├─────────────────────────────────────────────────┤
│  프로젝트 제목                                    │
│  설명 텍스트 (2줄 truncate)...                    │
│                                                 │
│  #태그1  #태그2  #태그3          ❤️ 12   👁️ 340  │
│                                                 │
│  🔗 서비스 바로가기                                │
└─────────────────────────────────────────────────┘
```

### 구성 요소

- **이미지 영역**: aspect-video, `imageUrl`이 있으면 표시, 없으면 그라데이션 배경 + 프로젝트 제목 텍스트
- **제목**: font-semibold
- **설명**: line-clamp-2, text-sm text-muted-foreground
- **태그**: 기존 TagBadge 컴포넌트 재활용
- **통계**: 좋아요 수 + 조회수 (Heart, Eye 아이콘)
- **서비스 링크**: `url` 필드가 있으면 "바로가기" 버튼 (ExternalLink 아이콘)
- **상태 뱃지**: showStatus prop이 true일 때 PENDING/APPROVED/REJECTED 표시 (기존 로직 유지)
- **그리드**: 2열 (`sm:grid-cols-2`) — 이미지가 포함된 큰 카드이므로 3열 대신 2열 사용. 팁/북마크 탭은 기존 3열 유지

## 5. Settings Page

### 라우트

`/profile/settings` — 새 페이지

### 구성

기존 `ProfileSettings` 컴포넌트를 확장하여 사용:

1. **프로필 수정 섹션**
   - 아바타 선택 (기존 dicebear 그리드)
   - 닉네임 입력 (기존)
   - 한줄 소개 (bio) — textarea, 100자 제한, 글자 수 카운터
   - 소셜 링크 편집 — 동적 추가/삭제 리스트
     - 각 행: label 입력 (자유 텍스트, 20자 제한) + url 입력
     - 삭제 버튼 (Trash2 아이콘)
     - "+ 링크 추가" 버튼 (최대 5개까지)
   - 저장 버튼

2. **비밀번호 변경 섹션** (기존 접이식 그대로)

### 인증

- `/profile/settings/page.tsx`도 클라이언트에서 `useSession` + `redirect`로 인증 체크 (기존 `/profile/page.tsx`와 동일 패턴)

### 네비게이션

- `/profile` 헤더의 ⚙️ 버튼 → `/profile/settings`
- `/profile/settings`에서 뒤로가기 → `/profile`로 돌아가기 (← 버튼)

## 6. Affected Files

### 수정

| 파일 | 변경 |
|------|------|
| `prisma/schema.prisma` | User에 `bio`, `links` 필드 추가 |
| `src/server/api/routers/user.ts` | getProfile에 bio/links 반환, getProfileStats 추가, updateProfile에 bio/links 입력 추가 |
| `src/app/profile/page.tsx` | 프로필 헤더 카드 리뉴얼, 탭 구조 변경 (설정 제거, 순서 변경) |
| `src/components/profile-settings.tsx` | bio 입력, 소셜 링크 편집 UI 추가 |

### 신규

| 파일 | 내용 |
|------|------|
| `src/app/profile/settings/page.tsx` | 설정 페이지 (ProfileSettings 컴포넌트 렌더) |
| `src/components/project-showcase-card.tsx` | 프로필 전용 프로젝트 쇼케이스 카드 |

### 변경 없음

- `src/components/project-card.tsx` — 기존 카드 유지
- `src/components/tip-card.tsx` — 변경 없음
- Admin 페이지, 다른 tRPC 라우터 — 변경 없음
