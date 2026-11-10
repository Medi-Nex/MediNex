"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Layers,
  Edit2,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api/client";

interface ProjectDto {
  id: string;
  title: string;
  slug: string;
  shortSummary: string;
  problemStatement?: string;
  proposedSolution?: string;
  techStack?: string;
  stage: "PLANNING" | "RESEARCH" | "DEVELOPMENT" | "TESTING" | "PILOT" | "COMPLETED";
  demoUrl?: string;
  repositoryUrl?: string;
  heroImageUrl?: string;
  isFeatured: boolean;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit State
  const [editingProject, setEditingProject] = useState<ProjectDto | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editSummary, setEditSummary] = useState<string>("");
  const [editProblem, setEditProblem] = useState<string>("");
  const [editSolution, setEditSolution] = useState<string>("");
  const [editTechStack, setEditTechStack] = useState<string>("");
  const [editStage, setEditStage] = useState<"PLANNING" | "RESEARCH" | "DEVELOPMENT" | "TESTING" | "PILOT" | "COMPLETED">("DEVELOPMENT");
  const [editDemoUrl, setEditDemoUrl] = useState<string>("");
  const [editRepoUrl, setEditRepoUrl] = useState<string>("");

  const [isUpdating, startUpdating] = useTransition();
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<ProjectDto[]>("/projects");
      setProjects(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load projects";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openEditModal = (p: ProjectDto) => {
    setEditingProject(p);
    setEditTitle(p.title);
    setEditSummary(p.shortSummary);
    setEditProblem(p.problemStatement || "");
    setEditSolution(p.proposedSolution || "");
    setEditTechStack(p.techStack || "");
    setEditStage(p.stage);
    setEditDemoUrl(p.demoUrl || "");
    setEditRepoUrl(p.repositoryUrl || "");
    setUpdateError(null);
    setUpdateSuccess(false);
  };

  const handleSave = () => {
    if (!editingProject) return;
    setUpdateError(null);
    startUpdating(async () => {
      try {
        const updated = await apiClient<ProjectDto>(`/projects/${editingProject.slug}`, {
          method: "PUT",
          body: JSON.stringify({
            title: editTitle.trim(),
            shortSummary: editSummary.trim(),
            problemStatement: editProblem.trim(),
            proposedSolution: editSolution.trim(),
            techStack: editTechStack.trim(),
            stage: editStage,
            demoUrl: editDemoUrl.trim() || undefined,
            repositoryUrl: editRepoUrl.trim() || undefined,
          }),
        });

        setProjects((prev) =>
          prev.map((p) => (p.slug === editingProject.slug ? updated : p))
        );
        setUpdateSuccess(true);
        setTimeout(() => {
          setEditingProject(null);
          setUpdateSuccess(false);
        }, 1200);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update project";
        setUpdateError(msg);
      }
    });
  };

  const getStageBadgeVariant = (stage: string) => {
    switch (stage) {
      case "DEVELOPMENT":
        return "teal";
      case "PILOT":
        return "mint";
      case "TESTING":
        return "warning";
      case "COMPLETED":
        return "mint";
      default:
        return "placeholder";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-medinex-text tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-medinex-teal" />
            <span>Project Governance & Initiatives</span>
          </h1>
          <p className="text-xs text-medinex-muted mt-1">
            Maintain authoritative technical specifications, stage lifecycle, and clinical boundaries for MediNex initiatives.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchProjects}
          disabled={loading}
          className="text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Strict Clinical Data Isolation Alert */}
      <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-medinex-teal shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Architectural Data Isolation Standard:</span>
          <p className="text-[11px] text-teal-800 leading-relaxed">
            All ShasthoSetu telemedicine telemetry, clinical consultation queues, and patient records are architecturally separated from community tables. No fake clinical validation, authority approvals, or unverified pilot metrics may be claimed without certified evidence.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Projects Table */}
      <Card className="border border-medinex-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-medinex-border text-medinex-muted font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Initiative</th>
                <th className="py-3.5 px-4">Slug</th>
                <th className="py-3.5 px-4">Current Stage</th>
                <th className="py-3.5 px-4">Tech Stack</th>
                <th className="py-3.5 px-4">Summary</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-medinex-muted">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-medinex-teal" />
                    <span>Loading initiatives...</span>
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-medinex-muted">
                    No initiatives found in database.
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 font-bold text-medinex-text">
                        <span>{project.title}</span>
                        {project.isFeatured && (
                          <Badge variant="mint" className="text-[9px] py-0">
                            Featured
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      /{project.slug}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={getStageBadgeVariant(project.stage)} className="text-[10px]">
                        {project.stage}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] font-mono text-slate-600 max-w-xs truncate">
                      {project.techStack || "Not Specified"}
                    </td>
                    <td className="py-3.5 px-4 max-w-sm truncate text-slate-600 text-[11px]">
                      {project.shortSummary}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/projects/${project.slug}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-medinex-teal hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Public Specification"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(project)}
                          className="text-xs h-8 px-2.5 flex items-center gap-1 text-slate-600 hover:text-medinex-teal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-medinex-border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-medinex-border">
              <div>
                <h3 className="font-bold text-sm text-medinex-text">
                  Edit Initiative Specification: {editingProject.title}
                </h3>
                <span className="text-[11px] font-mono text-medinex-teal">
                  Slug: {editingProject.slug}
                </span>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {updateError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {updateError}
              </div>
            )}

            {updateSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Project specification successfully updated in database.</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-medinex-text mb-1">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-medinex-border focus:outline-none focus:border-medinex-teal"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-medinex-text mb-1">
                    Project Lifecycle Stage
                  </label>
                  <select
                    value={editStage}
                    onChange={(e) => setEditStage(e.target.value as "PLANNING" | "RESEARCH" | "DEVELOPMENT" | "TESTING" | "PILOT" | "COMPLETED")}
                    className="w-full p-2.5 rounded-xl border border-medinex-border bg-white text-slate-700 focus:outline-none focus:border-medinex-teal"
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
                <label className="block font-semibold text-medinex-text mb-1">
                  Short Summary
                </label>
                <textarea
                  rows={2}
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-medinex-border focus:outline-none focus:border-medinex-teal"
                />
              </div>

              <div>
                <label className="block font-semibold text-medinex-text mb-1">
                  Problem Statement
                </label>
                <textarea
                  rows={3}
                  value={editProblem}
                  onChange={(e) => setEditProblem(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-medinex-border focus:outline-none focus:border-medinex-teal"
                />
              </div>

              <div>
                <label className="block font-semibold text-medinex-text mb-1">
                  Proposed Solution
                </label>
                <textarea
                  rows={3}
                  value={editSolution}
                  onChange={(e) => setEditSolution(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-medinex-border focus:outline-none focus:border-medinex-teal"
                />
              </div>

              <div>
                <label className="block font-semibold text-medinex-text mb-1">
                  Technology Stack
                </label>
                <input
                  type="text"
                  value={editTechStack}
                  onChange={(e) => setEditTechStack(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-medinex-border focus:outline-none focus:border-medinex-teal"
                  placeholder="e.g. Next.js, Spring Boot, PostgreSQL, WebRTC, Opus"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-medinex-text mb-1">
                    Demo URL (if verified)
                  </label>
                  <input
                    type="url"
                    value={editDemoUrl}
                    onChange={(e) => setEditDemoUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-medinex-border focus:outline-none focus:border-medinex-teal"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block font-semibold text-medinex-text mb-1">
                    Public Repository URL
                  </label>
                  <input
                    type="url"
                    value={editRepoUrl}
                    onChange={(e) => setEditRepoUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-medinex-border focus:outline-none focus:border-medinex-teal"
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-medinex-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingProject(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={isUpdating}
                className="text-xs"
              >
                {isUpdating ? "Saving..." : "Save Project Spec"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
