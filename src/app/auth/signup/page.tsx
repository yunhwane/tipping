"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "~/lib/supabase/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Lightbulb, Loader2, CheckCircle, Mail, Lock, User, AlertCircle, ArrowLeft, Check, X } from "lucide-react";
import { api } from "~/trpc/react";
import { env } from "~/env";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function SignUpPage() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const syncUser = api.auth.syncUser.useMutation();

  const debouncedNickname = useDebounce(nickname.trim(), 500);
  const debouncedEmail = useDebounce(email.trim(), 500);

  const { data: nicknameCheck, isFetching: nicknameChecking } =
    api.auth.checkNickname.useQuery(
      { nickname: debouncedNickname },
      { enabled: debouncedNickname.length >= 2 },
    );

  const { data: emailCheck, isFetching: emailChecking } =
    api.auth.checkEmail.useQuery(
      { email: debouncedEmail },
      { enabled: debouncedEmail.includes("@") && debouncedEmail.includes(".") },
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (nicknameCheck && !nicknameCheck.available) {
      setError("이미 사용 중인 닉네임입니다.");
      return;
    }
    if (emailCheck && !emailCheck.available) {
      setError("이미 가입된 이메일입니다.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nickname },
          emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      });
      if (signUpError) { setError(signUpError.message); return; }
      if (data.user) {
        await syncUser.mutateAsync({ id: data.user.id, email, nickname });
      }
      setSuccess(true);
    } catch {
      setError("회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-[400px] text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">인증 메일을 보냈습니다</h2>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">{email}</span>으로 인증 메일을 발송했습니다.<br />메일함을 확인하고 인증 링크를 클릭해주세요.
          </p>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4" /><span>메일이 도착하지 않았나요?</span></div>
            <ul className="space-y-1.5 text-left text-xs text-muted-foreground">
              <li>- 스팸 폴더를 확인해보세요</li><li>- 이메일 주소가 정확한지 확인해보세요</li><li>- 몇 분 후 다시 시도해보세요</li>
            </ul>
          </div>
          <Link href="/auth/signin" className="mt-6 inline-block">
            <Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />로그인 페이지로 이동</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
            <Lightbulb className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">회원가입</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Tipping에 가입하고 개발 팁을 공유하세요</p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="nickname" className="text-sm font-medium">닉네임</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="nickname"
                  type="text"
                  placeholder="2~20자 닉네임"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                  minLength={2}
                  maxLength={20}
                  className="h-10 pl-9 pr-9"
                />
                {debouncedNickname.length >= 2 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {nicknameChecking ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : nicknameCheck?.available ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {debouncedNickname.length >= 2 && !nicknameChecking && nicknameCheck && !nicknameCheck.available && (
                <p className="text-xs text-red-500">이미 사용 중인 닉네임입니다</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">이메일</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 pl-9 pr-9"
                />
                {debouncedEmail.includes("@") && debouncedEmail.includes(".") && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {emailChecking ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : emailCheck?.available ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {debouncedEmail.includes("@") && !emailChecking && emailCheck && !emailCheck.available && (
                <p className="text-xs text-red-500">이미 가입된 이메일입니다</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">비밀번호</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" placeholder="영문 + 숫자 포함 8자 이상" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="h-10 pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="passwordConfirm" className="text-sm font-medium">비밀번호 확인</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="passwordConfirm" type="password" placeholder="비밀번호 재입력" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required minLength={8} className="h-10 pl-9" />
              </div>
            </div>
            <Button
              type="submit"
              className="h-10 w-full bg-amber-500 font-semibold text-white hover:bg-amber-600"
              disabled={loading || (nicknameCheck !== undefined && !nicknameCheck.available) || (emailCheck !== undefined && !emailCheck.available)}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}회원가입
            </Button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{" "}
          <Link href="/auth/signin" className="font-semibold text-amber-600 hover:text-amber-500 hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}
