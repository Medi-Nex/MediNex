"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  EyeOff,
  UserX,
  Bell,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { authApi } from "@/lib/api/auth";
import { getBlockedUsers, unblockUser, BlockedUserDto } from "@/lib/api/follow";

export default function DashboardSettingsPage() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const router = useRouter();

  // Privacy State
  const [isPrivateProfile, setIsPrivateProfile] = useState<boolean>(false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState<boolean>(false);
  const [privacySuccess, setPrivacySuccess] = useState<string | null>(null);

  // Blocked Users State
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserDto[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState<boolean>(true);
  const [unblockingUsername, setUnblockingUsername] = useState<string | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isChangingPassword, startChangingPassword] = useTransition();
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Notification Preferences State (Local in-app preferences)
  const [emailAlerts, setEmailAlerts] = useState<boolean>(true);
  const [followAlerts, setFollowAlerts] = useState<boolean>(true);
  const [commentAlerts, setCommentAlerts] = useState<boolean>(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setIsPrivateProfile(user.isPublicVisible === false);
      loadBlockedUsers();
    }
  }, [user]);

  const loadBlockedUsers = async () => {
    setIsLoadingBlocks(true);
    try {
      const data = await getBlockedUsers();
      setBlockedUsers(data || []);
    } catch {
      // Non-blocking error
    } finally {
      setIsLoadingBlocks(false);
    }
  };

  const handleTogglePrivacy = async () => {
    const nextPrivateState = !isPrivateProfile;
    setIsUpdatingPrivacy(true);
    setPrivacySuccess(null);
    try {
      await authApi.updateProfile({
        isPublicVisible: !nextPrivateState,
      });
      setIsPrivateProfile(nextPrivateState);
      await refreshUser();
      setPrivacySuccess(
        nextPrivateState
          ? "Profile set to Private. New followers must now submit a Follow Request."
          : "Profile set to Public. Other innovators can now follow you directly."
      );
    } catch {
      // Revert on error
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleUnblock = async (username: string) => {
    setUnblockingUsername(username);
    try {
      await unblockUser(username);
      setBlockedUsers((prev) => prev.filter((b) => b.username !== username));
    } catch {
      // Error handling
    } finally {
      setUnblockingUsername(null);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password confirmation does not match.");
      return;
    }

    startChangingPassword(async () => {
      try {
        await authApi.changePassword({
          currentPassword,
          newPassword,
        });
        setPasswordSuccess("Password updated successfully. Other active sessions revoked for security.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to change password";
        setPasswordError(msg);
      }
    });
  };

  if (isLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-medinex-teal border-t-transparent rounded-full mx-auto" />
        <p className="text-xs text-medinex-muted mt-3">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-medinex-light pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-medinex-border py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-medinex-teal hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-medinex-text tracking-tight">
                Account & Privacy Settings
              </h1>
              <p className="text-xs text-medinex-muted mt-1">
                Manage relational follower policies, blocklists, password security, and notifications
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/following">
                <Button variant="outline" size="sm" className="text-xs">
                  Following Network
                </Button>
              </Link>
              <Link href="/dashboard/profile">
                <Button variant="primary" size="sm" className="text-xs">
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Section 1: Relational Privacy & Follower Rules */}
        <Card className="border border-medinex-border">
          <CardHeader className="bg-slate-50/80 border-b border-medinex-border p-5">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-medinex-teal" />
              <div>
                <h2 className="text-sm font-bold text-medinex-text">Profile Privacy & Follow Policy</h2>
                <p className="text-[11px] text-medinex-muted">
                  Control how other innovators connect with your account
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-6 space-y-4">
            {privacySuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{privacySuccess}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white border border-medinex-border gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-medinex-text">
                    {isPrivateProfile ? "Private Profile Mode" : "Public Community Profile"}
                  </span>
                  <Badge variant={isPrivateProfile ? "warning" : "mint"} className="text-[10px] py-0">
                    {isPrivateProfile ? "Private" : "Public"}
                  </Badge>
                </div>
                <p className="text-xs text-medinex-muted max-w-lg leading-relaxed">
                  {isPrivateProfile
                    ? "When private, new followers cannot follow you immediately. They must submit a Follow Request that you can review, accept, or reject under your Following Network."
                    : "When public, any community innovator can follow your profile updates directly without requiring manual confirmation."}
                </p>
              </div>

              <Button
                variant={isPrivateProfile ? "outline" : "primary"}
                size="sm"
                onClick={handleTogglePrivacy}
                disabled={isUpdatingPrivacy}
                className="shrink-0 text-xs"
              >
                {isUpdatingPrivacy ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : isPrivateProfile ? (
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                )}
                {isPrivateProfile ? "Make Profile Public" : "Switch to Private"}
              </Button>
            </div>

            <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-100 text-[11px] text-slate-600 space-y-1">
              <div className="font-semibold text-medinex-teal flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>MediNex Privacy Invariant</span>
              </div>
              <p>
                Switching between public and private maintains all your existing follower relationships. Only future follow attempts will follow the new policy.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Section 2: Blocked Accounts & Safety Controls */}
        <Card className="border border-medinex-border">
          <CardHeader className="bg-slate-50/80 border-b border-medinex-border p-5">
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-600" />
              <div>
                <h2 className="text-sm font-bold text-medinex-text">Blocked Innovator Accounts</h2>
                <p className="text-[11px] text-medinex-muted">
                  Blocked accounts cannot follow, view private posts, or interact with you
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            {isLoadingBlocks ? (
              <div className="py-8 text-center text-xs text-medinex-muted">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-medinex-teal" />
                Loading blocked accounts...
              </div>
            ) : blockedUsers.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-medinex-border">
                <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-xs font-bold text-medinex-text">No Blocked Accounts</h3>
                <p className="text-[11px] text-medinex-muted mt-1 max-w-sm mx-auto">
                  You have not blocked any community members. You can block any account directly from their public profile card.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-medinex-border">
                {blockedUsers.map((b) => (
                  <div key={b.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-xs text-medinex-text">{b.fullName}</div>
                      <div className="text-[11px] text-medinex-teal font-mono">@{b.username}</div>
                      {b.reason && (
                        <div className="text-[10px] text-slate-400 mt-0.5">Reason: {b.reason}</div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblock(b.username)}
                      disabled={unblockingUsername === b.username}
                      className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {unblockingUsername === b.username ? "Unblocking..." : "Unblock"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Section 3: Password & Security */}
        <Card className="border border-medinex-border">
          <CardHeader className="bg-slate-50/80 border-b border-medinex-border p-5">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-medinex-teal" />
              <div>
                <h2 className="text-sm font-bold text-medinex-text">Password & Authentication Security</h2>
                <p className="text-[11px] text-medinex-muted">
                  Update your account password and rotate session security tokens
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
              {passwordError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-medinex-text mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-medinex-border focus:outline-none focus:border-medinex-teal"
                  placeholder="••••••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-medinex-text mb-1">
                  New Password (Min. 8 characters)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-medinex-border focus:outline-none focus:border-medinex-teal"
                  placeholder="••••••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-medinex-text mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-medinex-border focus:outline-none focus:border-medinex-teal"
                  placeholder="••••••••••••"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isChangingPassword}
                className="text-xs"
              >
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                {isChangingPassword ? "Updating Password..." : "Update Password"}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Section 4: Notification Preferences */}
        <Card className="border border-medinex-border">
          <CardHeader className="bg-slate-50/80 border-b border-medinex-border p-5">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-medinex-teal" />
              <div>
                <h2 className="text-sm font-bold text-medinex-text">Notification Channels</h2>
                <p className="text-[11px] text-medinex-muted">
                  Configure delivery preferences for social and team events
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-medinex-border">
              <div>
                <span className="text-xs font-semibold text-medinex-text block">
                  Follow Requests & New Follower Alerts
                </span>
                <span className="text-[11px] text-medinex-muted">
                  Notify when an innovator follows you or requests to follow your private profile
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFollowAlerts(!followAlerts)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  followAlerts ? "bg-medinex-teal" : "bg-slate-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                    followAlerts ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-medinex-border">
              <div>
                <span className="text-xs font-semibold text-medinex-text block">
                  Discussion Comments & Nested Replies
                </span>
                <span className="text-[11px] text-medinex-muted">
                  Notify when someone replies to your post or comment thread
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCommentAlerts(!commentAlerts)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  commentAlerts ? "bg-medinex-teal" : "bg-slate-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                    commentAlerts ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-medinex-border">
              <div>
                <span className="text-xs font-semibold text-medinex-text block">
                  Official Team Announcements & Milestones
                </span>
                <span className="text-[11px] text-medinex-muted">
                  Priority notifications for E-Health Hackathon 2026 milestones and ShasthoSetu updates
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEmailAlerts(!emailAlerts)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  emailAlerts ? "bg-medinex-teal" : "bg-slate-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${
                    emailAlerts ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
