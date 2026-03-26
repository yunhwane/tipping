"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { MarkdownEditor } from "~/components/markdown-editor";

interface ProjectFormProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    title: string;
    description: string;
    url: string | null;
    imageUrl: string | null;
    tags: { name: string }[];
  };
}

export function ProjectForm({ mode, initialData }: ProjectFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [url, setUrl] = useState(initialData?.url ?? "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? "");
  const [tagInput, setTagInput] = useState(
    initialData?.tags.map((t) => t.name).join(", ") ?? "",
  );

  const [submitted, setSubmitted] = useState(false);

  const createProject = api.project.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const updateProject = api.project.update.useMutation({
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

    const data = {
      title,
      description,
      url: url || undefined,
      imageUrl: imageUrl || undefined,
      tagNames,
    };

    if (mode === "create") {
      createProject.mutate(data);
    } else if (initialData) {
      updateProject.mutate({ id: initialData.id, ...data });
    }
  };

  const isPending = createProject.isPending || updateProject.isPending;

  if (submitted) {
    return (
      <div className="rounded-lg border bg-muted/50 p-8 text-center space-y-3">
        <p className="text-lg font-semibold">
          {mode === "create"
            ? "프로젝트가 등록되었습니다!"
            : "프로젝트가 수정되었습니다!"}
        </p>
        <p className="text-sm text-muted-foreground">
          관리자 검수 후 공개됩니다. 검수 결과는 프로필에서 확인할 수 있습니다.
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" onClick={() => router.push("/profile")}>
            내 프로필
          </Button>
          <Button onClick={() => router.push("/projects")}>프로젝트 목록</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="프로젝트명"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <MarkdownEditor
        value={description}
        onChange={setDescription}
        placeholder="마크다운으로 프로젝트를 설명하세요..."
        label="프로젝트 설명"
        rows={10}
        required
      />

      <Input
        placeholder="프로젝트 URL (GitHub, 배포 URL 등)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        type="url"
      />

      <Input
        placeholder="썸네일 이미지 URL"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        type="url"
      />

      <Input
        placeholder="태그 (콤마로 구분: React, TypeScript)"
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
      />

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
              ? "프로젝트 등록"
              : "수정 완료"}
        </Button>
      </div>
    </form>
  );
}
