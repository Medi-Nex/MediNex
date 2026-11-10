"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Flag,
  FileText,
  Activity,
  Heart,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  MessageCircle,
  Layers,
  Image as ImageIcon,
  BarChart3,
  Settings,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getAdminStats,
  getAdminAuditLogs,
  AdminStats,
  AuditLogItem,
} from "@/lib/api/admin";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, logsData] = await Promise.all([
        getAdminStats(),
        getAdminAuditLogs(0, 5),
      ]);
      setStats(statsData);
      setRecentLogs(logsData.content || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load admin metrics";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-medinex-text tracking-tight">
            System Administration Overview
          </h1>
          <p className="text-xs text-medinex-muted mt-1">
            Real-time metrics, platform health indicators, and high-privilege operations
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Metrics
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Users */}
        <Card className="border border-medinex-border hover:border-emerald-300 transition-colors">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-medinex-muted uppercase tracking-wider">
                Total Users
              </span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-medinex-teal flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold text-medinex-text">
              {loading ? "..." : (stats?.totalUsers ?? 0)}
            </div>
            <p className="text-[11px] text-medinex-muted mt-1">
              Registered innovators across all role tiers
            </p>
          </CardBody>
        </Card>

        {/* Team Followers */}
        <Card className="border border-medinex-border hover:border-emerald-300 transition-colors">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-medinex-muted uppercase tracking-wider">
                Official Team Followers
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold text-medinex-text">
              {loading ? "..." : (stats?.totalTeamFollowers ?? 0)}
            </div>
            <p className="text-[11px] text-medinex-muted mt-1">
              Active followers of the official MediNex squad
            </p>
          </CardBody>
        </Card>

        {/* Member Followers */}
        <Card className="border border-medinex-border hover:border-emerald-300 transition-colors">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-medinex-muted uppercase tracking-wider">
                User-to-User Follows
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold text-medinex-text">
              {loading ? "..." : (stats?.totalMemberFollowers ?? 0)}
            </div>
            <p className="text-[11px] text-medinex-muted mt-1">
              Relational peer follows among community members
            </p>
          </CardBody>
        </Card>

        {/* Community Posts */}
        <Card className="border border-medinex-border hover:border-emerald-300 transition-colors">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-medinex-muted uppercase tracking-wider">
                Community Posts
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold text-medinex-text">
              {loading ? "..." : (stats?.totalPosts ?? 0)}
            </div>
            <p className="text-[11px] text-medinex-muted mt-1">
              Total published posts and updates in feed
            </p>
          </CardBody>
        </Card>

        {/* Pending Reports */}
        <Card className="border border-medinex-border hover:border-amber-300 transition-colors">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-medinex-muted uppercase tracking-wider">
                Pending Reports
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Flag className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold text-medinex-text flex items-center gap-2">
              {loading ? "..." : (stats?.pendingReportsCount ?? 0)}
              {(stats?.pendingReportsCount ?? 0) > 0 && (
                <Badge variant="warning" className="text-[10px] py-0">Action Needed</Badge>
              )}
            </div>
            <p className="text-[11px] text-medinex-muted mt-1">
              Unresolved content and user moderation tickets
            </p>
          </CardBody>
        </Card>

        {/* Audit Logs Count */}
        <Card className="border border-medinex-border hover:border-emerald-300 transition-colors">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-medinex-muted uppercase tracking-wider">
                Audit Trail Entries
              </span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold text-medinex-text">
              {loading ? "..." : (stats?.totalAuditLogs ?? 0)}
            </div>
            <p className="text-[11px] text-medinex-muted mt-1">
              Immutable security and administrative events recorded
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Quick Access Modules */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Administrative & Moderation Capabilities
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Link href="/admin/users" className="group">
            <div className="p-4 rounded-2xl bg-white border border-medinex-border group-hover:border-medinex-teal transition-all shadow-xs h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-medinex-teal flex items-center justify-center group-hover:bg-medinex-teal group-hover:text-white transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-medinex-teal transition-all" />
              </div>
              <div className="mt-3">
                <h3 className="font-bold text-xs text-medinex-text">Innovator Accounts</h3>
                <p className="text-[11px] text-medinex-muted mt-0.5">User status, security roles</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/team" className="group">
            <div className="p-4 rounded-2xl bg-white border border-medinex-border group-hover:border-medinex-teal transition-all shadow-xs h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <UserCheck className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-medinex-teal transition-all" />
              </div>
              <div className="mt-3">
                <h3 className="font-bold text-xs text-medinex-text">Team Contributors</h3>
                <p className="text-[11px] text-medinex-muted mt-0.5">Verified roster & ordering</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/posts" className="group">
            <div className="p-4 rounded-2xl bg-white border border-medinex-border group-hover:border-medinex-teal transition-all shadow-xs h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-medinex-teal transition-all" />
              </div>
              <div className="mt-3">
                <h3 className="font-bold text-xs text-medinex-text">Post Moderation</h3>
                <p className="text-[11px] text-medinex-muted mt-0.5">Audit discussions & hides</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/comments" className="group">
            <div className="p-4 rounded-2xl bg-white border border-medinex-border group-hover:border-medinex-teal transition-all shadow-xs h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-medinex-teal transition-all" />
              </div>
              <div className="mt-3">
                <h3 className="font-bold text-xs text-medinex-text">Comment Moderation</h3>
                <p className="text-[11px] text-medinex-muted mt-0.5">Feedback & nested threads</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/projects" className="group">
            <div className="p-4 rounded-2xl bg-white border border-medinex-border group-hover:border-medinex-teal transition-all shadow-xs h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#063D38] flex items-center justify-center group-hover:bg-[#063D38] group-hover:text-white transition-colors">
                  <Layers className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-medinex-teal transition-all" />
              </div>
              <div className="mt-3">
                <h3 className="font-bold text-xs text-medinex-text">Project Governance</h3>
                <p className="text-[11px] text-medinex-muted mt-0.5">ShasthoSetu specifications</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/media" className="group">
            <div className="p-4 rounded-2xl bg-white border border-medinex-border group-hover:border-medinex-teal transition-all shadow-xs h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-medinex-teal flex items-center justify-center group-hover:bg-medinex-teal group-hover:text-white transition-colors">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-medinex-teal transition-all" />
              </div>
              <div className="mt-3">
                <h3 className="font-bold text-xs text-medinex-text">Media Asset Review</h3>
                <p className="text-[11px] text-medinex-muted mt-0.5">Diagnostic & image uploads</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/reports" className="group">
            <div className="p-4 rounded-2xl bg-white border border-medinex-border group-hover:border-amber-400 transition-all shadow-xs h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Flag className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-amber-500 transition-all" />
              </div>
              <div className="mt-3">
                <h3 className="font-bold text-xs text-medinex-text">Moderation Queue</h3>
                <p className="text-[11px] text-medinex-muted mt-0.5">User & content report tickets</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/analytics" className="group">
            <div className="p-4 rounded-2xl bg-white border border-medinex-border group-hover:border-medinex-teal transition-all shadow-xs h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-medinex-teal transition-all" />
              </div>
              <div className="mt-3">
                <h3 className="font-bold text-xs text-medinex-text">Platform Analytics</h3>
                <p className="text-[11px] text-medinex-muted mt-0.5">Database growth metrics</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/audit-logs" className="group">
            <div className="p-4 rounded-2xl bg-white border border-medinex-border group-hover:border-medinex-teal transition-all shadow-xs h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-slate-800 transition-all" />
              </div>
              <div className="mt-3">
                <h3 className="font-bold text-xs text-medinex-text">Audit Trail</h3>
                <p className="text-[11px] text-medinex-muted mt-0.5">Immutable compliance log</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/settings" className="group">
            <div className="p-4 rounded-2xl bg-white border border-medinex-border group-hover:border-medinex-teal transition-all shadow-xs h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
                  <Settings className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-slate-800 transition-all" />
              </div>
              <div className="mt-3">
                <h3 className="font-bold text-xs text-medinex-text">Site Settings</h3>
                <p className="text-[11px] text-medinex-muted mt-0.5">Runtime & zero-PHI flags</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Security & Moderation Activity */}
      <Card className="border border-medinex-border">
        <CardHeader className="flex flex-row items-center justify-between border-b border-medinex-border p-5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-medinex-teal" />
            <h2 className="text-sm font-bold text-medinex-text">Recent Administrative Audit Events</h2>
          </div>
          <Link href="/admin/audit-logs" className="text-xs text-medinex-teal hover:underline font-semibold flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardBody className="p-0">
          {recentLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-medinex-muted">
              No recent audit events recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-medinex-border">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Timestamp (UTC)</th>
                    <th className="py-2.5 px-4 font-semibold">Actor</th>
                    <th className="py-2.5 px-4 font-semibold">Action</th>
                    <th className="py-2.5 px-4 font-semibold">Target Entity</th>
                    <th className="py-2.5 px-4 font-semibold">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-medinex-border">
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {log.actorEmail || log.actorId || "System"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="mint" className="font-mono text-[10px] py-0">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {log.targetEntity || "-"} {log.targetId ? `(${log.targetId.slice(0, 8)}...)` : ""}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {log.ipAddress || "127.0.0.1"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
