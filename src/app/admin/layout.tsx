"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";
import {
  LayoutDashboard,
  ClipboardCheck,
  Lightbulb,
  FolderKanban,
  Users,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/reviews", label: "검수 대기", icon: ClipboardCheck },
  { href: "/admin/tips", label: "팁 관리", icon: Lightbulb },
  { href: "/admin/projects", label: "프로젝트 관리", icon: FolderKanban },
  { href: "/admin/users", label: "유저 관리", icon: Users },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-60 shrink-0 border-r bg-muted/30">
        <nav className="sticky top-16 space-y-1 p-4">
          <h2 className="mb-4 px-2 text-lg font-semibold">관리자</h2>
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
