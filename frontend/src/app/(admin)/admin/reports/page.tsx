"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  Flag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getAdminReports,
  resolveReport,
  AdminReport,
  PaginatedResult,
} from "@/lib/api/admin";

export default function AdminReportsPage() {
  const [reportsPage, setReportsPage] = useState<PaginatedResult<AdminReport> | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [page, setPage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Resolution Dialog State
  const [activeReport, setActiveReport] = useState<AdminReport | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<"RESOLVED" | "DISMISSED">("RESOLVED");
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const [actionChoice, setActionChoice] = useState<"HIDE_POST" | "HIDE_COMMENT" | "SUSPEND_USER" | "NONE">("NONE");
  const [isResolving, startResolving] = useTransition();
  const [resolveError, setResolveError] = useState<string | null>(null);

  const fetchReports = async (st: string, p = 0) => {
    setLoading(true);
    setError(null);
    try {
      const filter = st === "ALL" ? undefined : st;
      const data = await getAdminReports(filter, p, 15);
      setReportsPage(data);
      setPage(data.number);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load moderation queue";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(statusFilter, page);
  }, [statusFilter, page]);

  const openResolveDialog = (report: AdminReport) => {
    setActiveReport(report);
    setResolutionStatus("RESOLVED");
    setResolutionNotes("");
    if (report.reportedPostId) {
      setActionChoice("HIDE_POST");
    } else if (report.reportedCommentId) {
      setActionChoice("HIDE_COMMENT");
    } else if (report.reportedUser) {
      setActionChoice("SUSPEND_USER");
    } else {
      setActionChoice("NONE");
    }
    setResolveError(null);
  };

  const handleResolveSubmit = () => {
    if (!activeReport) return;
    setResolveError(null);
    startResolving(async () => {
      try {
        await resolveReport(activeReport.id, {
          status: resolutionStatus,
          resolutionNotes: resolutionNotes || "Reviewed and resolved by administrator",
          action: actionChoice,
        });
        setActiveReport(null);
        await fetchReports(statusFilter, page);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to resolve report";
        setResolveError(msg);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-medinex-text tracking-tight">
            Moderation & Safety Queue
          </h1>
          <p className="text-xs text-medinex-muted mt-1">
            Community-reported violations, content hide requests, and account safety reviews
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {["PENDING", "RESOLVED", "DISMISSED", "ALL"].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(0);
                }}
                className={`px-3 py-1 font-semibold rounded-lg transition-all ${
                  statusFilter === st
                    ? "bg-white text-medinex-teal shadow-xs"
                    : "text-slate-600 hover:text-medinex-text"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchReports(statusFilter, page)}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reports Listing */}
      <div className="space-y-4">
        {loading && reportsPage === null ? (
          <div className="py-16 text-center text-medinex-muted bg-white rounded-2xl border border-medinex-border">
            <div className="animate-spin w-6 h-6 border-2 border-medinex-teal border-t-transparent rounded-full mx-auto mb-2" />
            Loading moderation tickets...
          </div>
        ) : (reportsPage?.content || []).length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-medinex-border">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-medinex-text">Queue is clear</h3>
            <p className="text-xs text-medinex-muted mt-1 max-w-sm mx-auto">
              No moderation reports currently requiring review for the selected filter.
            </p>
          </div>
        ) : (
          reportsPage?.content.map((rep) => (
            <Card key={rep.id} className="border border-medinex-border hover:border-slate-300 transition-all">
              <CardBody className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={
                          rep.status === "PENDING"
                            ? "warning"
                            : rep.status === "RESOLVED"
                            ? "mint"
                            : "outline"
                        }
                        className="text-[10px] py-0 font-bold"
                      >
                        {rep.status}
                      </Badge>
                      <span className="font-mono text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                        {rep.reason}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(rep.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-medinex-text">
                      <span className="text-medinex-muted">Reported by: </span>
                      <span className="font-semibold text-slate-800">
                        {rep.reporter?.fullName || rep.reporter?.username || "Community User"}
                      </span>
                      {rep.reporter?.username && (
                        <span className="text-medinex-teal font-mono ml-1">@{rep.reporter.username}</span>
                      )}
                    </div>

                    {rep.reportedUser && (
                      <div className="text-xs text-medinex-text">
                        <span className="text-medinex-muted">Target User: </span>
                        <span className="font-semibold text-red-700">
                          {rep.reportedUser.fullName || rep.reportedUser.username}
                        </span>
                        <span className="text-red-600 font-mono ml-1">@{rep.reportedUser.username}</span>
                      </div>
                    )}

                    {rep.reportedPostId && (
                      <div className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        Target Post ID: <span className="text-medinex-teal font-semibold">{rep.reportedPostId}</span>
                      </div>
                    )}

                    {rep.reportedCommentId && (
                      <div className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        Target Comment ID: <span className="text-medinex-teal font-semibold">{rep.reportedCommentId}</span>
                      </div>
                    )}

                    {rep.details && (
                      <div className="text-xs text-slate-700 bg-amber-50/50 p-3 rounded-xl border border-amber-100/60 leading-relaxed">
                        <span className="font-semibold text-amber-900 block mb-0.5">Report Details:</span>
                        {rep.details}
                      </div>
                    )}

                    {rep.resolutionNotes && (
                      <div className="text-xs text-emerald-800 bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 leading-relaxed">
                        <span className="font-semibold text-emerald-950 block mb-0.5">Admin Resolution:</span>
                        {rep.resolutionNotes}
                      </div>
                    )}
                  </div>

                  {rep.status === "PENDING" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openResolveDialog(rep)}
                      className="shrink-0 text-xs self-start"
                    >
                      <Flag className="w-3.5 h-3.5 mr-1.5" />
                      Take Action
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))
        )}

        {/* Pagination */}
        {reportsPage && reportsPage.totalPages > 1 && (
          <div className="p-4 bg-white rounded-2xl border border-medinex-border flex items-center justify-between text-xs text-medinex-muted">
            <span>
              Page {reportsPage.number + 1} of {reportsPage.totalPages} ({reportsPage.totalElements} total tickets)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={reportsPage.first || loading}
                className="text-xs h-8"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={reportsPage.last || loading}
                className="text-xs h-8"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Resolution Dialog Modal */}
      {activeReport && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-medinex-border space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-medinex-border">
              <div>
                <h3 className="font-bold text-sm text-medinex-text">Resolve Moderation Ticket</h3>
                <p className="text-xs text-medinex-muted">Ticket ID: {activeReport.id.slice(0, 8)}...</p>
              </div>
              <button
                onClick={() => setActiveReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            {resolveError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{resolveError}</span>
              </div>
            )}

            {/* Resolution Status */}
            <div>
              <label className="block text-xs font-semibold text-medinex-text mb-1.5">
                Outcome Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResolutionStatus("RESOLVED")}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    resolutionStatus === "RESOLVED"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  RESOLVED (Action Taken)
                </button>
                <button
                  type="button"
                  onClick={() => setResolutionStatus("DISMISSED")}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    resolutionStatus === "DISMISSED"
                      ? "bg-slate-700 text-white border-slate-700 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  DISMISSED (No Violation)
                </button>
              </div>
            </div>

            {/* Enforcement Action */}
            {resolutionStatus === "RESOLVED" && (
              <div>
                <label className="block text-xs font-semibold text-medinex-text mb-1.5">
                  Enforcement Action
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionChoice("HIDE_POST")}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-left transition-all ${
                      actionChoice === "HIDE_POST"
                        ? "bg-teal-50 text-medinex-teal border-teal-300 font-semibold"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Hide Post
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionChoice("HIDE_COMMENT")}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-left transition-all ${
                      actionChoice === "HIDE_COMMENT"
                        ? "bg-teal-50 text-medinex-teal border-teal-300 font-semibold"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Hide Comment
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionChoice("SUSPEND_USER")}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-left transition-all ${
                      actionChoice === "SUSPEND_USER"
                        ? "bg-red-50 text-red-700 border-red-300 font-semibold"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Suspend User
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionChoice("NONE")}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-left transition-all ${
                      actionChoice === "NONE"
                        ? "bg-slate-100 text-slate-800 border-slate-400 font-semibold"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Warning Only (None)
                  </button>
                </div>
              </div>
            )}

            {/* Resolution Notes */}
            <div>
              <label className="block text-xs font-semibold text-medinex-text mb-1.5">
                Resolution Notes (Logged to Audit Trail)
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Explain the finding and actions taken..."
                className="w-full text-xs p-3 rounded-xl border border-medinex-border bg-white text-medinex-text focus:outline-none focus:border-medinex-teal"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-medinex-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveReport(null)}
                disabled={isResolving}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleResolveSubmit}
                disabled={isResolving}
                className="text-xs"
              >
                {isResolving ? "Submitting..." : "Confirm Resolution"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
