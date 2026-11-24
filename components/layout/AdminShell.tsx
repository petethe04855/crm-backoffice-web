"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS, activeNavHref } from "@/components/layout/nav";
import { cn } from "@/lib/utils";
import { hasPermission, useAuthStore } from "@/stores/authStore";

/** Sidebar + top bar. Menu items are filtered by the staff member's permissions. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);
  const items = NAV_ITEMS.filter((i) => hasPermission(session, i.permission));
  const activeHref = activeNavHref(
    pathname,
    items.map((i) => i.href),
  );

  return (
    <div className="h-dvh overflow-hidden flex flex-col lg:flex-row bg-neutral-50">
      <div className="lg:w-60 shrink-0 flex flex-col lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-neutral-200 bg-white">
        <div className="h-[76px] shrink-0 flex flex-col justify-center px-5 border-b border-neutral-200">
          <p className="text-sm font-bold">Chawy CRM</p>
          <p className="text-xs text-neutral-500">ระบบหลังบ้านสมาชิก</p>
        </div>
        <nav className="flex lg:flex-col gap-1 p-3 overflow-x-auto">
          {items.map(({ href, label, icon: Icon }) => {
            const active = href === activeHref;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap",
                  active
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-700 hover:bg-neutral-100",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <header className="h-[76px] shrink-0 flex items-center justify-end gap-3 border-b border-neutral-200 bg-white px-6">
          <div className="text-right">
            <p className="text-sm font-medium">{session?.email}</p>
            <p className="text-xs text-neutral-500">
              {session?.roles.join(", ")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            <LogOut className="h-4 w-4 mr-1" />
            ออกจากระบบ
          </Button>
        </header>
        <main className="flex-1 min-h-0 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
