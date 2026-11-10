"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserCheck, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { followUser, unfollowUser, followTeam, unfollowTeam } from "@/lib/api/follow";

interface FollowButtonProps {
  targetType?: "user" | "team";
  username?: string;
  initialIsFollowing?: boolean;
  initialHasPendingRequest?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  onFollowChange?: (isFollowing: boolean, followerDelta: number) => void;
}

export function FollowButton({
  targetType = "user",
  username,
  initialIsFollowing = false,
  initialHasPendingRequest = false,
  size = "md",
  className = "",
  onFollowChange,
}: FollowButtonProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [hasPendingRequest, setHasPendingRequest] = useState(initialHasPendingRequest);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // If user is viewing their own profile, hide follow button
  if (targetType === "user" && user && username && user.username.toLowerCase() === username.toLowerCase()) {
    return null;
  }

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setLoading(true);
    try {
      if (targetType === "team") {
        if (isFollowing) {
          const stats = await unfollowTeam();
          setIsFollowing(stats.isFollowing);
          onFollowChange?.(stats.isFollowing, -1);
        } else {
          const stats = await followTeam();
          setIsFollowing(stats.isFollowing);
          onFollowChange?.(stats.isFollowing, 1);
        }
      } else if (username) {
        if (isFollowing || hasPendingRequest) {
          const stats = await unfollowUser(username);
          setIsFollowing(stats.isFollowing);
          setHasPendingRequest(stats.hasPendingRequest);
          onFollowChange?.(stats.isFollowing, isFollowing ? -1 : 0);
        } else {
          const stats = await followUser(username);
          setIsFollowing(stats.isFollowing);
          setHasPendingRequest(stats.hasPendingRequest);
          onFollowChange?.(stats.isFollowing, stats.isFollowing ? 1 : 0);
        }
      }
    } catch (err) {
      console.error("Failed to toggle follow state:", err);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs font-semibold rounded-lg",
    md: "px-4 py-2 text-sm font-semibold rounded-xl",
    lg: "px-6 py-2.5 text-base font-semibold rounded-xl",
  }[size];

  if (hasPendingRequest) {
    return (
      <button
        type="button"
        onClick={handleFollowToggle}
        disabled={loading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`inline-flex items-center gap-1.5 border transition-all ${sizeClasses} ${
          isHovered
            ? "border-rose-300 bg-rose-50/80 text-rose-700"
            : "border-slate-300 bg-slate-100 text-slate-700"
        } ${className}`}
        title={isHovered ? "Cancel follow request" : "Follow request sent"}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isHovered ? (
          "Cancel Request"
        ) : (
          <>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Requested</span>
          </>
        )}
      </button>
    );
  }

  if (isFollowing) {
    return (
      <button
        type="button"
        onClick={handleFollowToggle}
        disabled={loading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`inline-flex items-center gap-1.5 border transition-all ${sizeClasses} ${
          isHovered
            ? "border-rose-300 bg-rose-50 text-rose-700 shadow-sm"
            : "border-teal-600/30 bg-teal-50 text-teal-800 shadow-sm"
        } ${className}`}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isHovered ? (
          "Unfollow"
        ) : (
          <>
            <UserCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Following</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleFollowToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 bg-[#0D9488] hover:bg-[#063D38] text-white shadow-sm hover:shadow transition-all ${sizeClasses} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5" />
          <span>Follow</span>
        </>
      )}
    </button>
  );
}
