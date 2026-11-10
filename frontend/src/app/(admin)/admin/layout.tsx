"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  Users,
  Flag,
  FileText,
  Activity,
  ArrowLeft,
  Lock,
  UserCheck,
  MessageSquare,
  MessageCircle,
  Layers,
  Image as ImageIcon,
  BarChart3,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=" + encodeURIComponent(pathname));
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-medinex-light flex flex-col items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-medinex-teal border-t-transparent rounded-full mb-3" />
        <p className="text-xs text-medinex-muted font-medium uppercase tracking-wider">
          Verifying privileged credentials...
        </p>
      </div>
    );
  }

  const isAdmin = user?.roles?.some(
    (role) => role === "ROLE_ADMIN" || role === "ROLE_SUPER_ADMIN"
  );

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-medinex-light flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-red-200 text-center shadow-sm">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-medinex-text">Access Restricted</h2>
          <p className="text-sm text-medinex-muted mt-2 leading-relaxed">
            The MediNex Administrative & Moderation Console requires verified{" "}
            <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-medinex-teal">
              ROLE_ADMIN
            </code>{" "}
            or{" "}
            <code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-medinex-teal">
              ROLE_SUPER_ADMIN
            </code>{" "}
            privileges.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/dashboard">
              <Button variant="primary" className="w-full">
                Return to Personal Dashboard
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Public Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navLinks = [
    {
      name: "Overview",
      href: "/admin",
      icon: Activity,
      exact: true,
    },
    {
      name: "Innovator Accounts",
      href: "/admin/users",
      icon: Users,
      exact: false,
    },
    {
      name: "Team Contributors",
      href: "/admin/team",
      icon: UserCheck,
      exact: false,
    },
    {
      name: "Post Moderation",
      href: "/admin/posts",
      icon: MessageSquare,
      exact: false,
    },
    {
      name: "Comment Moderation",
      href: "/admin/comments",
      icon: MessageCircle,
      exact: false,
    },
    {
      name: "Project Governance",
      href: "/admin/projects",
      icon: Layers,
      exact: false,
    },
    {
      name: "Media Review",
      href: "/admin/media",
      icon: ImageIcon,
      exact: false,
    },
    {
      name: "Moderation Queue",
      href: "/admin/reports",
      icon: Flag,
      exact: false,
    },
    {
      name: "Detailed Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      exact: false,
    },
    {
      name: "Audit Trail",
      href: "/admin/audit-logs",
      icon: FileText,
      exact: false,
    },
    {
      name: "Site Settings",
      href: "/admin/settings",
      icon: Settings,
      exact: false,
    },
  ];

  return (
    <div className="min-h-screen bg-medinex-light flex flex-col">
      {/* Top Banner */}
      <header className="bg-medinex-dark text-white border-b border-emerald-950 px-4 sm:px-8 py-3.5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-medinex-mint">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight">MediNex Admin Console</span>
                <Badge variant="mint" className="text-[10px] py-0 px-1.5">
                  Privileged
                </Badge>
              </div>
              <p className="text-[11px] text-emerald-400/80 hidden sm:block">
                Authoritative platform administration & moderation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-200">{user.fullName || user.username}</span>
              <span className="text-[10px] text-emerald-400">
                {user.roles.includes("ROLE_SUPER_ADMIN") ? "Super Administrator" : "Administrator"}
              </span>
            </div>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-xs text-slate-300 hover:text-white">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Exit to User App
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Admin Content with Sidebar */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <nav className="bg-white rounded-2xl border border-medinex-border p-3 space-y-1 shadow-sm">
            <div className="px-3 py-2 text-[11px] font-bold text-medinex-muted uppercase tracking-wider">
              Console Modules
            </div>
            {navLinks.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-medinex-teal text-white shadow-sm shadow-teal-700/20"
                      : "text-slate-600 hover:bg-emerald-50 hover:text-medinex-teal"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 p-4 rounded-2xl bg-emerald-950/5 border border-emerald-900/10 text-[11px] text-slate-600">
            <div className="font-semibold text-medinex-text mb-1">Audit Guarantee</div>
            All actions executed in this console (role updates, status shifts, content moderation) are recorded to the immutable database audit trail.
          </div>
        </aside>

        {/* Dynamic Admin View */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
