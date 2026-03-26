# 마크다운 미리보기 수정 및 개선

## 배경
- Tip 작성 시 미리보기 탭이 마크다운을 렌더링하지 않고 raw text를 표시
- Project 작성 시 미리보기 기능이 아예 없음
- 프로젝트 상세 페이지에서도 마크다운이 렌더링되지 않음 (plain text)

## 요구사항
1. TipForm 미리보기: `MarkdownContent` 컴포넌트로 실제 마크다운 렌더링
2. ProjectForm: 탭 기반 작성/미리보기 에디터 추가
3. 프로젝트 상세 페이지: `MarkdownContent`로 description 렌더링
4. 마크다운 툴바: 볼드, 이탤릭, 코드, 링크, 리스트 버튼 제공
5. 공통 `MarkdownEditor` 컴포넌트 추출하여 TipForm, ProjectForm에서 재사용

## 범위
- `src/components/markdown-editor.tsx` — 신규 공통 컴포넌트
- `src/components/tip-form.tsx` — MarkdownEditor 사용으로 전환
- `src/components/project-form.tsx` — MarkdownEditor 사용으로 전환
- `src/app/projects/[id]/page.tsx` — MarkdownContent 적용
- E2E 테스트: Playwright 세팅 + 마크다운 에디터 테스트

## 기술 접근
- 기존 `MarkdownContent` 컴포넌트 재사용 (react-markdown + remark-gfm)
- 툴바는 textarea의 selectionStart/selectionEnd를 활용한 텍스트 조작
- 기존 Tabs UI 컴포넌트(@base-ui/react) 활용
- 스키마/API 변경 없음
