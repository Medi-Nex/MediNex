"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Activity, ChevronRight, ShieldCheck, ShieldAlert, LogOut, LayoutDashboard, Bell, Users, Settings } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { getUnreadNotificationCount } from "@/lib/api/notifications";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/team", label: "Team" },
  { href: "/projects", label: "Projects" },
  { href: "/community", label: "Community" },
  { href: "/updates", label: "Updates" },
  { href: "/events", label: "Events" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      getUnreadNotificationCount()
        .then(setUnreadNotifications)
        .catch(() => {});
    }
  }, [isAuthenticated, pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll and close drawer on Escape
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <header
        className={clsx(
          "sticky top-0 z-40 transition-all duration-200 border-b text-medinex-text",
          scrolled
            ? "bg-white/95 backdrop-blur-lg shadow-sm border-slate-200/90"
            : "bg-white/95 backdrop-blur-md border-medinex-border"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0 focus:outline-none focus:ring-2 focus:ring-medinex-teal rounded-lg p-1"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-medinex-teal to-medinex-deep flex items-center justify-center text-white shadow-md">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-medinex-mint" />
              </div>
              <div>
                <span className="font-bold text-lg sm:text-xl tracking-tight text-medinex-text">
                  Medi<span className="text-medinex-teal">Nex</span>
                </span>
                <span className="hidden xl:block text-[10px] tracking-wider uppercase text-medinex-muted -mt-1 font-semibold whitespace-nowrap">
                  Health Tech Platform
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-0.5 shrink-0" aria-label="Main Navigation">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={clsx(
                      "px-1.5 xl:px-2 py-1.5 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "text-medinex-teal bg-medinex-teal/10 font-semibold"
                        : "text-slate-700 hover:text-medinex-teal hover:bg-slate-100/80"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Action Buttons / Auth State */}
            <div className="hidden md:flex items-center gap-1 xl:gap-1.5 shrink-0">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-1 xl:gap-1.5">
                  <Link
                    href="/dashboard/notifications"
                    className="relative p-1.5 rounded-lg text-slate-600 hover:text-medinex-teal hover:bg-slate-100 transition-colors"
                    title="Notifications"
                    aria-label="View notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-medinex-teal ring-2 ring-white" />
                    )}
                  </Link>

                  <Link
                    href="/dashboard/following"
                    className="p-1.5 rounded-lg text-slate-600 hover:text-medinex-teal hover:bg-slate-100 transition-colors"
                    title="Following Network"
                    aria-label="View following network"
                  >
                    <Users className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/dashboard/settings"
                    className="p-1.5 rounded-lg text-slate-600 hover:text-medinex-teal hover:bg-slate-100 transition-colors"
                    title="Account & Privacy Settings"
                    aria-label="View settings"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>

                  {user.roles?.some((r) => r === "ROLE_ADMIN" || r === "ROLE_SUPER_ADMIN" || r === "ROLE_MODERATOR") && (
                    <Link href="/admin">
                      <Button variant="primary" size="sm" className="inline-flex items-center gap-1 text-xs !px-2.5 !min-h-[34px] whitespace-nowrap">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>
                          {user.roles.some((r) => r === "ROLE_ADMIN" || r === "ROLE_SUPER_ADMIN") ? "Admin" : "Moderation"}
                        </span>
                      </Button>
                    </Link>
                  )}

                  <Link
                    href={`/users/${encodeURIComponent(user.username)}`}
                    className="inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full border border-medinex-border bg-slate-50 text-medinex-text hover:border-medinex-teal/60 hover:bg-slate-100/70 transition-colors shrink-0"
                    title={`View @${user.username} public profile`}
                    aria-label={`View @${user.username} public profile`}
                  >
                    <UserAvatar
                      src={user.avatarUrl}
                      smSrc={user.avatarSmUrl}
                      fullName={user.fullName}
                      username={user.username}
                      size="sm"
                      className="border-0 shadow-none"
                    />
                    <span className="text-xs font-semibold max-w-[78px] truncate">
                      {user.username}
                    </span>
                  </Link>

                  <Link href="/dashboard">
                    <Button variant="outline" size="sm" className="inline-flex items-center gap-1.5 !px-2.5 !min-h-[34px] whitespace-nowrap">
                      <LayoutDashboard className="w-3.5 h-3.5 text-medinex-teal" />
                      <span>Dashboard</span>
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => logout()}
                    className="inline-flex items-center gap-1.5 !px-2.5 !min-h-[34px] whitespace-nowrap text-slate-700 hover:text-medinex-text hover:bg-slate-100"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="primary" size="sm">
                      Join Community
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Quick Controls & Menu Button */}
            <div className="flex md:hidden items-center gap-1.5">
              {isAuthenticated && user ? (
                <>
                  <Link
                    href="/dashboard/notifications"
                    className="relative min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-600 hover:text-medinex-teal hover:bg-slate-100 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-medinex-teal ring-2 ring-white" />
                    )}
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-full p-0.5 border border-medinex-border bg-slate-50 transition-colors"
                    aria-label="Open Dashboard"
                  >
                    <UserAvatar
                      src={user.avatarUrl}
                      smSrc={user.avatarSmUrl}
                      fullName={user.fullName}
                      username={user.username}
                      size="sm"
                      className="border-0 shadow-none"
                    />
                  </Link>
                </>
              ) : (
                <Link
                  href="/register"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-medinex-teal text-white hover:bg-medinex-teal-hover transition-colors"
                >
                  Join
                </Link>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 bg-slate-50 border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-medinex-teal transition-colors"
                aria-label={isOpen ? "Close main menu" : "Open main menu"}
                aria-expanded={isOpen}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-Over Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-medinex-dark/65 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <aside
            aria-label="Mobile Navigation Drawer"
            className="fixed inset-y-0 right-0 w-[86vw] max-w-sm bg-white text-medinex-text shadow-2xl border-l border-medinex-border flex flex-col justify-between overflow-y-auto pb-safe"
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-4 h-16 border-b border-medinex-border/80 bg-medinex-light/60">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-medinex-teal to-medinex-deep flex items-center justify-center text-white shadow-sm">
                    <Activity className="w-4 h-4 text-medinex-mint" />
                  </div>
                  <span className="font-bold text-lg tracking-tight text-medinex-text">
                    Medi<span className="text-medinex-teal">Nex</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Close main menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-teal-900 bg-teal-50/80 border border-teal-200/70 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-medinex-teal shrink-0" />
                  <span className="font-medium">Zero-PHI Community Infrastructure</span>
                </div>

                {isAuthenticated && user && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <Link
                      href={`/users/${encodeURIComponent(user.username)}`}
                      className="flex items-center gap-3"
                    >
                      <UserAvatar
                        src={user.avatarUrl}
                        smSrc={user.avatarSmUrl}
                        fullName={user.fullName}
                        username={user.username}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.fullName}</p>
                        <p className="text-xs font-mono text-medinex-teal truncate">@{user.username}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </Link>

                    <div className="grid grid-cols-3 gap-2">
                      <Link
                        href="/dashboard/notifications"
                        className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:border-medinex-teal/50"
                      >
                        <Bell className="w-4 h-4 text-teal-600" />
                        <span>Alerts{unreadNotifications > 0 ? ` (${unreadNotifications})` : ""}</span>
                      </Link>
                      <Link
                        href="/dashboard/following"
                        className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:border-medinex-teal/50"
                      >
                        <Users className="w-4 h-4 text-teal-600" />
                        <span>Network</span>
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:border-medinex-teal/50"
                      >
                        <Settings className="w-4 h-4 text-teal-600" />
                        <span>Settings</span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Navigation List */}
                <div className="space-y-1">
                  {NAV_LINKS.map((link) => {
                    const isActive =
                      pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={clsx(
                          "flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                          isActive
                            ? "bg-medinex-teal/10 text-medinex-teal font-semibold"
                            : "text-slate-700 hover:bg-slate-50 hover:text-medinex-teal"
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={clsx(
                              "w-1.5 h-1.5 rounded-full",
                              isActive ? "bg-medinex-teal" : "bg-slate-300"
                            )}
                          />
                          {link.label}
                        </span>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pinned Drawer Bottom Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-2.5">
              {isAuthenticated && user ? (
                <>
                  {user.roles?.some(
                    (r) => r === "ROLE_ADMIN" || r === "ROLE_SUPER_ADMIN" || r === "ROLE_MODERATOR"
                  ) && (
                    <Link href="/admin" className="w-full block">
                      <Button variant="dark" className="w-full justify-center">
                        <ShieldAlert className="w-4 h-4 mr-1.5 text-medinex-mint" />
                        {user.roles.some((r) => r === "ROLE_ADMIN" || r === "ROLE_SUPER_ADMIN")
                          ? "Admin Console"
                          : "Moderation Console"}
                      </Button>
                    </Link>
                  )}
                  <Link href="/dashboard" className="w-full block">
                    <Button variant="primary" className="w-full">
                      <LayoutDashboard className="w-4 h-4 mr-1.5" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full" onClick={() => logout()}>
                    <LogOut className="w-4 h-4 mr-1.5" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/login" className="w-full">
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" className="w-full">
                    <Button variant="primary" className="w-full">
                      Join Community
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
