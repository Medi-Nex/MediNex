"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getAdminAuditLogs,
  AuditLogItem,
  PaginatedResult,
} from "@/lib/api/admin";

export default function AdminAuditLogsPage() {
  const [logsPage, setLogsPage] = useState<PaginatedResult<AuditLogItem> | null>(null);
  const [page, setPage] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async (p = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminAuditLogs(p, 25);
      setLogsPage(data);
      setPage(data.number);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load audit trail";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const filteredLogs = (logsPage?.content || []).filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      (l.actorEmail && l.actorEmail.toLowerCase().includes(q)) ||
      (l.targetEntity && l.targetEntity.toLowerCase().includes(q)) ||
      (l.targetId && l.targetId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-medinex-text tracking-tight">
            Security & Compliance Audit Trail
          </h1>
          <p className="text-xs text-medinex-muted mt-1">
            Append-only, immutable record of authentication, authorization, and administrative events
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by action, actor, or target..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 sm:py-1.5 text-xs rounded-xl border border-medinex-border bg-white text-medinex-text focus:outline-none focus:border-medinex-teal w-full sm:w-64"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(page)}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Compliance Guarantee Banner */}
      <div className="p-4 rounded-2xl bg-emerald-950 text-white flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-medinex-mint">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-tight">Immutable Record System</div>
            <div className="text-[11px] text-emerald-300/80">
              Entries are permanently persisted with actor identity, client IP, UTC timestamp, and target UUID.
            </div>
          </div>
        </div>
        <Badge variant="mint" className="text-[10px] py-0 hidden sm:inline-flex">
          Audit Grade
        </Badge>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Log Table */}
      <Card className="border border-medinex-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-medinex-border">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp (UTC)</th>
                <th className="py-3 px-4 font-semibold">Actor</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Target Entity</th>
                <th className="py-3 px-4 font-semibold">Target ID</th>
                <th className="py-3 px-4 font-semibold">Client IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-medinex-border">
              {loading && logsPage === null ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-medinex-muted">
                    <div className="animate-spin w-6 h-6 border-2 border-medinex-teal border-t-transparent rounded-full mx-auto mb-2" />
                    Querying audit records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-medinex-muted">
                    No audit records found matching query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.createdAt).toUTCString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">
                        {log.actorEmail || "System Automation"}
                      </span>
                      {log.actorId && (
                        <span className="block text-[10px] text-slate-400 font-mono">
                          ID: {log.actorId.slice(0, 8)}...
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          log.action.includes("SUSPEND") || log.action.includes("HIDDEN")
                            ? "warning"
                            : log.action.includes("ADMIN") || log.action.includes("RESOLVED")
                            ? "mint"
                            : "outline"
                        }
                        className="font-mono text-[10px] py-0"
                      >
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {log.targetEntity || "-"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {log.targetId ? `${log.targetId.slice(0, 12)}...` : "-"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {log.ipAddress || "127.0.0.1"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logsPage && logsPage.totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-medinex-border flex items-center justify-between text-xs text-medinex-muted">
            <span>
              Page {logsPage.number + 1} of {logsPage.totalPages} ({logsPage.totalElements} total entries)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={logsPage.first || loading}
                className="text-xs h-8"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={logsPage.last || loading}
                className="text-xs h-8"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
