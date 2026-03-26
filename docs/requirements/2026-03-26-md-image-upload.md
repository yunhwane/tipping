# 마크다운 에디터 이미지 업로드

## 배경

현재 `MarkdownEditor` 컴포넌트는 텍스트 편집만 지원하며, 이미지를 삽입하려면 외부 URL을 수동으로 마크다운 문법으로 입력해야 합니다. Tip과 Project 작성 시 이미지를 쉽게 첨부할 수 있도록 업로드 기능이 필요합니다.

## 요구사항

### 이미지 업로드 방식 (3가지)
1. **드래그 앤 드롭** — 에디터 textarea에 이미지를 끌어다 놓으면 업로드
2. **클립보드 붙여넣기** — Cmd+V / Ctrl+V로 이미지 붙여넣기
3. **파일 선택 버튼** — 툴바에 이미지 아이콘 버튼 추가, 클릭하면 파일 선택 다이얼로그

### 업로드 동작
- 이미지 파일을 Supabase Storage에 업로드
- Tip 작성 시 → `tips` 버킷, Project 작성 시 → `projects` 버킷
- 업로드 완료 후 커서 위치에 `![image](public_url)` 마크다운 자동 삽입
- 업로드 중 "업로드 중..." 텍스트 표시 후 완료 시 URL로 교체
- 허용 파일 형식: image/jpeg, image/png, image/gif, image/webp
- 최대 파일 크기: 5MB

## 범위

### 포함
- `MarkdownEditor` 컴포넌트에 이미지 업로드 기능 추가
- 드래그 앤 드롭, 붙여넣기, 파일 선택 버튼 3가지 방식
- 업로드 상태 표시 (로딩)

### 제외
- 이미지 리사이징/편집
- 이미지 갤러리/관리 UI
- 기존 Supabase Storage 설정 변경

## 기술 접근

### 수정 대상 파일
1. `src/components/markdown-editor.tsx` — 핵심 변경
   - props에 `bucket` 추가 (tips | projects)
   - 툴바에 이미지 버튼 추가 (ImagePlus 아이콘)
   - textarea에 onDrop, onPaste 이벤트 핸들러 추가
   - 숨겨진 `<input type="file">` 추가
   - 업로드 로직: 기존 `uploadImage()` 유틸리티 활용

2. `src/components/tip-form.tsx` — `bucket="tips"` prop 전달
3. `src/components/project-form.tsx` — `bucket="projects"` prop 전달

### 업로드 플로우
```
파일 선택/드롭/붙여넣기
  → 파일 유효성 검증 (타입, 크기)
  → 커서 위치에 "![업로드 중...]()" 삽입
  → uploadImage(bucket, userId, file) 호출
  → 성공 시 placeholder를 실제 URL로 교체
  → 실패 시 placeholder 제거 + toast 알림
```

### 인증
- `useSession()`으로 userId 획득
- 비로그인 상태에서는 업로드 버튼 비활성화 (실제로 폼 자체가 로그인 필수)
