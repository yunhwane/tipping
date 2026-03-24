"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProfileSettings } from "~/components/profile-settings";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ProfileSettingsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;
  if (!session) redirect("/api/auth/signin");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">설정</h1>
      </div>

      <ProfileSettings />
    </div>
  );
}
