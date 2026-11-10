"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Edit3,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";

export default function DashboardOverviewPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-medinex-teal border-t-transparent rounded-full mx-auto" />
        <p className="text-xs text-medinex-muted mt-3">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-medinex-light pb-20">
      {/* Top Header */}
      <section className="bg-medinex-dark text-white py-12 border-b border-emerald-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-medinex-mint uppercase tracking-wider font-semibold">
                Community Dashboard
              </span>
              {user.isTeamMember && <Badge variant="teal" size="sm">Team Member</Badge>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user.fullName}
            </h1>
            <p className="text-xs text-slate-400">@{user.username} &bull; {user.email}</p>
          </div>

          <div>
            <Link href="/dashboard/profile">
              <Button variant="primary" size="sm" className="inline-flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Email verification alert if pending */}
        {!user.emailVerified && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Account Pending Email Verification:</strong> Please confirm your email address to
                unlock full community publishing privileges.
              </div>
            </div>
            <Link href="/verify-email">
              <Button variant="outline" size="sm" className="border-amber-400 text-amber-900 shrink-0">
                Verify Now
              </Button>
            </Link>
          </div>
        )}

        {/* Real Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardBody className="p-5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Followers
              </span>
              <div className="text-2xl font-extrabold text-medinex-text mt-1">0</div>
              <span className="text-[10px] text-slate-500">Real Database Count</span>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Following
              </span>
              <div className="text-2xl font-extrabold text-medinex-text mt-1">0</div>
              <span className="text-[10px] text-slate-500">Accounts Followed</span>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Published Posts
              </span>
              <div className="text-2xl font-extrabold text-medinex-text mt-1">0</div>
              <span className="text-[10px] text-slate-500">Community Posts</span>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Account Status
              </span>
              <div className="text-sm font-bold text-medinex-teal mt-2">{user.status}</div>
              <span className="text-[10px] text-slate-500">
                {user.emailVerified ? "Verified Member" : "Unverified"}
              </span>
            </CardBody>
          </Card>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="bg-slate-50/70">
              <h2 className="font-bold text-sm text-medinex-text">Explore the Community</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Interact with the official six-contributor squad, review official updates, or publish
                your technical feedback on ShasthoSetu.
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <Link href="/team">
                  <Button variant="outline" size="sm">
                    Meet the 6 Contributors
                  </Button>
                </Link>
                <Link href="/community">
                  <Button variant="primary" size="sm">
                    Open Community Feed
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="bg-slate-50/70">
              <h2 className="font-bold text-sm text-medinex-text">Assigned Role Authorities</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {user.roles.map((role) => (
                  <Badge key={role} variant={role.includes("ADMIN") ? "teal" : "neutral"} size="sm">
                    {role}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                RBAC permissions govern your moderation abilities, project configuration access, and
                official update broadcast rights.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
