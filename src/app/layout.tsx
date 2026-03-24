import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { Providers } from "~/components/providers";
import { Header } from "~/components/header";

export const metadata: Metadata = {
  title: "Tipping — IT/개발 팁 공유 커뮤니티",
  description: "한국 개발자를 위한 카테고리별 IT/개발 팁 공유 플랫폼",
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${geist.variable}`}>
      <body>
        <TRPCReactProvider>
          <Providers>
            <Header />
            <main className="container mx-auto px-4 py-8">{children}</main>
          </Providers>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
