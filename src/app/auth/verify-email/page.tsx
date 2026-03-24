"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { api } from "~/trpc/react";

export default function VerifyEmailPage() {
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

  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-8 text-center">
            <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="mb-2 text-xl font-bold">잘못된 접근입니다</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              인증 링크가 올바르지 않습니다.
            </p>
            <Link href="/auth/signin">
              <Button variant="outline" className="w-full">
                로그인 페이지로 이동
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verify.isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-8 text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-amber-500" />
            <h2 className="text-xl font-bold">이메일 인증 중...</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verify.isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-8 text-center">
            <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h2 className="mb-2 text-xl font-bold">인증 실패</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {verify.error.message}
            </p>
            <Link href="/auth/signin">
              <Button variant="outline" className="w-full">
                로그인 페이지로 이동
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verify.isSuccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-8 text-center">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <h2 className="mb-2 text-xl font-bold">인증 완료!</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              이메일 인증이 완료되었습니다. 로그인해주세요.
            </p>
            <Link href="/auth/signin">
              <Button className="w-full">로그인</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
