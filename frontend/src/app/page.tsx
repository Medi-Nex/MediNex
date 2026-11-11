"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Users,
  Cpu,
  Layers,
  Network,
  Database,
  ShieldCheck,
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-medinex-teal/30 text-xs font-medium text-medinex-mint mb-6">
              <span className="w-2 h-2 rounded-full bg-medinex-mint" />
              <span>MediNex &mdash; Healthcare Innovation &amp; Technology Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
              Building the Future of Healthcare Through{" "}
              <span className="bg-gradient-to-r from-medinex-mint to-medinex-teal bg-clip-text text-transparent">
                Technology.
              </span>
            </h1>

            {/* Tagline / Subtitle */}
            <p className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed font-normal">
              A collaborative space for developers, researchers, and innovators working to solve
              real-world healthcare challenges through technology.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/projects">
                <Button variant="primary" size="lg" className="group">
                  <span>Explore Projects</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Link href="/community">
                <Button variant="dark" size="lg" className="border-emerald-800 text-slate-200">
                  <span>Join Our Community</span>
                </Button>
              </Link>

              <Link href="/team">
                <Button variant="ghost" size="lg" className="text-slate-300 hover:text-white hover:bg-white/10">
                  Meet the Contributors
                </Button>
              </Link>
            </div>
          </div>

          {/* Honest Platform Overview Bar (Zero Fabricated Vanity Stats) */}
          <div className="mt-16 pt-8 border-t border-emerald-950/80 grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">07</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Focus Areas</div>
              <div className="text-[11px] text-medinex-mint">Health Tech &amp; Research</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-medinex-mint tracking-tight">01</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Featured Initiative</div>
              <div className="text-[11px] text-slate-400">ShasthoSetu (Prototype Stage)</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">6</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Core Contributors</div>
              <div className="text-[11px] text-medinex-mint">Engineers &amp; Researchers</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">100%</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Data Segregation</div>
              <div className="text-[11px] text-slate-400">Zero PHI in Social DB</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. ABOUT MEDINEX & INNOVATION FOCUS AREAS (Clean Light Content: #F7FAF9) */}
      {/* ---------------------------------------------------------------------- */}
      <section className="py-20 bg-medinex-light border-b border-medinex-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <Badge variant="teal">About MediNex</Badge>
              <h2 className="text-3xl font-bold text-medinex-text tracking-tight sm:text-4xl">
                Connecting Technology, Research &amp; Healthcare Innovation.
              </h2>
              <p className="text-base text-medinex-muted leading-relaxed">
                MediNex is a collaborative healthcare technology platform where developers, researchers,
                and public health professionals explore ideas, build innovative solutions, and
                collaborate on technology-driven healthcare initiatives.
              </p>
              <p className="text-sm text-medinex-muted leading-relaxed">
                We focus on healthcare software engineering, interoperability research, and transparent
                documentation—rather than acting as a clinic, hospital system, or consultation service.
              </p>
              <div className="pt-2">
                <Link
                  href="/about"
                  className="inline-flex items-center text-sm font-semibold text-medinex-teal hover:text-medinex-teal-hover"
                >
                  <span>Read About MediNex &amp; Governance</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <Card hoverEffect>
                <CardBody className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-medinex-teal/10 text-medinex-teal flex items-center justify-center shrink-0">
                    <Network className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-medinex-text">Interoperability &amp; R&amp;D</h3>
                    <p className="text-xs text-medinex-muted mt-1 leading-relaxed">
                      Incubating software concepts like <strong>ShasthoSetu</strong> to explore
                      standardized digital health record exchange and FHIR research.
                    </p>
                  </div>
                </CardBody>
              </Card>

              <Card hoverEffect>
                <CardBody className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-medinex-teal/10 text-medinex-teal flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-medinex-text">Zero-PHI Community Boundary</h3>
                    <p className="text-xs text-medinex-muted mt-1 leading-relaxed">
                      Strict isolation ensures personal medical records and clinical charts never
                      enter public community feeds or social databases.
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          {/* 7 Focus Areas (Explicitly Framed as Focus Areas) */}
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <Badge variant="mint" className="mb-2">Innovation Areas</Badge>
                <h2 className="text-2xl sm:text-3xl font-bold text-medinex-text tracking-tight">
                  Research &amp; Technology Focus Areas
                </h2>
              </div>
              <p className="text-xs text-medinex-muted max-w-md">
                Active exploration domains across software engineering, standards research, and public
                health innovation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: Layers,
                  title: "Digital Health",
                  desc: "Human-centered digital workflows improving healthcare accessibility and continuity.",
                },
                {
                  icon: Network,
                  title: "Healthcare Interoperability",
                  desc: "Standardized health data structures, HL7 FHIR alignment, and consent-aware exchange.",
                },
                {
                  icon: Database,
                  title: "Health Information Systems",
                  desc: "Modular architectures connecting facilities without brittle data silos.",
                },
                {
                  icon: Cpu,
                  title: "AI in Healthcare",
                  desc: "Exploratory research into assistive analytics and ethical decision-support concepts.",
                },
                {
                  icon: ShieldCheck,
                  title: "Health Data Security",
                  desc: "RBAC, Zero-PHI boundaries, audit logging concepts, and privacy-preserving design.",
                },
                {
                  icon: Users,
                  title: "Public Health Technology",
                  desc: "Evidence-informed software concepts supporting community and population health research.",
                },
                {
                  icon: BookOpen,
                  title: "Research & Development",
                  desc: "Documented technical specifications, iterative prototypes, and transparent progress notes.",
                },
              ].map((area) => {
                const Icon = area.icon;
                return (
                  <Card key={area.title} hoverEffect>
                    <CardBody className="space-y-2.5">
                      <div className="w-9 h-9 rounded-lg bg-medinex-teal/10 text-medinex-teal flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-medinex-text">{area.title}</h3>
                      <p className="text-xs text-medinex-muted leading-relaxed">{area.desc}</p>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. FEATURED PROJECT: SHASTHOSETU SPOTLIGHT */}
      {/* ---------------------------------------------------------------------- */}
      <section className="py-20 bg-white border-b border-medinex-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-medinex-dark to-medinex-deep rounded-2xl text-white p-8 sm:p-12 shadow-elevated relative overflow-hidden">
            <div className="max-w-3xl relative z-10 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="mint" className="bg-emerald-950/90 text-medinex-mint border-medinex-mint/40 font-semibold">
                  Featured Project &bull; Health Record Interoperability
                </Badge>
                <Badge variant="warning" className="bg-amber-950/90 text-amber-300 border-amber-500/40 font-semibold">
                  Stage: Prototype &amp; Architecture Research
                </Badge>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                ShasthoSetu (স্বাস্থ্যসেতু)
              </h2>

              <p className="text-slate-200 text-base sm:text-lg leading-relaxed">
                An Interoperable Digital Health Record &amp; Exchange Platform initiative exploring how
                standardized health data schemas, HL7 FHIR alignment, patient consent management, and
                secure API access can bridge fragmented health records.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3">
                  <Network className="w-5 h-5 text-medinex-mint shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">
                    HL7 FHIR compatibility research &amp; standardized health data exchange workflows.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-medinex-mint shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">
                    Patient identity mapping, consent controls, RBAC &amp; access audit log concepts.
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {["Next.js App Router", "Java 21 Spring Boot", "PostgreSQL", "HL7 FHIR (Research)"].map(
                  (tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-xs text-slate-200"
                    >
                      {tech}
                    </span>
                  )
                )}
              </div>

              <div className="pt-3 flex flex-wrap gap-4">
                <Link href="/projects/shasthosetu">
                  <Button variant="primary" size="md">
                    Explore ShasthoSetu Architecture
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
      {/* 4. COLLABORATION & CORE CONTRIBUTORS */}
      {/* ---------------------------------------------------------------------- */}
      <section className="py-20 bg-medinex-light border-b border-medinex-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
            {[
              { title: "Software Developers", desc: "Contribute frontend, backend API, and interoperability architecture components." },
              { title: "Health Researchers", desc: "Shape data standards research, HL7 FHIR schema alignment, and evaluation metrics." },
              { title: "Public Health Voices", desc: "Provide domain insight on population health workflows and accessibility." },
              { title: "Students & Innovators", desc: "Join open discussions, review technical progress, and test prototype ideas." },
            ].map((item) => (
              <div key={item.title} className="p-4 rounded-xl bg-white border border-medinex-border">
                <h3 className="text-sm font-bold text-medinex-text">{item.title}</h3>
                <p className="text-xs text-medinex-muted mt-1 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <Badge variant="teal" className="mb-2">
                Multidisciplinary Core Team
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
            Explore our technical documentation, follow ShasthoSetu interoperability research,
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
