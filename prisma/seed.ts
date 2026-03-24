import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// 테스트용 비밀번호: "test1234"
const TEST_PASSWORD = bcrypt.hashSync("test1234", 12);

async function main() {
  // === 상위 카테고리 ===
  const itDev = await prisma.topCategory.upsert({
    where: { slug: "it-dev" },
    update: {},
    create: { name: "IT/개발", slug: "it-dev" },
  });

  // === 하위 카테고리 ===
  const categories = [
    { name: "Frontend", slug: "frontend", description: "프론트엔드 개발 팁" },
    { name: "Backend", slug: "backend", description: "백엔드 개발 팁" },
    { name: "DevOps", slug: "devops", description: "DevOps & 인프라 팁" },
    { name: "Database", slug: "database", description: "데이터베이스 팁" },
    { name: "Mobile", slug: "mobile", description: "모바일 개발 팁" },
    { name: "AI/ML", slug: "ai-ml", description: "AI/ML 팁" },
    { name: "기타", slug: "etc", description: "기타 IT 관련 팁" },
  ];

  const catMap: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, topCategoryId: itDev.id },
    });
    catMap[cat.slug] = created.id;
  }

  // === 테스트 유저 ===
  const user1 = await prisma.user.upsert({
    where: { email: "dev1@tipping.test" },
    update: { role: "ADMIN", password: TEST_PASSWORD, emailVerified: new Date() },
    create: {
      name: "김개발",
      email: "dev1@tipping.test",
      password: TEST_PASSWORD,
      emailVerified: new Date(),
      image: "https://api.dicebear.com/9.x/avataaars/svg?seed=dev1",
      role: "ADMIN",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "dev2@tipping.test" },
    update: { password: TEST_PASSWORD, emailVerified: new Date() },
    create: {
      name: "이프론트",
      email: "dev2@tipping.test",
      password: TEST_PASSWORD,
      emailVerified: new Date(),
      image: "https://api.dicebear.com/9.x/avataaars/svg?seed=dev2",
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "dev3@tipping.test" },
    update: { password: TEST_PASSWORD, emailVerified: new Date() },
    create: {
      name: "박백엔드",
      email: "dev3@tipping.test",
      password: TEST_PASSWORD,
      emailVerified: new Date(),
      image: "https://api.dicebear.com/9.x/avataaars/svg?seed=dev3",
    },
  });

  // === 태그 ===
  const tagNames = [
    "React", "Next.js", "TypeScript", "Tailwind", "Node.js",
    "Prisma", "Docker", "PostgreSQL", "Git", "VS Code",
    "Python", "Go", "Rust", "GraphQL", "REST API",
    "CI/CD", "AWS", "Vercel", "테스트", "성능최적화",
  ];

  const tagMap: Record<string, string> = {};
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    tagMap[name] = tag.id;
  }

  // === 팁 데이터 ===
  type TipSeed = {
    title: string;
    content: string;
    authorId: string;
    categorySlug: string;
    tags: string[];
    viewCount: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    rejectionReason?: string;
    reviewedAt?: Date;
    reviewedBy?: string;
  };

  const tips: TipSeed[] = [
    {
      title: "React useEffect 클린업 함수, 왜 필요할까?",
      content: `## useEffect 클린업이 중요한 이유

컴포넌트가 언마운트되거나 의존성이 변경될 때, 이전 effect를 정리하지 않으면 메모리 누수가 발생합니다.

\`\`\`tsx
useEffect(() => {
  const controller = new AbortController();

  fetch('/api/data', { signal: controller.signal })
    .then(res => res.json())
    .then(setData);

  // 클린업: 컴포넌트 언마운트 시 요청 취소
  return () => controller.abort();
}, []);
\`\`\`

### 흔한 실수
- setInterval을 clearInterval 없이 사용
- WebSocket 연결을 닫지 않음
- 이벤트 리스너를 제거하지 않음

클린업 함수를 습관적으로 작성하면 버그를 예방할 수 있습니다.`,
      authorId: user2.id,
      categorySlug: "frontend",
      tags: ["React", "TypeScript"],
      viewCount: 342,
      status: "APPROVED",
      reviewedAt: new Date("2026-03-20"),
      reviewedBy: user1.id,
    },
    {
      title: "TypeScript satisfies 연산자 활용법",
      content: `## satisfies가 as보다 나은 이유

\`as\`는 타입을 강제로 단언하지만, \`satisfies\`는 타입 체크를 하면서도 추론된 타입을 유지합니다.

\`\`\`typescript
// as 사용 — 타입 추론이 사라짐
const config = {
  port: 3000,
  host: "localhost",
} as Config;

// satisfies 사용 — 타입 체크 + 추론 유지
const config = {
  port: 3000,
  host: "localhost",
} satisfies Config;

// config.port의 타입이 number로 추론됨 (as는 Config["port"])
\`\`\`

특히 객체 리터럴의 자동 완성이 유지되어서 DX가 좋아집니다.`,
      authorId: user1.id,
      categorySlug: "frontend",
      tags: ["TypeScript", "React"],
      viewCount: 528,
      status: "APPROVED",
      reviewedAt: new Date("2026-03-19"),
      reviewedBy: user1.id,
    },
    {
      title: "Next.js App Router에서 서버 컴포넌트 데이터 페칭 패턴",
      content: `## 서버 컴포넌트 = 직접 await

App Router에서는 서버 컴포넌트에서 직접 async/await로 데이터를 가져올 수 있습니다.

\`\`\`tsx
// app/posts/page.tsx — 서버 컴포넌트
export default async function PostsPage() {
  const posts = await db.post.findMany();

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
\`\`\`

### 핵심 포인트
- **서버 컴포넌트**: 직접 DB 접근 가능, 번들에 포함 안 됨
- **클라이언트 컴포넌트**: useEffect나 React Query 사용
- **혼합 패턴**: 서버에서 fetch → 클라이언트 컴포넌트에 props로 전달

서버 컴포넌트를 기본으로 쓰고, 인터랙션이 필요한 부분만 "use client"로 분리하세요.`,
      authorId: user1.id,
      categorySlug: "frontend",
      tags: ["Next.js", "React", "TypeScript"],
      viewCount: 891,
      status: "APPROVED",
      reviewedAt: new Date("2026-03-18"),
      reviewedBy: user1.id,
    },
    {
      title: "Tailwind CSS v4 마이그레이션 핵심 변경점",
      content: `## Tailwind v4에서 달라진 것들

### 1. CSS-first 설정
tailwind.config.js 대신 CSS에서 직접 설정합니다.

\`\`\`css
@import "tailwindcss";
@theme {
  --color-brand: #3b82f6;
  --font-display: "Inter", sans-serif;
}
\`\`\`

### 2. 자동 content 감지
더 이상 content 배열을 설정할 필요가 없습니다.

### 3. 새로운 유틸리티
- \`text-wrap-balance\`
- \`size-*\` (width + height 동시)
- \`inset-shadow-*\`

### 마이그레이션 팁
\`npx @tailwindcss/upgrade\` 명령어로 자동 마이그레이션 가능합니다.`,
      authorId: user2.id,
      categorySlug: "frontend",
      tags: ["Tailwind", "Next.js"],
      viewCount: 673,
      status: "APPROVED",
      reviewedAt: new Date("2026-03-17"),
      reviewedBy: user1.id,
    },
    {
      title: "Node.js에서 환경변수 안전하게 관리하는 법",
      content: `## .env만으로는 부족합니다

런타임에 환경변수가 없으면 조용히 undefined가 되어 버그 추적이 어렵습니다.

### 해결책: zod로 환경변수 검증

\`\`\`typescript
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(1),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]),
});

export const env = envSchema.parse(process.env);
\`\`\`

앱 시작 시점에 검증이 실패하면 즉시 에러가 나므로 배포 후 장애를 예방할 수 있습니다.

### 추가 팁
- \`.env.example\`을 git에 커밋해서 필요한 변수 목록을 공유하세요
- 시크릿은 절대 하드코딩하지 마세요`,
      authorId: user3.id,
      categorySlug: "backend",
      tags: ["Node.js", "TypeScript"],
      viewCount: 445,
      status: "APPROVED",
      reviewedAt: new Date("2026-03-16"),
      reviewedBy: user1.id,
    },
    {
      title: "Prisma에서 N+1 문제 해결하기",
      content: `## N+1 쿼리 문제란?

리스트를 가져온 뒤 각 항목의 관계 데이터를 개별 쿼리로 가져오면 N+1번의 쿼리가 발생합니다.

### 해결: include 또는 select 사용

\`\`\`typescript
// ❌ N+1 문제
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
  });
}

// ✅ 한 번의 쿼리로 해결
const users = await prisma.user.findMany({
  include: {
    posts: true,
  },
});
\`\`\`

### 추가 팁
- \`select\`로 필요한 필드만 가져오면 더 빠릅니다
- Prisma의 \`relationLoadStrategy: "join"\`을 사용하면 서브쿼리 대신 JOIN을 사용합니다`,
      authorId: user1.id,
      categorySlug: "backend",
      tags: ["Prisma", "Node.js", "PostgreSQL"],
      viewCount: 367,
      status: "APPROVED",
      reviewedAt: new Date("2026-03-15"),
      reviewedBy: user1.id,
    },
    {
      title: "Docker 이미지 크기 80% 줄이는 멀티 스테이지 빌드",
      content: `## 멀티 스테이지 빌드

빌드 도구는 최종 이미지에 필요 없습니다.

\`\`\`dockerfile
# 1단계: 빌드
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2단계: 실행 (빌드 도구 제외)
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

CMD ["npm", "start"]
\`\`\`

### 결과
- 빌드 이미지: ~1.2GB
- 최종 이미지: ~200MB

\`.dockerignore\`도 꼭 설정하세요: node_modules, .git, .next 등을 제외합니다.`,
      authorId: user3.id,
      categorySlug: "devops",
      tags: ["Docker", "Node.js", "CI/CD"],
      viewCount: 756,
      status: "APPROVED",
      reviewedAt: new Date("2026-03-14"),
      reviewedBy: user1.id,
    },
    {
      title: "PostgreSQL 인덱스, 언제 어떤 걸 써야 할까?",
      content: `## 인덱스 종류별 사용 시나리오

### B-tree (기본)
대부분의 경우에 적합. =, <, >, BETWEEN, ORDER BY

\`\`\`sql
CREATE INDEX idx_users_email ON users(email);
\`\`\`

### GIN (역인덱스)
배열, JSONB, 전문 검색에 적합

\`\`\`sql
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);
\`\`\`

### 복합 인덱스
여러 컬럼을 함께 필터링할 때

\`\`\`sql
-- 순서가 중요! 자주 필터링하는 컬럼을 앞에
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);
\`\`\`

### 팁
- \`EXPLAIN ANALYZE\`로 쿼리 플랜 확인
- 인덱스가 많으면 INSERT/UPDATE 성능이 떨어짐
- 카디널리티가 낮은 컬럼(예: boolean)에는 인덱스 효과가 적음`,
      authorId: user1.id,
      categorySlug: "database",
      tags: ["PostgreSQL", "성능최적화"],
      viewCount: 489,
      status: "APPROVED",
      reviewedAt: new Date("2026-03-13"),
      reviewedBy: user1.id,
    },
    {
      title: "Git 커밋 메시지 컨벤션 정리",
      content: `## Conventional Commits

\`\`\`
<type>(<scope>): <description>

[optional body]
[optional footer]
\`\`\`

### 타입
| 타입 | 설명 |
|------|------|
| feat | 새로운 기능 |
| fix | 버그 수정 |
| docs | 문서 변경 |
| style | 코드 포맷팅 (기능 변화 없음) |
| refactor | 리팩토링 |
| test | 테스트 추가/수정 |
| chore | 빌드, 설정 변경 |

### 예시
\`\`\`
feat(auth): add GitHub OAuth login
fix(api): handle null user in session callback
docs: update README with setup instructions
\`\`\`

### 왜 중요한가?
- 자동 CHANGELOG 생성 가능
- 시맨틱 버저닝 자동화
- 코드 리뷰 시 변경 의도를 빠르게 파악`,
      authorId: user2.id,
      categorySlug: "etc",
      tags: ["Git"],
      viewCount: 923,
      status: "APPROVED",
      reviewedAt: new Date("2026-03-12"),
      reviewedBy: user1.id,
    },
    {
      title: "VS Code 생산성 200% 올리는 단축키 모음",
      content: `## 꼭 알아야 할 단축키

### 탐색
- \`Cmd+P\` — 파일 빠른 열기
- \`Cmd+Shift+P\` — 커맨드 팔레트
- \`Cmd+G\` — 특정 라인으로 이동
- \`Cmd+Shift+O\` — 심볼로 이동

### 편집
- \`Opt+↑/↓\` — 라인 이동
- \`Opt+Shift+↑/↓\` — 라인 복제
- \`Cmd+D\` — 같은 단어 다음 선택 (멀티커서)
- \`Cmd+Shift+K\` — 라인 삭제
- \`Cmd+/\` — 주석 토글

### 터미널
- Ctrl+백틱 — 터미널 토글
- Cmd+백슬래시 — 에디터 분할

### 추천 확장
- **Error Lens**: 에러를 인라인으로 표시
- **GitLens**: git blame 인라인 표시
- **Pretty TypeScript Errors**: TS 에러를 읽기 쉽게`,
      authorId: user3.id,
      categorySlug: "etc",
      tags: ["VS Code"],
      viewCount: 1203,
      status: "PENDING",
    },
    {
      title: "REST API 설계 시 꼭 지켜야 할 5가지 규칙",
      content: `## 좋은 REST API의 조건

### 1. 명사형 URL
\`\`\`
✅ GET /users/123/posts
❌ GET /getPostsByUser?id=123
\`\`\`

### 2. HTTP 메서드를 의미에 맞게
- GET: 조회
- POST: 생성
- PUT/PATCH: 수정
- DELETE: 삭제

### 3. 적절한 상태 코드
- 200: 성공
- 201: 생성 성공
- 400: 클라이언트 에러
- 404: 리소스 없음
- 500: 서버 에러

### 4. 페이지네이션
\`\`\`
GET /posts?page=2&limit=20
GET /posts?cursor=abc123&limit=20
\`\`\`

### 5. 일관된 응답 포맷
\`\`\`json
{
  "data": [...],
  "meta": { "total": 100, "page": 2 }
}
\`\`\``,
      authorId: user1.id,
      categorySlug: "backend",
      tags: ["REST API", "Node.js"],
      viewCount: 612,
      status: "PENDING",
    },
    {
      title: "GitHub Actions CI/CD 파이프라인 5분 만에 세팅하기",
      content: `## 기본 CI 워크플로우

\`\`\`yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
\`\`\`

### 추가 팁
- \`cache: 'npm'\`으로 의존성 캐싱 → 빌드 시간 단축
- PR에서만 테스트 돌리고 main push에서 배포
- 시크릿은 GitHub Settings > Secrets에 저장`,
      authorId: user3.id,
      categorySlug: "devops",
      tags: ["CI/CD", "Git"],
      viewCount: 534,
      status: "REJECTED",
      rejectionReason: "내용이 너무 간략합니다. 실제 프로젝트 적용 사례를 추가해 주세요.",
      reviewedAt: new Date("2026-03-22"),
      reviewedBy: user1.id,
    },
  ];

  for (const tipData of tips) {
    const existing = await prisma.tip.findFirst({
      where: { title: tipData.title },
    });
    if (existing) continue;

    await prisma.tip.create({
      data: {
        title: tipData.title,
        content: tipData.content,
        authorId: tipData.authorId,
        categoryId: catMap[tipData.categorySlug]!,
        viewCount: tipData.viewCount,
        status: tipData.status,
        rejectionReason: tipData.rejectionReason ?? null,
        reviewedAt: tipData.reviewedAt ?? null,
        reviewedBy: tipData.reviewedBy ?? null,
        tags: {
          connect: tipData.tags.map((name) => ({ name })),
        },
      },
    });
  }

  // === 프로젝트 데이터 ===
  type ProjectSeed = {
    title: string;
    description: string;
    url: string;
    authorId: string;
    tags: string[];
    viewCount: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    rejectionReason?: string;
    reviewedAt?: Date;
    reviewedBy?: string;
  };

  const projects: ProjectSeed[] = [
    {
      title: "Tipping",
      description:
        "한국 개발자를 위한 IT/개발 팁 공유 커뮤니티. Next.js App Router + tRPC + Prisma + PostgreSQL 기반의 풀스택 프로젝트입니다.",
      url: "https://github.com/example/tipping",
      authorId: user1.id,
      tags: ["Next.js", "TypeScript", "Prisma", "Tailwind"],
      viewCount: 234,
      status: "APPROVED",
      reviewedAt: new Date("2026-03-18"),
      reviewedBy: user1.id,
    },
    {
      title: "DevDash",
      description:
        "개발자를 위한 대시보드 앱. GitHub, Linear, Slack 알림을 한 곳에서 모아보고, 코드 리뷰 현황과 배포 상태를 실시간으로 확인할 수 있습니다.",
      url: "https://github.com/example/devdash",
      authorId: user2.id,
      tags: ["React", "Node.js", "GraphQL"],
      viewCount: 456,
      status: "APPROVED",
      reviewedAt: new Date("2026-03-17"),
      reviewedBy: user1.id,
    },
    {
      title: "SQLPlayground",
      description:
        "브라우저에서 바로 SQL 쿼리를 연습할 수 있는 인터랙티브 학습 도구. 테이블 시각화, 쿼리 실행 계획 분석, 단계별 튜토리얼을 제공합니다.",
      url: "https://github.com/example/sql-playground",
      authorId: user3.id,
      tags: ["PostgreSQL", "React", "TypeScript"],
      viewCount: 789,
      status: "APPROVED",
      reviewedAt: new Date("2026-03-16"),
      reviewedBy: user1.id,
    },
    {
      title: "GitFlow CLI",
      description:
        "Git 워크플로우를 자동화하는 CLI 도구. 브랜치 생성, PR 템플릿 자동 적용, 커밋 컨벤션 검사, 릴리즈 태깅을 한 명령어로 처리합니다.",
      url: "https://github.com/example/gitflow-cli",
      authorId: user1.id,
      tags: ["Go", "Git", "CI/CD"],
      viewCount: 321,
      status: "PENDING",
    },
    {
      title: "DockerCompose Generator",
      description:
        "웹 UI에서 클릭 몇 번으로 docker-compose.yml을 생성하는 도구. 주요 서비스(PostgreSQL, Redis, Nginx 등) 템플릿을 제공하고 포트 충돌도 자동 감지합니다.",
      url: "https://github.com/example/compose-gen",
      authorId: user3.id,
      tags: ["Docker", "React", "Node.js"],
      viewCount: 567,
      status: "REJECTED",
      rejectionReason: "프로젝트 설명에 실제 사용법과 스크린샷을 추가해 주세요.",
      reviewedAt: new Date("2026-03-21"),
      reviewedBy: user1.id,
    },
  ];

  for (const projData of projects) {
    const existing = await prisma.project.findFirst({
      where: { title: projData.title },
    });
    if (existing) continue;

    await prisma.project.create({
      data: {
        title: projData.title,
        description: projData.description,
        url: projData.url,
        authorId: projData.authorId,
        viewCount: projData.viewCount,
        status: projData.status,
        rejectionReason: projData.rejectionReason ?? null,
        reviewedAt: projData.reviewedAt ?? null,
        reviewedBy: projData.reviewedBy ?? null,
        tags: {
          connect: projData.tags.map((name) => ({ name })),
        },
      },
    });
  }

  // === 좋아요 데이터 ===
  const allTips = await prisma.tip.findMany();
  for (const tip of allTips) {
    const users = [user1, user2, user3].filter(
      (u) => u.id !== tip.authorId,
    );
    // 각 팁에 랜덤으로 좋아요 추가
    for (const user of users) {
      if (Math.random() > 0.3) {
        await prisma.like.upsert({
          where: {
            userId_tipId: { userId: user.id, tipId: tip.id },
          },
          update: {},
          create: { userId: user.id, tipId: tip.id },
        });
      }
    }
  }

  // === 댓글 데이터 ===
  const sampleComments = [
    "좋은 팁 감사합니다! 바로 적용해봐야겠어요.",
    "이거 몰랐는데 덕분에 알게 됐네요 👍",
    "실무에서도 자주 겪는 문제인데 정리가 깔끔하네요.",
    "혹시 관련해서 추천할 만한 자료가 더 있을까요?",
    "팀에 공유했습니다. 도움이 많이 됐어요!",
  ];

  const firstFiveTips = allTips.slice(0, 5);
  for (let i = 0; i < firstFiveTips.length; i++) {
    const tip = firstFiveTips[i]!;
    const commenter = [user1, user2, user3].find(
      (u) => u.id !== tip.authorId,
    )!;

    const existing = await prisma.comment.findFirst({
      where: { tipId: tip.id, authorId: commenter.id },
    });
    if (existing) continue;

    await prisma.comment.create({
      data: {
        content: sampleComments[i]!,
        tipId: tip.id,
        authorId: commenter.id,
      },
    });
  }

  console.log("Seed completed with test data!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
