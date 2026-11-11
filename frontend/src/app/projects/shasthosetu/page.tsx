"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Activity,
  ShieldAlert,
  Code2,
  Edit3,
  Save,
  X,
  ExternalLink,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SHASTHOSETU_PROJECT, INITIAL_TEAM_MEMBERS } from "@/lib/team-data";
import { ProjectInfo, ProjectStage } from "@/types";

export default function ShasthoSetuPage() {
  const [project, setProject] = useState<ProjectInfo>(SHASTHOSETU_PROJECT);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ProjectInfo>>(SHASTHOSETU_PROJECT);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...project,
      ...formData,
    } as ProjectInfo;
    setProject(updated);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-medinex-light pb-20">
      {/* Top Breadcrumb Header */}
      <div className="bg-white border-b border-medinex-border py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link
            href="/projects"
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-medinex-teal transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to Projects Directory</span>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? "Close Editor" : "Edit Project Specs"}</span>
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Project Header Banner */}
        <div className="bg-gradient-to-br from-medinex-dark via-medinex-deep to-medinex-dark text-white rounded-2xl p-8 sm:p-12 shadow-elevated border border-emerald-950 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="mint">Digital Health Interoperability</Badge>
              <Badge variant="warning">Stage: {project.stage}</Badge>
            </div>
            <span className="text-xs text-slate-400">Official Flagship Project</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              {project.title}
            </h1>
            <p className="text-base sm:text-xl text-slate-200 leading-relaxed font-normal">
              {project.shortSummary}
            </p>
          </div>

          {/* Assigned Contributors Avatars */}
          <div className="pt-4 border-t border-emerald-950 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Assigned Team:</span>
              <div className="flex -space-x-2">
                {INITIAL_TEAM_MEMBERS.map((m) => (
                  <Link
                    key={m.id}
                    href={`/team/${m.username}`}
                    title={m.fullName}
                    className="w-8 h-8 rounded-full bg-slate-100 border-2 border-medinex-dark flex items-center justify-center text-[10px] font-bold text-medinex-deep hover:scale-110 transition-transform"
                  >
                    {m.username.replace("contributor-", "C")}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {project.repositoryUrl && (
                <a
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-xs font-semibold text-white inline-flex items-center gap-1.5"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Mandatory Health Tech Separation Disclaimer */}
        <div className="p-5 bg-amber-50/80 border border-amber-300/80 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <strong>Mandatory Healthcare Data Segregation &amp; Compliance Statement:</strong>
            <p>
              ShasthoSetu is an experimental digital health technology under active research and development.
              It has <em>not</em> been deployed in live clinical trials, nor approved by regulatory health authorities.
              All experimental health-record interoperability schemas are architecturally isolated from the MediNex public community platform. Zero real patient records are stored on public social databases.
            </p>
          </div>
        </div>

        {/* Project Edit Form */}
        {isEditing && (
          <Card className="border-2 border-medinex-teal shadow-elevated">
            <CardHeader className="bg-slate-50/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-medinex-text">Edit Project Information</h3>
                <p className="text-xs text-medinex-muted">Update specifications for {project.title}</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title || ""}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-medinex-teal focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Project Stage</label>
                    <select
                      value={formData.stage || "DEVELOPMENT"}
                      onChange={(e) => setFormData({ ...formData, stage: e.target.value as ProjectStage })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-medinex-teal focus:outline-none bg-white"
                    >
                      <option value="PLANNING">PLANNING</option>
                      <option value="RESEARCH">RESEARCH</option>
                      <option value="DEVELOPMENT">DEVELOPMENT</option>
                      <option value="TESTING">TESTING</option>
                      <option value="PILOT">PILOT</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Short Summary</label>
                  <textarea
                    rows={2}
                    value={formData.shortSummary || ""}
                    onChange={(e) => setFormData({ ...formData, shortSummary: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-medinex-teal focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Problem Statement</label>
                  <textarea
                    rows={3}
                    value={formData.problemStatement || ""}
                    onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-medinex-teal focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Proposed Solution</label>
                  <textarea
                    rows={3}
                    value={formData.proposedSolution || ""}
                    onChange={(e) => setFormData({ ...formData, proposedSolution: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-medinex-teal focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="inline-flex items-center gap-1.5">
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Project Updates</span>
                  </Button>
                </div>
              </CardBody>
            </form>
          </Card>
        )}

        {/* Deep Dive: Problem Statement & Proposed Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-t-4 border-t-red-500">
            <CardHeader className="bg-slate-50/70">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h2 className="font-bold text-base text-medinex-text">The Healthcare Interoperability Challenge</h2>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {project.problemStatement}
              </p>
            </CardBody>
          </Card>

          <Card className="border-t-4 border-t-medinex-teal">
            <CardHeader className="bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-medinex-teal" />
                <h2 className="font-bold text-base text-medinex-text">The Proposed Solution Architecture</h2>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {project.proposedSolution}
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Key Features Grid */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-medinex-text">Architectural Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {project.features.map((feat, idx) => (
              <Card key={idx}>
                <CardBody className="space-y-2">
                  <div className="flex items-center gap-2 text-medinex-teal font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <h3>{feat.title}</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {feat.description}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        {/* Tech Stack and Data Isolation Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <h2 className="font-bold text-base text-medinex-text">Technology Stack</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Engineered using Next.js App Router for edge responsiveness, Java 21 Spring Boot for secure enterprise processing, and PostgreSQL with explicit temporal constraints for auditability.
                </p>
              </CardBody>
            </Card>
          </div>

          <div>
            <Card className="bg-emerald-50/50 border-emerald-200/80">
              <CardHeader>
                <div className="flex items-center gap-2 text-medinex-deep">
                  <Lock className="w-4 h-4 text-medinex-teal" />
                  <h2 className="font-bold text-xs uppercase tracking-wider">Data Separation</h2>
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Community social feeds and ShasthoSetu health-record interoperability prototypes reside in separated logical domains. Social authentication tokens grant zero access to private health-data pipelines.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Transparent Implementation & Maturity Roadmap */}
        <div className="mt-10 bg-white border border-medinex-border rounded-2xl p-6 sm:p-8 shadow-subtle space-y-6">
          <div className="space-y-2">
            <Badge variant="teal">Project Transparency &amp; Maturity Matrix</Badge>
            <h2 className="text-xl sm:text-2xl font-bold text-medinex-text">
              Implementation Status &amp; Development Roadmap
            </h2>
            <p className="text-xs sm:text-sm text-medinex-muted leading-relaxed">
              ShasthoSetu is an active healthcare technology initiative under MediNex. To prevent ambiguity,
              implemented platform modules are explicitly separated from prototypes, ongoing research,
              planned concepts, and long-term architectural vision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                1. Implemented (MediNex Platform)
              </span>
              <h3 className="text-sm font-bold text-medinex-text">Core Platform &amp; Safety Controls</h3>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>Project showcase &amp; specification documentation hub</li>
                <li>Role-Based Access Control (RBAC) &amp; JWT authentication</li>
                <li>Zero-PHI automated screening on public posts &amp; comments</li>
                <li>Community discussions &amp; admin governance tools</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-2">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                2. Working Prototypes
              </span>
              <h3 className="text-sm font-bold text-medinex-text">Foundation &amp; Data Boundaries</h3>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>ShasthoSetu specification API (Spring Boot &amp; PostgreSQL)</li>
                <li>Logical isolation between social and research models</li>
                <li>Modular Next.js interface for bilingual documentation</li>
                <li>Schema validation &amp; Flyway migration baseline</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/60 space-y-2">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                3. Research &amp; Experiments
              </span>
              <h3 className="text-sm font-bold text-medinex-text">Standards &amp; Identity Concepts</h3>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>HL7 FHIR resource compatibility &amp; data exchange research</li>
                <li>Digital health record management &amp; summary modeling</li>
                <li>Patient identity mapping concepts across facilities</li>
                <li>Optional QR-based patient identity lookup exploration</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                4. Planned Features
              </span>
              <h3 className="text-sm font-bold text-medinex-text">Prototype Exchange Modules</h3>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>Interactive synthetic FHIR bundle exchange sandbox</li>
                <li>Patient consent management workflow simulator</li>
                <li>Tamper-evident access audit log viewer prototype</li>
                <li>Facility-to-facility API exchange test harness</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 md:col-span-2 lg:col-span-2">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                5. Long-Term Vision (Aspirational Research Direction)
              </span>
              <h3 className="text-sm font-bold text-medinex-text">Interoperable Healthcare Ecosystem</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Long-term architectural exploration toward standards-based interoperability across
                clinics, laboratories, and hospitals—where standardized health records can be
                exchanged with explicit patient consent, strict RBAC, encrypted APIs, and transparent
                audit trails. ShasthoSetu is not yet integrated with government Health ID systems or live
                hospital networks, and no nationwide deployment is claimed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
