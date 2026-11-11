"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Users, 
  ShieldCheck, 
  Building2, 
  GraduationCap, 
  ArrowRight, 
  UserCheck, 
  Clock, 
  Check, 
  X, 
  Loader2,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { getUserProfileHref } from "@/lib/media";
import { 
  getTeamFollowStats, 
  getUserFollowing, 
  getPendingFollowRequests, 
  acceptFollowRequest, 
  rejectFollowRequest,
  FollowUserDto, 
  FollowRequestDto 
} from "@/lib/api/follow";
import { FollowButton } from "@/components/follow/FollowButton";

export default function DashboardFollowingPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"team" | "users" | "requests">("team");
  const [teamStats, setTeamStats] = useState<{ followerCount: number; isFollowing: boolean }>({
    followerCount: 0,
    isFollowing: false,
  });
  const [followedUsers, setFollowedUsers] = useState<FollowUserDto[]>([]);
  const [followRequests, setFollowRequests] = useState<FollowRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [tStats, usersPage, reqsPage] = await Promise.allSettled([
        getTeamFollowStats(),
        getUserFollowing(user.username),
        getPendingFollowRequests(),
      ]);

      if (tStats.status === "fulfilled") {
        setTeamStats(tStats.value);
      }
      if (usersPage.status === "fulfilled") {
        setFollowedUsers(usersPage.value.content);
      }
      if (reqsPage.status === "fulfilled") {
        setFollowRequests(reqsPage.value.content);
      }
    } catch (err) {
      console.error("Failed to load following data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user, loadData]);

  const handleAcceptRequest = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      await acceptFollowRequest(requestId);
      setFollowRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      console.error("Failed to accept follow request:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      await rejectFollowRequest(requestId);
      setFollowRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      console.error("Failed to reject follow request:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (authLoading || (loading && !teamStats.followerCount && followedUsers.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
        <p className="text-sm text-slate-500">Loading your follow network...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-medinex-light pb-24 md:pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12201E] tracking-tight">
          Following & Network
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Manage your connections with the official MediNex team and health innovators.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 sm:gap-6 overflow-x-auto no-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveTab("team")}
          className={`shrink-0 pb-3 px-0.5 text-sm font-semibold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "team"
              ? "border-[#0D9488] text-[#0D9488]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Official Team
          {teamStats.isFollowing && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-teal-100 text-teal-800">
              Active
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`shrink-0 pb-3 px-0.5 text-sm font-semibold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "users"
              ? "border-[#0D9488] text-[#0D9488]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" />
          Innovators & Members
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
            {followedUsers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("requests")}
          className={`shrink-0 pb-3 px-0.5 text-sm font-semibold transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "requests"
              ? "border-[#0D9488] text-[#0D9488]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Clock className="w-4 h-4" />
          Follow Requests
          {followRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-bold">
              {followRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab: Official Team */}
      {activeTab === "team" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#063D38] to-[#0D9488] text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-md shrink-0">
                M
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-[#12201E]">MediNex Official Squad</h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/60">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" />
                    Official Account
                  </span>
                </div>
                <p className="text-sm text-slate-600 max-w-xl">
                  &ldquo;Connecting Technology, Research &amp; Healthcare Innovation.&rdquo; Multidisciplinary team collaborating on healthcare technology and ShasthoSetu.
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-2 text-xs text-slate-500">
                  <span><span className="font-semibold text-slate-900">{teamStats.followerCount}</span> Followers</span>
                  <span>&bull;</span>
                  <span>6 Core Contributors</span>
                  <span>&bull;</span>
                  <Link href="/team" className="text-[#0D9488] hover:underline font-medium inline-flex items-center gap-1">
                    Meet the squad <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="shrink-0 pt-2 sm:pt-0">
              <FollowButton
                targetType="team"
                initialIsFollowing={teamStats.isFollowing}
                size="md"
                onFollowChange={(isFollowing, delta) => {
                  setTeamStats((prev) => ({
                    isFollowing,
                    followerCount: Math.max(0, prev.followerCount + delta),
                  }));
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Followed Innovators */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {followedUsers.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#12201E]">You aren&apos;t following anyone yet</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Explore the MediNex six-contributor engineering team and community innovators to stay informed about their healthcare breakthroughs.
              </p>
              <div className="pt-2">
                <Link
                  href="/team"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#0D9488] text-white hover:bg-[#063D38] transition-all shadow-sm"
                >
                  Explore Contributor Profiles
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {followedUsers.map((u) => (
                <div
                  key={u.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-3.5 sm:gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <UserAvatar
                      src={u.avatarUrl}
                      smSrc={u.avatarSmUrl}
                      lgSrc={u.avatarLgUrl}
                      fullName={u.fullName}
                      username={u.username}
                      size="md"
                      clickable
                      className="w-12 h-12"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={getUserProfileHref(u.username)}
                          className="font-bold text-sm text-[#12201E] hover:text-[#0D9488] transition-colors"
                        >
                          {u.fullName}
                        </Link>
                        {u.isVerifiedContributor && (
                          <span title="Verified Contributor">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" />
                          </span>
                        )}
                      </div>
                      <Link
                        href={getUserProfileHref(u.username)}
                        className="text-xs text-slate-500 font-mono hover:text-[#0D9488] transition-colors block"
                      >
                        @{u.username}
                      </Link>
                      {u.designation && (
                        <p className="text-xs text-slate-600 line-clamp-1 flex items-center gap-1 pt-1">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          {u.designation}
                        </p>
                      )}
                    </div>
                  </div>

                  <FollowButton
                    targetType="user"
                    username={u.username}
                    initialIsFollowing={true}
                    size="sm"
                    onFollowChange={(isFollowing) => {
                      if (!isFollowing) {
                        setFollowedUsers((prev) => prev.filter((item) => item.username !== u.username));
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Follow Requests */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {followRequests.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-2">
              <UserCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-[#12201E]">No pending follow requests</h3>
              <p className="text-sm text-slate-500">
                When people request to follow your private profile, they will appear here for review.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100 shadow-sm overflow-hidden">
              {followRequests.map((req) => (
                <div key={req.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <UserAvatar
                      src={req.requester.avatarUrl}
                      smSrc={req.requester.avatarSmUrl}
                      lgSrc={req.requester.avatarLgUrl}
                      fullName={req.requester.fullName}
                      username={req.requester.username}
                      size="md"
                      clickable
                    />
                    <div>
                      <Link
                        href={getUserProfileHref(req.requester.username)}
                        className="font-bold text-sm text-[#12201E] hover:text-[#0D9488] transition-colors block"
                      >
                        {req.requester.fullName}
                      </Link>
                      <Link
                        href={getUserProfileHref(req.requester.username)}
                        className="text-xs text-slate-500 font-mono hover:text-[#0D9488] transition-colors"
                      >
                        @{req.requester.username}
                      </Link>
                      {req.requester.designation && (
                        <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                          <GraduationCap className="w-3 h-3 text-slate-400" />
                          {req.requester.designation}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      disabled={actionLoadingId === req.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0D9488] text-white hover:bg-[#063D38] transition-all disabled:opacity-50"
                    >
                      {actionLoadingId === req.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      disabled={actionLoadingId === req.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
