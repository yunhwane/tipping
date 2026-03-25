"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { CheckCircle2, Tag, FolderOpen, Type, FileText } from "lucide-react";

interface TipFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    title: string;
    content: string;
    categoryId: string;
    tags: { name: string }[];
  };
}

export function TipForm({ mode, initialData }: TipFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [categoryId, setCategoryId] = useState(
    initialData?.categoryId ?? "",
  );
  const [topCategoryId, setTopCategoryId] = useState("");
  const [tagInput, setTagInput] = useState(
    initialData?.tags.map((t) => t.name).join(", ") ?? "",
  );

  const { data: topCategories } = api.category.getTopCategories.useQuery();

  // 편집 모드: initialData의 categoryId로 topCategoryId 자동 설정
  const resolvedTopCategoryId =
    topCategoryId ||
    (initialData?.categoryId
      ? topCategories?.find((tc) =>
          tc.categories.some((c) => c.id === initialData.categoryId),
        )?.id ?? ""
      : "");

  const activeTopCategory = topCategories?.find(
    (tc) => tc.id === resolvedTopCategoryId,
  );

  const [submitted, setSubmitted] = useState(false);

  const createTip = api.tip.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const updateTip = api.tip.update.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagNames = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (mode === "create") {
      createTip.mutate({ title, content, categoryId, tagNames });
    } else if (initialData) {
      updateTip.mutate({
        id: initialData.id,
        title,
        content,
        categoryId,
        tagNames,
      });
    }
  };

  const isPending = createTip.isPending || updateTip.isPending;

  if (submitted) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center shadow-lg shadow-primary/5 space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <p className="text-xl font-semibold">
          {mode === "create" ? "팁이 등록되었습니다!" : "팁이 수정되었습니다!"}
        </p>
        <p className="text-sm text-muted-foreground">
          관리자 검수 후 공개됩니다. 검수 결과는 프로필에서 확인할 수 있습니다.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button variant="outline" onClick={() => router.push("/profile")}>
            내 프로필
          </Button>
          <Button onClick={() => router.push("/tips")}>팁 목록</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 제목 */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm shadow-black/5 space-y-4">
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Type className="h-3.5 w-3.5" />
            제목
          </label>
          <Input
            placeholder="어떤 팁을 공유하시나요?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-10 text-base font-medium"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <FolderOpen className="h-3.5 w-3.5" />
              분야
            </label>
            <select
              value={resolvedTopCategoryId}
              onChange={(e) => {
                setTopCategoryId(e.target.value);
                setCategoryId("");
              }}
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              required
            >
              <option value="">분야 선택</option>
              {topCategories?.map((tc) => (
                <option key={tc.id} value={tc.id}>
                  {tc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <FolderOpen className="h-3.5 w-3.5" />
              카테고리
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              required
              disabled={!resolvedTopCategoryId}
            >
              <option value="">카테고리 선택</option>
              {activeTopCategory?.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Tag className="h-3.5 w-3.5" />
              태그
            </label>
            <Input
              placeholder="React, TypeScript, Next.js"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="h-10"
            />
          </div>
        </div>
      </div>

      {/* 에디터 */}
      <div className="rounded-2xl border bg-card shadow-sm shadow-black/5 overflow-hidden">
        <Tabs defaultValue="write">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              내용
            </label>
            <TabsList>
              <TabsTrigger value="write">작성</TabsTrigger>
              <TabsTrigger value="preview">미리보기</TabsTrigger>
            </TabsList>
          </div>
          <div className="p-5">
            <TabsContent value="write" className="mt-0">
              <Textarea
                placeholder="마크다운으로 팁을 작성하세요..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={18}
                className="font-mono text-sm border-0 shadow-none focus-visible:ring-0 p-0 resize-none"
                required
              />
            </TabsContent>
            <TabsContent value="preview" className="mt-0">
              <div className="prose prose-sm min-h-[400px] max-w-none rounded-lg border border-dashed p-5 dark:prose-invert">
                {content || (
                  <span className="text-muted-foreground">
                    미리보기할 내용이 없습니다
                  </span>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* 하단 액션 */}
      <div className="flex items-center justify-between rounded-2xl border bg-card px-5 py-4 shadow-sm shadow-black/5">
        <p className="text-xs text-muted-foreground">
          {mode === "edit"
            ? "수정 시 관리자 재검수가 필요합니다."
            : "작성 후 관리자 검수를 거쳐 공개됩니다."}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            취소
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "저장 중..."
              : mode === "create"
                ? "팁 작성"
                : "수정 완료"}
          </Button>
        </div>
      </div>
    </form>
  );
}
