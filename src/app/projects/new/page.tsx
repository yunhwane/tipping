"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { ProjectForm } from "~/components/project-form";

export default function NewProjectPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;
  if (!session) redirect("/api/auth/signin");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold">프로젝트 등록</h1>
      <ProjectForm mode="create" />
    </div>
  );
}
