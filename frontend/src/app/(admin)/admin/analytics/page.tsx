"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getAdminAnalytics, AdminAnalytics } from "@/lib/api/admin";

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminAnalytics();
      setAnalytics(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load platform analytics";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-medinex-text tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-medinex-teal" />
            <span>Platform Growth & Moderation Analytics</span>
          </h1>
          <p className="text-xs text-medinex-muted mt-1">
            Authoritative, real-time database metrics detailing innovator adoption, discourse engagement, and safety compliance.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAnalytics}
          disabled={loading}
          className="text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Analytics</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !analytics ? (
        <div className="p-16 text-center text-medinex-muted">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-medinex-teal" />
          <span className="text-xs">Querying database aggregation pipelines...</span>
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          {/* Section 1: User & Network Metrics */}
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-medinex-teal" />
              <span>Identity & Community Adoption</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border border-medinex-border">
                <CardBody className="p-4 space-y-1">
                  <span className="text-xs text-medinex-muted font-medium">Total Registered Users</span>
                  <div className="text-2xl font-black text-medinex-text">{analytics.totalUsers}</div>
                  <span className="text-[10px] text-slate-400">Unique accounts in PostgreSQL</span>
                </CardBody>
              </Card>

              <Card className="border border-medinex-border">
                <CardBody className="p-4 space-y-1">
                  <span className="text-xs text-medinex-muted font-medium">Active Accounts</span>
                  <div className="text-2xl font-black text-emerald-600">{analytics.activeUsers}</div>
                  <span className="text-[10px] text-slate-400">Verified and in good standing</span>
                </CardBody>
              </Card>

              <Card className="border border-medinex-border">
                <CardBody className="p-4 space-y-1">
                  <span className="text-xs text-medinex-muted font-medium">Pending Verification</span>
                  <div className="text-2xl font-black text-amber-600">{analytics.pendingVerificationUsers}</div>
                  <span className="text-[10px] text-slate-400">Awaiting token confirmation</span>
                </CardBody>
              </Card>

              <Card className="border border-medinex-border">
                <CardBody className="p-4 space-y-1">
                  <span className="text-xs text-medinex-muted font-medium">Total Follow Relationships</span>
                  <div className="text-2xl font-black text-medinex-teal">{analytics.totalFollows}</div>
                  <span className="text-[10px] text-slate-400">Team & user connection graphs</span>
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Section 2: Discourse & Engagement */}
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-medinex-teal" />
              <span>Technical Discourse & Discourse Activity</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border border-medinex-border">
                <CardBody className="p-4 space-y-1">
                  <span className="text-xs text-medinex-muted font-medium">Published Posts</span>
                  <div className="text-2xl font-black text-medinex-text">{analytics.totalPosts}</div>
                  <span className="text-[10px] text-slate-400">Community discussion topics</span>
                </CardBody>
              </Card>

              <Card className="border border-medinex-border">
                <CardBody className="p-4 space-y-1">
                  <span className="text-xs text-medinex-muted font-medium">Total Comments</span>
                  <div className="text-2xl font-black text-slate-800">{analytics.totalComments}</div>
                  <span className="text-[10px] text-slate-400">Peer feedback and replies</span>
                </CardBody>
              </Card>

              <Card className="border border-medinex-border">
                <CardBody className="p-4 space-y-1">
                  <span className="text-xs text-medinex-muted font-medium">Media Assets Stored</span>
                  <div className="text-2xl font-black text-teal-700">{analytics.totalMedia}</div>
                  <span className="text-[10px] text-slate-400">Technical architectural attachments</span>
                </CardBody>
              </Card>

              <Card className="border border-medinex-border">
                <CardBody className="p-4 space-y-1">
                  <span className="text-xs text-medinex-muted font-medium">Hidden by Moderation</span>
                  <div className="text-2xl font-black text-amber-700">
                    {analytics.hiddenPosts + analytics.hiddenComments}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {analytics.hiddenPosts} posts, {analytics.hiddenComments} comments
                  </span>
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Section 3: Safety & Auditing Compliance */}
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-medinex-teal" />
              <span>Safety, Moderation & Audit Trail</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border border-medinex-border">
                <CardBody className="p-4 space-y-1">
                  <span className="text-xs text-medinex-muted font-medium">Pending Reports</span>
                  <div className="text-2xl font-black text-rose-600">{analytics.pendingReports}</div>
                  <span className="text-[10px] text-slate-400">Requiring moderator investigation</span>
                </CardBody>
              </Card>

              <Card className="border border-medinex-border">
                <CardBody className="p-4 space-y-1">
                  <span className="text-xs text-medinex-muted font-medium">Resolved Reports</span>
                  <div className="text-2xl font-black text-emerald-600">{analytics.resolvedReports}</div>
                  <span className="text-[10px] text-slate-400">Actions taken by moderators</span>
                </CardBody>
              </Card>

              <Card className="border border-medinex-border">
                <CardBody className="p-4 space-y-1">
                  <span className="text-xs text-medinex-muted font-medium">Dismissed Reports</span>
                  <div className="text-2xl font-black text-slate-600">{analytics.dismissedReports}</div>
                  <span className="text-[10px] text-slate-400">Deemed compliant with guidelines</span>
                </CardBody>
              </Card>

              <Card className="border border-medinex-border">
                <CardBody className="p-4 space-y-1">
                  <span className="text-xs text-medinex-muted font-medium">Audit Trail Entries</span>
                  <div className="text-2xl font-black text-medinex-teal">{analytics.totalAuditLogs}</div>
                  <span className="text-[10px] text-slate-400">Immutable security events logged</span>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
