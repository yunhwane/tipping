"use client";

import { useState } from "react";
import { createClient } from "~/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Lightbulb, Loader2, Mail, Lock, AlertCircle, CheckCircle, Send } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResend = async () => {
    setResending(true);
    setResendSuccess(false);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) {
        setError("인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
      } else {
        setResendSuccess(true);
        setError("");
      }
    } catch {
      setError("인증 메일 발송 중 오류가 발생했습니다.");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailNotConfirmed(false);
    setResendSuccess(false);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setError("이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.");
          setEmailNotConfirmed(true);
        } else {
          setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20">
            <Lightbulb className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">다시 오신 걸 환영합니다</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Tipping에 로그인하고 팁을 공유하세요</p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {resendSuccess && (
              <div className="flex items-start gap-2.5 rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-950/30 dark:text-green-400">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>인증 메일을 재발송했습니다. 메일함을 확인해주세요.</span>
              </div>
            )}
            {error && (
              <div className="space-y-2">
                <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
                {emailNotConfirmed && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950/30"
                    onClick={handleResend}
                    disabled={resending}
                  >
                    {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    인증 메일 재발송
                  </Button>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">이메일</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10 pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">비밀번호</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" placeholder="비밀번호 입력" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-10 pl-9" />
              </div>
            </div>
            <Button type="submit" className="h-10 w-full bg-amber-500 font-semibold text-white hover:bg-amber-600" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              로그인
            </Button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          계정이 없으신가요?{" "}
          <Link href="/auth/signup" className="font-semibold text-amber-600 hover:text-amber-500 hover:underline">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
