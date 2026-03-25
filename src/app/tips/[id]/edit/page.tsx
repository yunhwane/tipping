"use client";

import { useParams } from "next/navigation";
import { useAuth } from "~/hooks/use-auth";
import { redirect } from "next/navigation";
import { api } from "~/trpc/react";
import { TipForm } from "~/components/tip-form";

export default function EditTipPage() {
  const params = useParams<{ id: string }>();
  const { user: session, status } = useAuth();
  const { data: tip } = api.tip.getById.useQuery({ id: params.id });

  if (status === "loading" || !tip) return null;
  if (!session) redirect("/auth/signin");
  if (tip.author.id !== session.id) redirect(`/tips/${params.id}`);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold">팁 수정</h1>
      <TipForm
        mode="edit"
        initialData={{
          id: tip.id,
          title: tip.title,
          content: tip.content,
          categoryId: tip.categoryId,
          tags: tip.tags,
        }}
      />
    </div>
  );
}
