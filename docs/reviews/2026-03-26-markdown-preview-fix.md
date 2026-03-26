# 리뷰: 마크다운 미리보기 수정 및 개선

## 구현 내용

### 1. MarkdownEditor 공통 컴포넌트 (`src/components/markdown-editor.tsx`)
- Tabs(작성/미리보기) + 마크다운 툴바 + Textarea를 하나의 재사용 컴포넌트로 추출
- 툴바 버튼: 굵게(B), 기울임(I), 코드, 링크, 목록, 번호 목록
- Ctrl+B / Ctrl+I 키보드 단축키 지원
- 미리보기 탭에서 `MarkdownContent` 컴포넌트로 실제 마크다운 렌더링

### 2. TipForm 수정 (`src/components/tip-form.tsx`)
- 기존 인라인 Tabs/Textarea 코드를 `MarkdownEditor`로 교체
- 미리보기가 raw text 대신 실제 마크다운으로 렌더링됨 (기존 버그 수정)

### 3. ProjectForm 수정 (`src/components/project-form.tsx`)
- 단순 Textarea를 `MarkdownEditor`로 교체
- 작성/미리보기 탭 + 마크다운 툴바 추가

### 4. 프로젝트 상세 페이지 수정 (`src/app/projects/[id]/page.tsx`)
- `whitespace-pre-wrap` div를 `MarkdownContent` 컴포넌트로 교체
- 프로젝트 설명이 마크다운으로 렌더링됨

### 5. E2E 테스트 (`e2e/markdown-editor.spec.ts`)
- Playwright 세팅 (playwright.config.ts, @playwright/test)
- 14개 테스트 케이스: 탭 전환, 툴바 동작, 마크다운 렌더링, GFM 테이블/코드블록 등

## 주요 결정
- 기존 `MarkdownContent` 컴포넌트를 그대로 재사용 (react-markdown + remark-gfm)
- 스키마/API 변경 없음 — 프론트엔드만 수정
- 에디터 라이브러리(CodeMirror 등) 대신 순수 textarea + 툴바 방식 채택 (경량)

## 변경 파일
- `src/components/markdown-editor.tsx` (신규)
- `src/components/tip-form.tsx` (수정)
- `src/components/project-form.tsx` (수정)
- `src/app/projects/[id]/page.tsx` (수정)
- `e2e/markdown-editor.spec.ts` (신규)
- `playwright.config.ts` (신규)
- `package.json` (E2E script, @playwright/test 추가)
- `.gitignore` (playwright, superpowers 추가)

## 알려진 제한
- E2E 테스트 실행에 .env 환경변수 필요 (로컬 dev 서버 필수)
- 선택 텍스트 감싸기(wrap selection)는 구현되어 있으나, 브라우저 환경에서만 동작
