"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { api } from "~/trpc/react";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const calledRef = useRef(false);

  const verify = api.auth.verifyEmail.useMutation();

  useEffect(() => {
    if (token && !calledRef.current) {
      calledRef.current = true;
      verify.mutate({ token });
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-[400px] text-center">
        {/* 토큰 없음 */}
        {!token && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">잘못된 접근입니다</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              인증 링크가 올바르지 않습니다.
            </p>
            <Link href="/auth/signin">
              <Button variant="outline" className="gap-2">
                로그인 페이지로 이동
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </>
        )}

        {/* 인증 중 */}
        {token && verify.isPending && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold">이메일 인증 중...</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              잠시만 기다려주세요
            </p>
          </>
        )}

        {/* 인증 실패 */}
        {token && verify.isError && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">인증 실패</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {verify.error.message}
            </p>
            <Link href="/auth/signin">
              <Button variant="outline" className="gap-2">
                로그인 페이지로 이동
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </>
        )}

        {/* 인증 성공 */}
        {token && verify.isSuccess && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">인증 완료!</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              이메일 인증이 완료되었습니다. 이제 로그인할 수 있습니다.
            </p>
            <Link href="/auth/signin">
              <Button className="gap-2 bg-amber-500 text-white hover:bg-amber-600">
                로그인하기
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
