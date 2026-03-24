"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { TipForm } from "~/components/tip-form";

export default function NewTipPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;
  if (!session) redirect("/api/auth/signin");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold">팁 작성</h1>
      <TipForm mode="create" />
    </div>
  );
}
