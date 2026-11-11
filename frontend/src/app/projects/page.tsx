"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { SHASTHOSETU_PROJECT } from "@/lib/team-data";
import { ProjectInfo } from "@/types";

const ALL_PROJECTS: ProjectInfo[] = [
  SHASTHOSETU_PROJECT,
  {
    id: "proj-fhir-bridge",
    title: "FHIR Interoperability Schema Lab (Research Exploration)",
    slug: "fhir-bridge-research",
    shortSummary:
      "An exploratory research initiative evaluating HL7 FHIR resource schemas, standardized coding mappings, and consent-aware data exchange structures.",
    problemStatement:
      "Fragmented health information systems use incompatible record formats, preventing seamless transfer of longitudinal histories between diagnostic centers, clinics, and hospitals.",
    proposedSolution:
      "Investigating standardized HL7 FHIR resource mappings, patient identity mapping models, and lightweight validation rules designed for modular digital health record exchange.",
    features: [
      {
        title: "Standardized Terminology & Schema Mapping",
        description: "Maps digital health record fields toward standardized healthcare terminologies (LOINC/SNOMED research references).",
      },
      {
        title: "Interoperability Schema Validator",
        description: "Tests structural payload completeness and consent metadata prior to facility-to-facility exchange.",
      },
    ],
    techStack: ["Java 21", "JSON Schema", "PostgreSQL"],
    stage: "RESEARCH",
    isFeatured: false,
    repositoryUrl: "https://github.com/Medi-Nex",
    assignedMembers: ["contributor-01", "contributor-03"],
  },
];

const STAGES: { label: string; value: string }[] = [
  { label: "All Projects", value: "ALL" },
  { label: "Development (Active)", value: "DEVELOPMENT" },
  { label: "Research", value: "RESEARCH" },
  { label: "Planning", value: "PLANNING" },
];

export default function ProjectsDirectoryPage() {
  const [selectedStage, setSelectedStage] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = ALL_PROJECTS.filter((p) => {
    const matchesStage = selectedStage === "ALL" || p.stage === selectedStage;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortSummary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStage && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-medinex-light pb-20">
      {/* Dark Hero */}
      <section className="relative bg-medinex-dark bg-hero-mesh text-white py-12 sm:py-16 border-b border-emerald-950 overflow-hidden">
        <div className="absolute inset-0 bg-dot-matrix opacity-30 pointer-events-none" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-3 sm:space-y-4">
            <Badge variant="mint">R&amp;D Directory</Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              MediNex Innovation Projects
            </h1>
            <p className="text-slate-300 text-sm sm:text-lg leading-relaxed">
              Explore healthcare technology initiatives, interoperable health-record prototypes, and research
              explorations built by the MediNex team. Every project is transparently mapped to its actual
              implementation maturity stage.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-10 space-y-6 sm:space-y-8 w-full">
        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 bg-white border border-medinex-border rounded-2xl shadow-subtle">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5 md:pb-0">
            {STAGES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSelectedStage(s.value)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  selectedStage === s.value
                    ? "bg-medinex-teal text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm sm:text-xs pl-9 pr-3 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-medinex-teal"
            />
          </div>
        </div>

        {/* Projects List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map((proj) => (
            <Card key={proj.id} hoverEffect className="flex flex-col justify-between">
              <CardBody className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-medinex-text">{proj.title}</h2>
                    <span className="text-xs text-slate-400">/{proj.slug}</span>
                  </div>
                  <Badge
                    variant={
                      proj.stage === "DEVELOPMENT"
                        ? "warning"
                        : proj.stage === "RESEARCH"
                        ? "teal"
                        : "neutral"
                    }
                    size="sm"
                  >
                    Stage: {proj.stage}
                  </Badge>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {proj.shortSummary}
                </p>

                {/* Features Preview */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Core Specifications
                  </span>
                  {proj.features.slice(0, 2).map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-medinex-teal shrink-0 mt-0.5" />
                      <span>
                        <strong>{feat.title}:</strong> {feat.description}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tech Stack Chips */}
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {proj.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </CardBody>

              <div className="px-6 py-4 bg-slate-50/80 border-t border-medinex-border/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  {proj.assignedMembers.length} Contributors Assigned
                </span>
                <Link
                  href={proj.slug === "shasthosetu" ? "/projects/shasthosetu" : "#"}
                  className="font-bold text-medinex-teal hover:text-medinex-teal-hover inline-flex items-center gap-1"
                >
                  <span>{proj.slug === "shasthosetu" ? "Inspect Full Details" : "Read Research Specs"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
