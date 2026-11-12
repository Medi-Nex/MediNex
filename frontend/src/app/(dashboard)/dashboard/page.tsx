"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Edit3,
  Users,
  Bell,
  Settings,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useAuth } from "@/lib/auth-context";
import { getUserFollowStats } from "@/lib/api/follow";
import { getUserPosts } from "@/lib/api/community";
import { getUserProfileHref } from "@/lib/media";

export default function DashboardOverviewPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [followStats, setFollowStats] = useState<{ followerCount: number; followingCount: number }>({
    followerCount: 0,
    followingCount: 0,
  });
  const [postsCount, setPostsCount] = useState<number>(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      getUserFollowStats(user.username)
        .then((stats) => {
          setFollowStats({
            followerCount: stats.followerCount,
            followingCount: stats.followingCount,
          });
        })
        .catch(() => {});

      getUserPosts(user.username, 0, 1)
        .then((page) => {
          setPostsCount(page.totalElements ?? page.content?.length ?? 0);
        })
        .catch(() => {});
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-medinex-teal border-t-transparent rounded-full mx-auto" />
        <p className="text-xs text-medinex-muted mt-3">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-medinex-light pb-24 md:pb-20">
      {/* Top Header */}
      <section className="bg-medinex-dark bg-hero-mesh text-white py-8 sm:py-12 border-b border-emerald-950 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <UserAvatar
              src={user.avatarUrl}
              smSrc={user.avatarSmUrl}
              lgSrc={user.avatarLgUrl}
              fullName={user.fullName}
              username={user.username}
              size="lg"
              shape="rounded"
              clickable
            />
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] sm:text-xs text-medinex-mint uppercase tracking-wider font-semibold">
                  Community Dashboard
                </span>
                {user.isTeamMember && <Badge variant="teal" size="sm">Team Member</Badge>}
              </div>
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight truncate">
                Welcome back, {user.fullName}
              </h1>
              <p className="text-xs text-slate-400 truncate">@{user.username} &bull; {user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
            <Link href={getUserProfileHref(user.username)}>
              <Button variant="dark" size="sm" className="inline-flex items-center gap-1.5 border-emerald-700/80 text-white hover:text-white hover:border-medinex-mint/50">
                <ExternalLink className="w-3.5 h-3.5 text-medinex-mint" />
                <span>Public Profile</span>
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="dark" size="sm" className="inline-flex items-center gap-1.5 border-emerald-700/80 text-white hover:text-white hover:border-medinex-mint/50">
                <Settings className="w-3.5 h-3.5 text-medinex-mint" />
                <span>Settings</span>
              </Button>
            </Link>
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
            <Link href={`/verify-email?email=${encodeURIComponent(user.email)}`}>
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
              <div className="text-2xl font-extrabold text-medinex-text mt-1">{followStats.followerCount}</div>
              <span className="text-[10px] text-slate-500">Real Database Count</span>
            </CardBody>
          </Card>

          <Link href="/dashboard/following">
            <Card className="hover:border-teal-500/50 transition-colors cursor-pointer">
              <CardBody className="p-5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  Following
                  <Users className="w-3.5 h-3.5 text-teal-600" />
                </span>
                <div className="text-2xl font-extrabold text-medinex-text mt-1">{followStats.followingCount}</div>
                <span className="text-[10px] text-teal-600 font-medium">Manage Network &rarr;</span>
              </CardBody>
            </Card>
          </Link>

          <Card>
            <CardBody className="p-5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Published Posts
              </span>
              <div className="text-2xl font-extrabold text-medinex-text mt-1">{postsCount}</div>
              <span className="text-[10px] text-slate-500">Community Posts</span>
            </CardBody>
          </Card>

          <Link href="/dashboard/notifications">
            <Card className="hover:border-teal-500/50 transition-colors cursor-pointer">
              <CardBody className="p-5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  Notifications
                  <Bell className="w-3.5 h-3.5 text-teal-600" />
                </span>
                <div className="text-sm font-bold text-medinex-teal mt-2">Active Stream</div>
                <span className="text-[10px] text-teal-600 font-medium">View Alerts &rarr;</span>
              </CardBody>
            </Card>
          </Link>
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
