"use client";

import { useState, useEffect } from "react";
import { useAuth } from "~/hooks/use-auth";
import { api } from "~/trpc/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";
import {
  Check,
  Camera,
  CircleAlert,
  Trash2,
  Plus,
} from "lucide-react";

const AVATAR_SEEDS = [
  "Felix", "Aneka", "Milo", "Sasha", "Luna", "Orion",
  "Pepper", "Zoe", "Kai", "Nova", "Remy", "Indie",
];

function getAvatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`;
}

/* ── Main Component ── */
export function ProfileSettings({
  onProfileUpdate,
}: {
  onProfileUpdate?: () => void;
}) {
  const { user: _authUser } = useAuth();
  const { data: profile } = api.user.getProfile.useQuery();

  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState<{ label: string; url: string }[]>([]);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Initialize from profile data
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setBio((profile.bio as string) ?? "");
      setLinks(
        Array.isArray(profile.links)
          ? (profile.links as { label: string; url: string }[])
          : [],
      );
      if (profile.image) {
        const matchingSeed = AVATAR_SEEDS.find(
          (seed) => getAvatarUrl(seed) === profile.image,
        );
        if (matchingSeed) {
          setSelectedAvatar(profile.image);
        }
      }
    }
  }, [profile]);

  const utils = api.useUtils();

  const updateProfile = api.user.updateProfile.useMutation({
    onSuccess: async () => {
      setProfileMessage({ type: "success", text: "프로필이 저장되었습니다" });
      await utils.user.getProfile.invalidate();
      onProfileUpdate?.();
      setTimeout(() => setProfileMessage(null), 3000);
    },
    onError: (error) => {
      setProfileMessage({ type: "error", text: error.message });
    },
  });

  const handleProfileSave = () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 20) {
      setProfileMessage({
        type: "error",
        text: "닉네임은 2~20자여야 합니다",
      });
      return;
    }

    updateProfile.mutate({
      name: trimmedName,
      ...(selectedAvatar ? { image: selectedAvatar } : {}),
      bio: bio,
      links: links.filter((l) => l.label.trim() && l.url.trim()),
    });
  };

  const currentImage = selectedAvatar ?? profile?.image;
  const hasProfileChanges =
    name.trim() !== (profile?.name ?? "") ||
    (selectedAvatar !== null && selectedAvatar !== profile?.image) ||
    bio !== ((profile?.bio as string) ?? "") ||
    JSON.stringify(links) !==
      JSON.stringify(
        Array.isArray(profile?.links) ? profile.links : [],
      );

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* ── Profile Section ── */}
      <section className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md">
        <div className="border-b bg-muted/30 px-5 py-3">
          <h2 className="text-sm font-semibold">프로필 수정</h2>
        </div>

        <div className="space-y-5 p-5">
          {/* Current Avatar - Large Preview */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-2 ring-amber-500/20 ring-offset-2 ring-offset-background transition-transform hover:scale-105">
                <AvatarImage src={currentImage ?? ""} alt={name} />
                <AvatarFallback className="bg-amber-100 text-2xl text-amber-700">
                  {name.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm ring-2 ring-background">
                <Camera className="h-3 w-3" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              아바타를 선택해주세요
            </p>
          </div>

          {/* Avatar Grid */}
          <div className="grid grid-cols-6 gap-3">
            {AVATAR_SEEDS.map((seed) => {
              const url = getAvatarUrl(seed);
              const isSelected = selectedAvatar === url;
              const isCurrent = !selectedAvatar && profile?.image === url;
              return (
                <button
                  key={seed}
                  type="button"
                  onClick={() => setSelectedAvatar(url)}
                  className={cn(
                    "group relative flex items-center justify-center rounded-full p-1 transition-all duration-200",
                    isSelected || isCurrent
                      ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-background"
                      : "hover:ring-2 hover:ring-foreground/20 hover:ring-offset-2 hover:ring-offset-background",
                  )}
                >
                  <Avatar
                    className={cn(
                      "h-10 w-10 transition-transform duration-200 sm:h-11 sm:w-11",
                      !(isSelected || isCurrent) && "group-hover:scale-110",
                    )}
                  >
                    <AvatarImage src={url} alt={seed} />
                    <AvatarFallback>{seed.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {(isSelected || isCurrent) && (
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <Separator />

          {/* Nickname */}
          <div className="space-y-3">
            <label htmlFor="nickname" className="text-sm font-medium">
              닉네임
            </label>
            <Input
              id="nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="닉네임을 입력하세요"
              maxLength={20}
            />
            <div className="flex items-center justify-between pt-0.5">
              <p className="text-xs text-muted-foreground">2~20자</p>
              <p
                className={cn(
                  "text-xs transition-colors",
                  name.trim().length > 0 && name.trim().length < 2
                    ? "text-red-500"
                    : "text-muted-foreground",
                )}
              >
                {name.trim().length}/20
              </p>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-3">
            <label htmlFor="bio" className="text-sm font-medium">
              한줄 소개
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="나를 한 줄로 소개해주세요"
              maxLength={100}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <div className="flex justify-end">
              <p
                className={cn(
                  "text-xs transition-colors",
                  bio.length > 90
                    ? "text-amber-500"
                    : "text-muted-foreground",
                )}
              >
                {bio.length}/100
              </p>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <label className="text-sm font-medium">소셜 링크</label>
            <div className="space-y-2">
              {links.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={link.label}
                    onChange={(e) => {
                      const newLinks = [...links];
                      newLinks[index] = { ...link, label: e.target.value };
                      setLinks(newLinks);
                    }}
                    placeholder="라벨 (예: 블로그)"
                    maxLength={20}
                    className="w-28 shrink-0"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...links];
                      newLinks[index] = { ...link, url: e.target.value };
                      setLinks(newLinks);
                    }}
                    placeholder="https://..."
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setLinks(links.filter((_, i) => i !== index))}
                    className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {links.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLinks([...links, { label: "", url: "" }])}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                링크 추가
              </Button>
            )}
            {links.length > 0 && (
              <p className="text-xs text-muted-foreground">
                최대 5개까지 추가할 수 있습니다 ({links.length}/5)
              </p>
            )}
          </div>

          <Separator />

          {/* Profile Message */}
          {profileMessage && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all",
                profileMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "bg-red-50 text-destructive dark:bg-red-950/30",
              )}
            >
              {profileMessage.type === "success" ? (
                <Check className="h-4 w-4 shrink-0" />
              ) : (
                <CircleAlert className="h-4 w-4 shrink-0" />
              )}
              {profileMessage.text}
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={handleProfileSave}
            disabled={updateProfile.isPending || !hasProfileChanges}
            className={cn(
              "w-full transition-all duration-200",
              hasProfileChanges && !updateProfile.isPending
                ? "bg-amber-500 shadow-sm hover:bg-amber-600 hover:shadow-md"
                : "",
            )}
          >
            {updateProfile.isPending ? (
              "저장 중..."
            ) : profileMessage?.type === "success" ? (
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4" /> 저장 완료
              </span>
            ) : (
              "프로필 저장"
            )}
          </Button>
        </div>
      </section>

    </div>
  );
}
