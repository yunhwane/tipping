"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

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
  const [tagInput, setTagInput] = useState(
    initialData?.tags.map((t) => t.name).join(", ") ?? "",
  );

  const { data: categories } = api.category.getAll.useQuery();

  const createTip = api.tip.create.useMutation({
    onSuccess: (data) => {
      router.push(`/tips/${data.id}`);
    },
  });

  const updateTip = api.tip.update.useMutation({
    onSuccess: (data) => {
      router.push(`/tips/${data.id}`);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="제목을 입력하세요"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        required
      >
        <option value="">카테고리 선택</option>
        {categories?.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      <Input
        placeholder="태그 (콤마로 구분: React, TypeScript, Next.js)"
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
      />

      <Card>
        <Tabs defaultValue="write">
          <CardHeader className="pb-0">
            <TabsList>
              <TabsTrigger value="write">작성</TabsTrigger>
              <TabsTrigger value="preview">미리보기</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-4">
            <TabsContent value="write" className="mt-0">
              <Textarea
                placeholder="마크다운으로 팁을 작성하세요..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={15}
                className="font-mono"
                required
              />
            </TabsContent>
            <TabsContent value="preview" className="mt-0">
              <div className="prose prose-sm min-h-[300px] max-w-none rounded-md border p-4 dark:prose-invert">
                {content || (
                  <span className="text-muted-foreground">
                    미리보기할 내용이 없습니다
                  </span>
                )}
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      <div className="flex justify-end gap-2">
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
    </form>
  );
}
