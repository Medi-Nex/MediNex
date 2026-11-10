"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Users,
  HeartPulse,
  WifiOff,
  Stethoscope,
  Lock,
  Globe,
  Mail,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { GithubIcon, LinkedinIcon } from "@/components/ui/SocialIcons";
import { INITIAL_TEAM_MEMBERS } from "@/lib/team-data";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------------------------------------------------------------- */}
      {/* 1. DARK HERO SECTION (Hybrid Design: #071A18 + #063D38) */}
      {/* ---------------------------------------------------------------------- */}
      <section className="relative bg-medinex-dark text-white overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 border-b border-emerald-950">
        {/* Subtle background glow effect (no excessive glassmorphism) */}
        <div
          className="absolute -top-40 -right-40 w-96 h-96 bg-medinex-teal/15 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 -left-40 w-96 h-96 bg-medinex-deep/30 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            {/* Hackathon Badge
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-medinex-teal/30 text-xs font-medium text-medinex-mint mb-6">
              <span className="w-2 h-2 rounded-full bg-medinex-mint animate-pulse" />
              <span>E-Health Hackathon 2026 Contender</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300">Six-Member Innovation Team</span>
            </div>*/}

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
              Healthcare Innovation. <br />
              <span className="bg-gradient-to-r from-medinex-mint to-medinex-teal bg-clip-text text-transparent">
                Connected Communities.
              </span>
            </h1>

            {/* Tagline / Subtitle */}
            <p className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed font-normal">
              MediNex is an open healthcare collaboration platform bringing together a
              dedicated six-contributor engineering team, official medical technologies like{" "}
              <strong className="text-white font-semibold">ShasthoSetu</strong>, and a public community
              fostering evidence-backed health solutions.
            </p>

            {/* Honest Disclosure notice
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-medinex-mint shrink-0" />
              <span>
                Transparent architecture: Team profiles and milestones use verified placeholder records until official credentials are provided.
              </span>
            </div>*/}

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/projects/shasthosetu">
                <Button variant="primary" size="lg" className="group">
                  <span>Explore ShasthoSetu</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Link href="/team">
                <Button variant="dark" size="lg" className="border-emerald-800 text-slate-200">
                  <span>Meet the Contributors</span>
                </Button>
              </Link>

              <Link href="/community">
                <Button variant="ghost" size="lg" className="text-slate-300 hover:text-white hover:bg-white/10">
                  Community Feed
                </Button>
              </Link>
            </div>
          </div>

          {/* Honest Metrics Bar (Zero Fabricated Vanity Stats) */}
          <div className="mt-16 pt-8 border-t border-emerald-950/80 grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">6</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Core Contributors</div>
              <div className="text-[11px] text-medinex-mint">Configurable Profiles</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-medinex-mint tracking-tight">01</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Flagship Project</div>
              <div className="text-[11px] text-slate-400">ShasthoSetu (Development)</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">100%</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Data Segregation</div>
              <div className="text-[11px] text-medinex-mint">Zero PHI in Social DB</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">2026</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Hackathon Sprint</div>
              <div className="text-[11px] text-slate-400">E-Health Target</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. CORE PILLARS (Clean Light Content: #F7FAF9) */}
      {/* ---------------------------------------------------------------------- */}
      <section className="py-20 bg-medinex-light border-b border-medinex-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="teal" className="mb-3">
              Platform Architecture
            </Badge>
            <h2 className="text-3xl font-bold text-medinex-text tracking-tight sm:text-4xl">
              Engineered for Real Healthcare Impact
            </h2>
            <p className="mt-4 text-base text-medinex-muted leading-relaxed">
              MediNex balances public community engagement with rigorous architectural boundaries,
              ensuring that software engineering directly advances accessible care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <Card hoverEffect className="p-2">
              <CardBody className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-medinex-teal/10 text-medinex-teal flex items-center justify-center">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-medinex-text">Official Innovation R&amp;D</h3>
                <p className="text-sm text-medinex-muted leading-relaxed">
                  Incubating projects like <strong>ShasthoSetu</strong> to address rural telemedicine
                  shortages, offline triage protocols, and low-bandwidth doctor consultations.
                </p>
                <div className="pt-2">
                  <Link
                    href="/projects/shasthosetu"
                    className="inline-flex items-center text-sm font-semibold text-medinex-teal hover:text-medinex-teal-hover"
                  >
                    <span>Inspect ShasthoSetu specs</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </CardBody>
            </Card>

            {/* Pillar 2 */}
            <Card hoverEffect className="p-2">
              <CardBody className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-medinex-teal/10 text-medinex-teal flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-medinex-text">Connected Community</h3>
                <p className="text-sm text-medinex-muted leading-relaxed">
                  Transparent public feed, follower systems for the official team and individual
                  members, technical updates, and peer-to-peer discussions.
                </p>
                <div className="pt-2">
                  <Link
                    href="/community"
                    className="inline-flex items-center text-sm font-semibold text-medinex-teal hover:text-medinex-teal-hover"
                  >
                    <span>View Community Feed</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </CardBody>
            </Card>

            {/* Pillar 3 */}
            <Card hoverEffect className="p-2">
              <CardBody className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-medinex-teal/10 text-medinex-teal flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-medinex-text">Zero Medical Data Exposure</h3>
                <p className="text-sm text-medinex-muted leading-relaxed">
                  Strict isolation: patient records, diagnoses, and hospital consultations will never
                  touch the public social database. DevSecOps compliance from day one.
                </p>
                <div className="pt-2">
                  <Link
                    href="/privacy"
                    className="inline-flex items-center text-sm font-semibold text-medinex-teal hover:text-medinex-teal-hover"
                  >
                    <span>Read Privacy Architecture</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. FEATURED PROJECT: SHASTHOSETU SPOTLIGHT */}
      {/* ---------------------------------------------------------------------- */}
      <section className="py-20 bg-white border-b border-medinex-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-medinex-dark to-medinex-deep rounded-2xl text-white p-8 sm:p-12 shadow-elevated relative overflow-hidden">
            <div className="max-w-2xl relative z-10 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="mint" className="bg-emerald-950/90 text-medinex-mint border-medinex-mint/40 font-semibold">
                  Featured Hackathon Initiative
                </Badge>
                <Badge variant="warning" className="bg-amber-950/90 text-amber-300 border-amber-500/40 font-semibold">
                  Status: In Active Development
                </Badge>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                ShasthoSetu (স্বাস্থ্যসেতু)
              </h2>

              <p className="text-slate-200 text-base sm:text-lg leading-relaxed">
                An experimental telemedicine and community clinic connectivity bridge. Engineered to
                empower grassroots healthcare workers in remote Bangladeshi rural areas with offline-first
                triage templates and low-bandwidth doctor routing.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3">
                  <WifiOff className="w-5 h-5 text-medinex-mint shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">
                    Offline-first local triage queuing on intermittent networks.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <HeartPulse className="w-5 h-5 text-medinex-mint shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">
                    Structured vital card summaries instead of bulky video streams.
                  </span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <Link href="/projects/shasthosetu">
                  <Button variant="primary" size="md">
                    Full ShasthoSetu Documentation
                  </Button>
                </Link>
                <Link href="/projects">
                  <Button variant="dark" size="md" className="border-emerald-800">
                    Browse All Projects
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 4. SIX-CONTRIBUTOR TEAM PREVIEW */}
      {/* ---------------------------------------------------------------------- */}
      <section className="py-20 bg-medinex-light border-b border-medinex-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <Badge variant="teal" className="mb-2">
                E-Health Hackathon 2026 Team
              </Badge>
              <h2 className="text-3xl font-bold text-medinex-text tracking-tight">
                Contributors
              </h2>
              <p className="mt-2 text-medinex-muted text-sm max-w-xl">
                Each profile is structured with verified placeholder identities and can be updated by
                the team once finalized. No fabricated personal credentials or awards are displayed.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link href="/team">
                <Button variant="outline" size="sm">
                  <span>View All 6 Full Profiles</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {INITIAL_TEAM_MEMBERS.map((member) => (
              <Card key={member.id} hoverEffect className="flex flex-col justify-between">
                <CardBody className="space-y-4">
                  <div className="flex flex-col items-start gap-4">
                    {/* বড় ছবির জায়গা */}
                    <div className="w-full aspect-[4/4] md:aspect-[4/4.5] rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-4xl text-slate-300 shadow-inner overflow-hidden relative">
                      <span className="absolute inset-0 flex items-center justify-center font-bold text-6xl text-slate-300 z-0">
                        {member.username.replace("contributor-", "C")}
                      </span>

                      <Image
                        src={`/images/team/${member.username}.jpg`}
                        alt={member.fullName}
                        fill
                        className="object-cover object-top relative z-10"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>

                    <div className="flex items-start justify-between w-full">
                      <div>
                        <h3 className="font-bold text-base text-medinex-text leading-tight">
                          {member.fullName}
                        </h3>
                        <p className="text-xs text-medinex-teal font-medium mt-0.5">
                          @{member.username}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {member.isLead && (
                      <Badge variant="teal" size="sm">
                        Team Lead
                      </Badge>
                    )}
                    {member.isPlaceholder && (
                      <Badge variant="placeholder" size="sm">
                        Verified Placeholder
                      </Badge>
                    )}
                  </div>

                  {/* Role & Org */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-800">{member.designation}</p>
                    <p className="text-xs text-slate-500">{member.department}</p>
                    <p className="text-[11px] text-slate-400 italic">{member.university}</p>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {member.bio}
                  </p>

                  {/* Key Skills */}
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5">
                      Focus Areas &amp; Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {member.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200/60"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardBody>

                {/* Footer Link */}
                <div className="px-6 py-3.5 bg-slate-50/80 border-t border-medinex-border/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="text-slate-400 hover:text-medinex-teal transition-colors"
                        aria-label={`Email ${member.fullName}`}
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                    {member.portfolioUrl && (
                      <a
                        href={member.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-medinex-teal transition-colors"
                        aria-label={`Portfolio website for ${member.fullName}`}
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                    {member.githubUrl && (
                      <a
                        href={member.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-medinex-teal transition-colors"
                        aria-label={`GitHub profile for ${member.fullName}`}
                      >
                        <GithubIcon className="w-4 h-4" />
                      </a>
                    )}
                    {member.linkedinUrl && (
                      <a
                        href={member.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-medinex-teal transition-colors"
                        aria-label={`LinkedIn profile for ${member.fullName}`}
                      >
                        <LinkedinIcon className="w-4 h-4" />
                      </a>
                    )}
                    {member.researchGateUrl && (
                      <a
                        href={member.researchGateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-medinex-teal transition-colors"
                        aria-label={`ResearchGate profile for ${member.fullName}`}
                      >
                        <BookOpen className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <Link
                    href={`/team/${member.username}`}
                    className="font-semibold text-medinex-teal hover:text-medinex-teal-hover inline-flex items-center gap-1"
                  >
                    <span>View &amp; Edit Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 5. CALL TO ACTION & TRANSPARENCY NOTICE */}
      {/* ---------------------------------------------------------------------- */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <Badge variant="mint">Join the Journey</Badge>
          <h2 className="text-3xl font-extrabold text-medinex-text sm:text-4xl tracking-tight">
            Connect With Healthcare Innovation
          </h2>
          <p className="text-medinex-muted text-base max-w-2xl mx-auto leading-relaxed">
            Follow our progress as we prepare for E-Health Hackathon 2026. Explore technical updates,
            participate in open community discussions, and inspect our architectural design.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link href="/register">
              <Button variant="primary" size="lg">
                Create Free Community Account
              </Button>
            </Link>
            <Link href="/updates">
              <Button variant="outline" size="lg">
                Read Official Updates
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
