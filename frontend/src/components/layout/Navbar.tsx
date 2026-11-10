"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Activity, ChevronRight, ShieldCheck, LogOut, LayoutDashboard, Bell, Users } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
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

  const isDarkHero = pathname === "/" || pathname === "/about";

  return (
    <>
      <header
        className={clsx(
          "sticky top-0 z-40 transition-all duration-200 border-b",
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-medinex-border text-medinex-text"
            : isDarkHero
            ? "bg-medinex-dark/95 backdrop-blur-md border-emerald-950 text-white"
            : "bg-white border-medinex-border text-medinex-text"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-medinex-teal rounded-lg p-1"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-medinex-teal to-medinex-deep flex items-center justify-center text-white shadow-md">
                <Activity className="w-6 h-6 text-medinex-mint" />
              </div>
              <div>
                <span className={clsx("font-bold text-xl tracking-tight", isDarkHero && !scrolled ? "text-white" : "text-medinex-text")}>
                  Medi<span className="text-medinex-teal">Nex</span>
                </span>
                <span className="block text-[10px] tracking-wider uppercase text-medinex-muted -mt-1 font-semibold">
                  E-Health 2026
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={clsx(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "text-medinex-teal bg-medinex-teal/10 font-semibold"
                        : isDarkHero && !scrolled
                        ? "text-slate-300 hover:text-white hover:bg-white/10"
                        : "text-slate-600 hover:text-medinex-teal hover:bg-slate-50"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Action Buttons / Auth State */}
            <div className="hidden md:flex items-center space-x-2">
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/dashboard/notifications"
                    className={clsx(
                      "relative p-2 rounded-lg transition-colors",
                      isDarkHero && !scrolled
                        ? "text-slate-300 hover:text-white hover:bg-white/10"
                        : "text-slate-600 hover:text-[#0D9488] hover:bg-slate-100"
                    )}
                    title="Notifications"
                    aria-label="View notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#0D9488] ring-2 ring-white" />
                    )}
                  </Link>

                  <Link
                    href="/dashboard/following"
                    className={clsx(
                      "p-2 rounded-lg transition-colors",
                      isDarkHero && !scrolled
                        ? "text-slate-300 hover:text-white hover:bg-white/10"
                        : "text-slate-600 hover:text-[#0D9488] hover:bg-slate-100"
                    )}
                    title="Following Network"
                    aria-label="View following network"
                  >
                    <Users className="w-4 h-4" />
                  </Link>

                  <Link href="/dashboard">
                    <Button variant="outline" size="sm" className="inline-flex items-center gap-1.5">
                      <LayoutDashboard className="w-3.5 h-3.5 text-medinex-teal" />
                      <span>Dashboard</span>
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => logout()}
                    className={clsx(
                      "inline-flex items-center gap-1.5",
                      isDarkHero && !scrolled && "text-slate-300 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant={isDarkHero && !scrolled ? "ghost" : "outline"}
                      size="sm"
                      className={clsx(isDarkHero && !scrolled && "text-white hover:bg-white/10")}
                    >
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

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                  "p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-medinex-teal",
                  isDarkHero && !scrolled
                    ? "text-slate-300 hover:text-white hover:bg-white/10"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
                aria-label={isOpen ? "Close main menu" : "Open main menu"}
                aria-expanded={isOpen}
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="md:hidden border-t border-medinex-border/40 bg-white text-medinex-text shadow-xl">
            <div className="px-4 pt-3 pb-6 space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-medinex-muted bg-slate-50 rounded-md">
                <ShieldCheck className="w-4 h-4 text-medinex-teal" />
                <span>Strict Healthcare Data Separation</span>
              </div>
              <div className="space-y-1 pt-2">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={clsx(
                        "flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium",
                        isActive
                          ? "bg-medinex-teal/10 text-medinex-teal font-semibold"
                          : "text-slate-700 hover:bg-slate-50 hover:text-medinex-teal"
                      )}
                    >
                      <span>{link.label}</span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </Link>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100">
                {isAuthenticated && user ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 pb-2">
                      <Link
                        href="/dashboard/notifications"
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
                      >
                        <Bell className="w-3.5 h-3.5 text-teal-600" />
                        <span>Alerts ({unreadNotifications})</span>
                      </Link>
                      <Link
                        href="/dashboard/following"
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
                      >
                        <Users className="w-3.5 h-3.5 text-teal-600" />
                        <span>Following</span>
                      </Link>
                    </div>
                    <Link href="/dashboard" className="w-full block">
                      <Button variant="primary" className="w-full">
                        Dashboard ({user.username})
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full" onClick={() => logout()}>
                      Sign Out
                    </Button>
                  </div>
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
            </div>
          </div>
        )}
      </header>
    </>
  );
}
