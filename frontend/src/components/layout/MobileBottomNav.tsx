"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FolderKanban, MessageSquare, Users, LayoutDashboard, LogIn } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/lib/auth-context";
import { UserAvatar } from "@/components/ui/UserAvatar";

const PUBLIC_TABS = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/projects", label: "Projects", icon: FolderKanban, exact: false },
  { href: "/community", label: "Feed", icon: MessageSquare, exact: false },
  { href: "/team", label: "Team", icon: Users, exact: false },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  // Admin console has its own top module bar; keep focused chrome there
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const isAccountActive =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/users/") ||
    pathname === "/login" ||
    pathname === "/register";

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-medinex-border shadow-[0_-10px_30px_rgba(7,26,24,0.08)] pb-safe"
    >
      <div className="grid grid-cols-5 items-center h-16 px-1.5">
        {PUBLIC_TABS.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : Boolean(pathname?.startsWith(tab.href));
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                "relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all active:scale-95",
                isActive
                  ? "text-medinex-teal font-semibold"
                  : "text-slate-500 hover:text-medinex-teal"
              )}
            >
              {isActive && (
                <span className="absolute top-0.5 w-6 h-1 rounded-full bg-medinex-teal" />
              )}
              <span
                className={clsx(
                  "p-1 rounded-lg transition-colors",
                  isActive ? "bg-medinex-teal/10" : ""
                )}
              >
                <Icon className="w-[18px] h-[18px]" />
              </span>
              <span className="text-[10px] leading-none tracking-tight">{tab.label}</span>
            </Link>
          );
        })}

        {isAuthenticated && user ? (
          <Link
            href="/dashboard"
            className={clsx(
              "relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all active:scale-95",
              isAccountActive
                ? "text-medinex-teal font-semibold"
                : "text-slate-500 hover:text-medinex-teal"
            )}
          >
            {isAccountActive && (
              <span className="absolute top-0.5 w-6 h-1 rounded-full bg-medinex-teal" />
            )}
            <UserAvatar
              src={user.avatarUrl}
              smSrc={user.avatarSmUrl}
              fullName={user.fullName}
              username={user.username}
              size="xs"
              className={clsx(
                "ring-2",
                isAccountActive ? "ring-medinex-teal" : "ring-transparent"
              )}
            />
            <span className="text-[10px] leading-none tracking-tight truncate max-w-[56px]">
              Hub
            </span>
          </Link>
        ) : (
          <Link
            href="/login"
            aria-label="Portal account access"
            className={clsx(
              "relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all active:scale-95",
              isAccountActive
                ? "text-medinex-teal font-semibold"
                : "text-slate-500 hover:text-medinex-teal"
            )}
          >
            {isAccountActive && (
              <span className="absolute top-0.5 w-6 h-1 rounded-full bg-medinex-teal" />
            )}
            <span
              className={clsx(
                "p-1 rounded-lg transition-colors",
                isAccountActive ? "bg-medinex-teal/10" : ""
              )}
            >
              {isAccountActive ? (
                <LayoutDashboard className="w-[18px] h-[18px]" />
              ) : (
                <LogIn className="w-[18px] h-[18px]" />
              )}
            </span>
            <span className="text-[10px] leading-none tracking-tight">Portal</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
