import React from "react";
import Link from "next/link";
import { Activity, ShieldAlert, HeartHandshake, ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/ui/SocialIcons";

export default function Footer() {
  return (
    <footer role="contentinfo" className="bg-medinex-dark text-slate-300 border-t border-emerald-950/80 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-emerald-950">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-medinex-teal to-medinex-deep flex items-center justify-center text-white shadow-md">
                <Activity className="w-5 h-5 text-medinex-mint" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">
                Medi<span className="text-medinex-teal">Nex</span>
              </span>
            </div>

            <p className="text-medinex-mint font-medium text-sm">
              Connecting Technology, Research &amp; Healthcare Innovation.
            </p>

            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              MediNex is a collaborative healthcare technology platform where developers, researchers,
              and public health professionals explore ideas, build innovative solutions, and
              collaborate on technology-driven healthcare initiatives.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <a
                href="https://github.com/Medi-Nex"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg bg-emerald-950/60 hover:bg-medinex-teal/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-emerald-900/40"
                aria-label="MediNex GitHub Organization"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
              <span className="text-xs text-slate-400">Official Open Source Hub</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-medinex-mint transition-colors">
                  Overview
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-medinex-mint transition-colors">
                  Mission & Story
                </Link>
              </li>
              <li>
                <Link href="/team" className="hover:text-medinex-mint transition-colors">
                  Six Contributors
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-medinex-mint transition-colors">
                  Projects Directory
                </Link>
              </li>
              <li>
                <Link href="/projects/shasthosetu" className="hover:text-medinex-mint transition-colors flex items-center gap-1.5">
                  <span>ShasthoSetu</span>
                  <span className="text-[10px] bg-medinex-teal/20 text-medinex-mint px-1.5 py-0.5 rounded">Core</span>
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-medinex-mint transition-colors">
                  Community Feed
                </Link>
              </li>
            </ul>
          </div>

          {/* Events & Updates */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Platform &amp; Research</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/updates" className="hover:text-medinex-mint transition-colors">
                  Official Updates
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-medinex-mint transition-colors">
                  Sprint Events
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-medinex-mint transition-colors">
                  Contact Team
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/Medi-Nex/MediNex"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-medinex-mint transition-colors inline-flex items-center gap-1"
                >
                  <span>Repository</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Governance & Privacy */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Governance</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-medinex-mint transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-medinex-mint transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/about#governance" className="hover:text-medinex-mint transition-colors">
                  Data Isolation Rules
                </Link>
              </li>
              <li>
                <Link href="/about#hackathon" className="hover:text-medinex-mint transition-colors">
                  Initiative Background
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Strict Data Separation & Disclaimer Notice */}
        <div className="mt-8 pt-8 border-t border-emerald-950/60 bg-emerald-950/30 rounded-xl p-5 border">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="p-2 bg-emerald-900/60 rounded-lg text-medinex-mint shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong>Mandatory Healthcare Data Separation Notice:</strong> MediNex does not collect, index, or store patient medical records, personal clinical health information (PHI), or hospital diagnostic logs. All participatory community discussions are strictly public communication. ShasthoSetu is an isolated health-record interoperability initiative subject to healthcare safety and privacy benchmarks.
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} MediNex Platform. Healthcare Innovation &amp; Technology Platform.
          </div>
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-medinex-mint" />
            <span>Honest Engineering & Verified Information Only</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
