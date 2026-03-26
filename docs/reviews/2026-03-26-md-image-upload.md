# 리뷰: 마크다운 에디터 이미지 업로드

## 구현 내용

마크다운 에디터에 이미지 업로드 기능을 추가하여 Tip, Project 작성 시 이미지를 쉽게 삽입할 수 있도록 함.

### 지원하는 업로드 방식
1. **드래그 앤 드롭** — textarea에 이미지 파일 끌어다 놓기
2. **클립보드 붙여넣기** — Cmd+V / Ctrl+V로 스크린샷/이미지 붙여넣기
3. **파일 선택 버튼** — 툴바의 이미지 아이콘 클릭 → 파일 선택 다이얼로그

### 업로드 동작
- 파일 유효성 검증 (이미지 타입, 5MB 이하)
- 커서 위치에 `![업로드 중...]()` placeholder 삽입
- Supabase Storage에 업로드 (기존 `uploadImage()` 활용)
- 완료 시 placeholder를 `![image](public_url)`로 교체
- 실패 시 placeholder 제거 + alert 알림
- 업로드 중 툴바 아이콘이 스피너로 변경

## 주요 결정

1. **valueRef 패턴**: `onChange`가 `(value: string) => void` 시그니처이므로 React setState의 callback 패턴을 쓸 수 없음. `useRef`로 최신 value를 추적하여 비동기 업로드 완료 시 stale closure 문제 방지.

2. **bucket prop**: `MarkdownEditor`에 `bucket` prop을 추가하여 Tip 작성 시 `tips` 버킷, Project 작성 시 `projects` 버킷에 저장되도록 분리.

3. **기존 인프라 재사용**: 새로운 API 엔드포인트 없이 기존 `uploadImage()` 유틸리티와 Supabase Storage 설정을 그대로 활용.

## 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `src/components/markdown-editor.tsx` | 이미지 업로드 기능 추가 (핵심 변경) |
| `src/components/tip-form.tsx` | `bucket="tips"` prop 전달 |
| `src/components/project-form.tsx` | `bucket="projects"` prop 전달 |
| `docs/requirements/2026-03-26-md-image-upload.md` | 요구사항 문서 |

## 알려진 제한사항

- 동시에 여러 이미지 업로드 시 placeholder가 동일하여 교체 충돌 가능 (단일 업로드만 지원)
- 이미지 리사이징/압축 미지원
- 업로드된 이미지 삭제/관리 UI 없음
