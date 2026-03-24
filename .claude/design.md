# Tipping — 카테고리별 팁 공유 플랫폼

> 한국 개발자를 위한 카테고리별 팁 공유 플랫폼 (확장 가능한 멀티 카테고리 구조)

## 개요

- **서비스명:** Tipping
- **컨셉:** 커뮤니티형 — 사용자들이 직접 팁을 등록하고 공유
- **타겟:** 한국 개발자 (한국어 기반)
- **MVP 범위:** IT/개발 팁 카테고리로 시작
- **MVP 기능:** 팁 CRUD, 카테고리, 좋아요/북마크, 검색, 댓글, 태그, 인기순 랭킹, 프로젝트 모음

## 확장 로드맵

MVP 이후 카테고리를 점진적으로 확장할 예정:

| 단계 | 카테고리 | 설명 |
|------|----------|------|
| **MVP** | IT/개발 | 프로그래밍, DevOps, 도구 사용법 등 |
| Phase 2 | 생활 | 요리, 청소, 정리정돈 등 |
| Phase 3 | 여행/문화 | 여행지 팁, 각국 문화/매너 등 |
| Phase 4+ | 기타 | 사용자 요청에 따라 확장 |

카테고리 모델은 처음부터 확장 가능하게 설계한다. 상위 카테고리(IT/개발, 생활, 여행 등) 개념을 데이터 모델에 반영한다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js (App Router) |
| 스캐폴딩 | create-t3-app |
| API 레이어 | tRPC |
| 데이터 페칭 | React Query (TanStack Query) |
| ORM | Prisma |
| DB | PostgreSQL |
| 인증 | NextAuth.js (GitHub 소셜 로그인) |
| UI | Tailwind CSS + shadcn/ui |
| 언어 | TypeScript |

---

## 데이터 모델

### User
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| name | String? | 닉네임 |
| email | String? | 이메일 |
| image | String? | 프로필 이미지 |
| tips | Tip[] | 작성한 팁 |
| comments | Comment[] | 작성한 댓글 |
| likes | Like[] | 좋아요한 팁 |
| bookmarks | Bookmark[] | 북마크한 팁 |

### Tip
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| title | String | 제목 |
| content | String (Text) | 마크다운 내용 |
| authorId | String | FK → User |
| categoryId | String | FK → Category |
| tags | Tag[] | M:N 관계 |
| comments | Comment[] | 댓글 목록 |
| likes | Like[] | 좋아요 목록 |
| bookmarks | Bookmark[] | 북마크 목록 |
| viewCount | Int (default: 0) | 조회수 |
| createdAt | DateTime | 생성일 |
| updatedAt | DateTime | 수정일 |

### TopCategory (상위 카테고리 — 확장용)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| name | String | 상위 카테고리명 (예: IT/개발, 생활, 여행) |
| slug | String (unique) | URL용 슬러그 |
| categories | Category[] | 하위 카테고리 목록 |

**MVP 기본값:** IT/개발 (하나만)

### Category (하위 카테고리)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| name | String | 카테고리명 |
| slug | String (unique) | URL용 슬러그 |
| description | String? | 설명 |
| topCategoryId | String | FK → TopCategory |
| tips | Tip[] | 소속 팁 목록 |

**MVP 기본 카테고리 (IT/개발 하위):** Frontend, Backend, DevOps, Database, Mobile, AI/ML, 기타

### Tag
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| name | String (unique) | 태그명 |
| tips | Tip[] | M:N 관계 |

### Comment
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| content | String | 댓글 내용 |
| authorId | String | FK → User |
| tipId | String | FK → Tip |
| createdAt | DateTime | 생성일 |

### Like (중간 테이블)
| 필드 | 타입 | 설명 |
|------|------|------|
| userId | String | FK → User |
| tipId | String | FK → Tip |
| createdAt | DateTime | 생성일 |

*복합 PK: (userId, tipId)*

### Bookmark (중간 테이블)
| 필드 | 타입 | 설명 |
|------|------|------|
| userId | String | FK → User |
| tipId | String | FK → Tip |
| createdAt | DateTime | 생성일 |

*복합 PK: (userId, tipId)*

### Project (프로젝트 모음)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| title | String | 프로젝트명 |
| description | String | 프로젝트 설명 |
| url | String? | 프로젝트 링크 (GitHub, 배포 URL 등) |
| imageUrl | String? | 썸네일 이미지 |
| authorId | String | FK → User |
| tags | Tag[] | M:N 관계 |
| likes | ProjectLike[] | 좋아요 목록 |
| viewCount | Int (default: 0) | 조회수 |
| createdAt | DateTime | 생성일 |
| updatedAt | DateTime | 수정일 |

