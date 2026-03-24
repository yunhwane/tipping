"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { TipForm } from "~/components/tip-form";
import { Lightbulb, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewTipPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;
  if (!session) redirect("/api/auth/signin");

  return (
    <div className="mx-auto max-w-3xl py-4">
      <Link
        href="/tips"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        팁 목록
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">새 팁 작성</h1>
          <p className="text-sm text-muted-foreground">
            개발 노하우를 공유해 보세요
          </p>
        </div>
      </div>

      <TipForm mode="create" />
    </div>
  );
}
