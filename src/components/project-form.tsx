"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";

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

  const createProject = api.project.create.useMutation({
    onSuccess: (data) => {
      router.push(`/projects/${data.id}`);
    },
  });

  const updateProject = api.project.update.useMutation({
    onSuccess: (data) => {
      router.push(`/projects/${data.id}`);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="프로젝트명"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <Textarea
        placeholder="프로젝트 설명"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={5}
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
