"use client";

import { useAuth } from "~/hooks/use-auth";
import { redirect } from "next/navigation";
import { ProjectForm } from "~/components/project-form";

export default function NewProjectPage() {
  const { user: session, status } = useAuth();

  if (status === "loading") return null;
  if (!session) redirect("/auth/signin");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold">프로젝트 등록</h1>
      <ProjectForm mode="create" />
    </div>
  );
}
