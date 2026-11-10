"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Activity, ChevronRight, ShieldCheck } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";

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
  const pathname = usePathname();

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
      {/* Hackathon banner */}
      <div className="bg-medinex-dark text-slate-300 text-xs py-1.5 px-4 text-center border-b border-emerald-950/60 flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-medinex-mint animate-pulse"></span>
        <span>
          <strong>E-Health Hackathon 2026</strong> — Official Innovation & Community Hub
        </span>
        <span className="hidden md:inline text-slate-400">|</span>
        <span className="hidden md:inline text-slate-400">Transparent Placeholder Architecture Active</span>
      </div>

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

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center space-x-3">
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

              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
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
            </div>
          </div>
        )}
      </header>
    </>
  );
}