### ProjectLike (중간 테이블)
| 필드 | 타입 | 설명 |
|------|------|------|
| userId | String | FK → User |
| projectId | String | FK → Project |
| createdAt | DateTime | 생성일 |

*복합 PK: (userId, projectId)*

---

## 페이지 구조

```
/                        → 홈 (인기 팁, 최신 팁, 카테고리 목록)
/tips                    → 팁 목록 (검색, 필터, 정렬)
/tips/[id]               → 팁 상세 (내용, 댓글, 좋아요/북마크)
/tips/new                → 팁 작성 (로그인 필요)
/tips/[id]/edit          → 팁 수정 (작성자만)
/category/[slug]         → 카테고리별 팁 목록
/tag/[name]              → 태그별 팁 목록
/projects                → 프로젝트 모음 목록
/projects/[id]           → 프로젝트 상세
/projects/new            → 프로젝트 등록 (로그인 필요)
/profile                 → 내 프로필 (작성한 팁, 북마크한 팁, 내 프로젝트)
/api/auth/*              → NextAuth 인증 엔드포인트
/api/trpc/*              → tRPC API 엔드포인트
```

### UI 구성

- **헤더:** 로고, 검색바, 카테고리 네비게이션, 로그인/프로필
- **홈:** 히어로 영역 + 인기 팁 카드 그리드 + 최신 팁
- **팁 카드:** 제목, 카테고리 뱃지, 태그, 좋아요 수, 조회수, 작성자
- **팁 상세:** 마크다운 렌더링, 좋아요/북마크 버튼, 댓글 영역

---

## tRPC 라우터

### tip
| 프로시저 | 타입 | 인증 | 설명 |
|----------|------|------|------|
| getAll | query | - | 목록 (페이지네이션, 정렬, 필터) |
| getById | query | - | 상세 조회 (+조회수 증가) |
| getPopular | query | - | 인기순 조회 |
| search | query | - | 제목/내용 검색 |
| create | mutation | 필요 | 팁 작성 |
| update | mutation | 필요 (작성자) | 팁 수정 |
| delete | mutation | 필요 (작성자) | 팁 삭제 |

### comment
| 프로시저 | 타입 | 인증 | 설명 |
|----------|------|------|------|
| getByTipId | query | - | 팁의 댓글 목록 |
| create | mutation | 필요 | 댓글 작성 |
| delete | mutation | 필요 (작성자) | 댓글 삭제 |

### like
| 프로시저 | 타입 | 인증 | 설명 |
|----------|------|------|------|
| toggle | mutation | 필요 | 좋아요 토글 |
| getCount | query | - | 좋아요 수 |

### bookmark
| 프로시저 | 타입 | 인증 | 설명 |
|----------|------|------|------|
| toggle | mutation | 필요 | 북마크 토글 |
| getMyBookmarks | query | 필요 | 내 북마크 목록 |

### category
| 프로시저 | 타입 | 인증 | 설명 |
|----------|------|------|------|
| getAll | query | - | 카테고리 목록 |
| getBySlug | query | - | 카테고리별 팁 |

### tag
| 프로시저 | 타입 | 인증 | 설명 |
|----------|------|------|------|
| getAll | query | - | 태그 목록 |
| getPopular | query | - | 인기 태그 |

### project
| 프로시저 | 타입 | 인증 | 설명 |
|----------|------|------|------|
| getAll | query | - | 프로젝트 목록 (페이지네이션, 정렬) |
| getById | query | - | 프로젝트 상세 |
| create | mutation | 필요 | 프로젝트 등록 |
| update | mutation | 필요 (작성자) | 프로젝트 수정 |
| delete | mutation | 필요 (작성자) | 프로젝트 삭제 |
| like.toggle | mutation | 필요 | 프로젝트 좋아요 토글 |

### 인기도 정렬 기준

```
score = likes * 3 + viewCount
```

좋아요에 가중치 3을 부여하여, 단순 조회수보다 사용자의 능동적 반응을 더 중요하게 반영한다.

---

## 인증 플로우

1. 사용자가 "GitHub로 로그인" 클릭
2. GitHub OAuth 페이지로 리다이렉트
3. 인증 완료 후 콜백 → NextAuth가 세션 생성
4. User 테이블에 계정 정보 upsert
5. tRPC protectedProcedure로 인증 필요 API 보호
