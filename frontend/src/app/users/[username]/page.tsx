"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building,
  GraduationCap,
  Calendar,
  Globe,
  CheckCircle2,
  ShieldCheck,
  Briefcase,
  MessageSquare,
  Heart,
  Edit3,
  Settings,
  Lock,
  Loader2,
  Users,
} from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/SocialIcons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ProfileHeroCover } from "@/components/profile/ProfileHeroCover";
import { FollowButton } from "@/components/follow/FollowButton";
import { ApiError } from "@/lib/api/client";
import { authApi, PublicUserProfile } from "@/lib/api/auth";
import { getUserFollowStats, FollowStatsDto } from "@/lib/api/follow";
import { getUserPosts, PostDto } from "@/lib/api/community";
import { INITIAL_TEAM_MEMBERS } from "@/lib/team-data";
import { useAuth } from "@/lib/auth-context";

export default function PublicUserProfilePage() {
  const params = useParams();
  const rawUsername = (params?.username as string) || "";
  const username = decodeURIComponent(rawUsername);

  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [followStats, setFollowStats] = useState<FollowStatsDto | null>(null);
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;

    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    const loadProfileData = async () => {
      try {
        const [apiUser, statsRes, postsRes] = await Promise.allSettled([
          authApi.getPublicProfile(username),
          getUserFollowStats(username),
          getUserPosts(username, 0, 15),
        ]);

        if (cancelled) return;

        if (apiUser.status === "fulfilled") {
          const teamFallback = INITIAL_TEAM_MEMBERS.find(
            (m) => m.username.toLowerCase() === username.toLowerCase()
          );
          const merged: PublicUserProfile = {
            ...apiUser.value,
            designation: apiUser.value.designation || teamFallback?.designation,
            department: apiUser.value.department || teamFallback?.department,
            university: apiUser.value.university || teamFallback?.university,
            bio: apiUser.value.bio || teamFallback?.bio,
            skills:
              apiUser.value.skills && apiUser.value.skills.length > 0
                ? apiUser.value.skills
                : teamFallback?.skills || [],
            responsibilities:
              apiUser.value.responsibilities && apiUser.value.responsibilities.length > 0
                ? apiUser.value.responsibilities
                : teamFallback?.responsibilities || [],
            portfolioUrl: apiUser.value.portfolioUrl || teamFallback?.portfolioUrl,
            githubUrl: apiUser.value.githubUrl || teamFallback?.githubUrl,
            linkedinUrl: apiUser.value.linkedinUrl || teamFallback?.linkedinUrl,
          };
          setProfile(merged);
        } else if (apiUser.reason instanceof ApiError && apiUser.reason.status === 403) {
          // Backend enforces private profile access (403); render minimal lock view with Follow button
          setProfile({
            id: username,
            username,
            fullName: `@${username}`,
            status: "ACTIVE",
            emailVerified: true,
            isTeamMember: false,
            isPublicVisible: false,
            roles: [],
            createdAt: "",
          });
        } else {
          // Graceful fallback if viewing one of the local static seed contributor usernames offline
          const teamFallback = INITIAL_TEAM_MEMBERS.find(
            (m) => m.username.toLowerCase() === username.toLowerCase()
          );
          if (teamFallback) {
            setProfile({
              id: teamFallback.id,
              username: teamFallback.username,
              fullName: teamFallback.fullName,
              status: "ACTIVE",
              emailVerified: true,
              isTeamMember: true,
              isPublicVisible: teamFallback.publicVisibility,
              isVerifiedContributor: !teamFallback.isPlaceholder,
              designation: teamFallback.designation,
              department: teamFallback.department,
              university: teamFallback.university,
              bio: teamFallback.bio,
              skills: teamFallback.skills,
              responsibilities: teamFallback.responsibilities,
              portfolioUrl: teamFallback.portfolioUrl,
              githubUrl: teamFallback.githubUrl,
              linkedinUrl: teamFallback.linkedinUrl,
              avatarUrl: `/images/team/${teamFallback.username}.jpg`,
              roles: ["ROLE_USER"],
              createdAt: teamFallback.verifiedJoinDate || "2026-01-15T00:00:00Z",
            });
          } else {
            setNotFound(true);
          }
        }

        if (statsRes.status === "fulfilled") {
          setFollowStats(statsRes.value);
        }
        if (postsRes.status === "fulfilled") {
          setPosts(postsRes.value.content || []);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfileData();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-medinex-light flex flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-medinex-teal" />
        <p className="text-xs text-medinex-muted">Loading innovator profile...</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="text-2xl font-bold text-medinex-text">User Profile Not Found</h1>
        <p className="text-sm text-medinex-muted">
          No community profile exists for &ldquo;@{username}&rdquo;.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link href="/community">
            <Button variant="primary">Back to Community Feed</Button>
          </Link>
          <Link href="/team">
            <Button variant="outline">Meet the Squad</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile =
    Boolean(currentUser?.username) &&
    currentUser!.username.toLowerCase() === profile.username.toLowerCase();

  const isPrivateLocked =
    profile.isPublicVisible === false &&
    !isOwnProfile &&
    !(followStats?.isFollowing);

  const followerCount = followStats?.followerCount ?? 0;
  const followingCount = followStats?.followingCount ?? 0;

  return (
    <div className="min-h-screen bg-medinex-light pb-24 md:pb-20">
      {/* Top Breadcrumb Bar */}
      <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-md border-b border-medinex-border py-3 sm:py-3.5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <Link
            href="/community"
            className="text-xs font-semibold text-medinex-teal hover:underline inline-flex items-center gap-1.5 min-h-[36px] py-1"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Back to Community</span>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            {profile.isTeamMember && (
              <Link
                href={`/team/${encodeURIComponent(profile.username)}`}
                className="text-xs font-medium text-slate-600 hover:text-medinex-teal min-h-[36px] inline-flex items-center px-2"
              >
                Team Spotlight
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 sm:mt-8 space-y-5 sm:space-y-6">
        {/* Profile Hero Card */}
        <ProfileHeroCover
          subject={profile}
          onUpdated={(updatedUser) => {
            setProfile((prev) =>
              prev
                ? {
                    ...prev,
                    coverImageUrl: updatedUser.coverImageUrl ?? null,
                    avatarUrl: updatedUser.avatarUrl ?? null,
                    avatarSmUrl: updatedUser.avatarSmUrl ?? null,
                    avatarLgUrl: updatedUser.avatarLgUrl ?? null,
                  }
                : prev
            );
          }}
          badges={
            <>
              {profile.isTeamMember && (
                <Badge variant="mint" size="sm">
                  MediNex Squad Contributor
                </Badge>
              )}
              {profile.isPublicVisible === false && (
                <Badge variant="warning" size="sm">
                  Private Account
                </Badge>
              )}
            </>
          }
          actions={
            isOwnProfile ? (
              <>
                <Link href="/dashboard/settings">
                  <Button variant="outline" size="sm" className="text-xs inline-flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-medinex-teal" />
                    <span>Upload Photo &amp; Settings</span>
                  </Button>
                </Link>
                <Link href="/dashboard/profile">
                  <Button variant="primary" size="sm" className="text-xs inline-flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </Button>
                </Link>
              </>
            ) : (
              <FollowButton
                targetType="user"
                username={profile.username}
                initialIsFollowing={Boolean(followStats?.isFollowing)}
                initialHasPendingRequest={Boolean(followStats?.hasPendingRequest)}
                size="md"
                onFollowChange={(newIsFollowing, delta) => {
                  setFollowStats((prev) =>
                    prev
                      ? {
                          ...prev,
                          isFollowing: newIsFollowing,
                          followerCount: Math.max(0, prev.followerCount + delta),
                        }
                      : prev
                  );
                }}
              />
            )
          }
        >
          {/* Identity & Bio Header */}
          <div className="space-y-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-medinex-text">
                    {profile.fullName}
                  </h1>
                  {(profile.isVerifiedContributor || profile.isTeamMember) && (
                    <span
                      title="Verified MediNex Contributor"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-medinex-teal border border-teal-200/70"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-medinex-teal mt-0.5">
                  @{profile.username}
                  {profile.headline ? ` • ${profile.headline}` : ""}
                </p>
                {profile.designation && !profile.headline && (
                  <p className="text-xs text-slate-600 mt-1">{profile.designation}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-600">
                {profile.designation && profile.headline && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>{profile.designation}</span>
                  </div>
                )}
                {profile.department && (
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{profile.department}</span>
                  </div>
                )}
                {profile.university && (
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>{profile.university}</span>
                  </div>
                )}
                {profile.createdAt && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    <strong className="text-slate-900">{followerCount}</strong> Followers &bull;{" "}
                    <strong className="text-slate-900">{followingCount}</strong> Following
                  </span>
                </div>
              </div>

              {(profile.portfolioUrl || profile.githubUrl || profile.linkedinUrl) && (
                <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100">
                  {profile.portfolioUrl && (
                    <a
                      href={profile.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-medinex-teal font-medium"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Portfolio</span>
                    </a>
                  )}
                  {profile.githubUrl && (
                    <a
                      href={profile.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-medinex-teal font-medium"
                    >
                      <GithubIcon className="w-3.5 h-3.5" />
                      <span>GitHub</span>
                    </a>
                  )}
                  {profile.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-medinex-teal font-medium"
                    >
                      <LinkedinIcon className="w-3.5 h-3.5" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                </div>
              )}
          </div>
        </ProfileHeroCover>

        {isPrivateLocked ? (
          <Card className="border border-medinex-border">
            <CardBody className="p-10 text-center space-y-2">
              <Lock className="w-8 h-8 text-slate-400 mx-auto" />
              <h2 className="text-base font-bold text-medinex-text">This Account Is Private</h2>
              <p className="text-xs text-medinex-muted max-w-md mx-auto">
                Follow @{profile.username} to request access to their detailed bio and community contributions.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: About & Skills */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h2 className="text-sm font-bold text-medinex-text">About</h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {profile.bio && profile.bio.trim().length > 0
                      ? profile.bio
                      : `${profile.fullName} is a community innovator on MediNex collaborating on digital health and healthcare technology initiatives.`}
                  </p>

                  {profile.responsibilities && profile.responsibilities.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Key Responsibilities
                      </h3>
                      <ul className="space-y-1.5">
                        {profile.responsibilities.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-medinex-teal shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {profile.skills && profile.skills.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Skills &amp; Interests
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* Right Column: User Community Posts */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-medinex-text">
                  Community Discussions ({posts.length})
                </h2>
                <Link href="/community" className="text-xs font-semibold text-medinex-teal hover:underline">
                  Explore Feed
                </Link>
              </div>

              {posts.length === 0 ? (
                <Card>
                  <CardBody className="p-8 text-center space-y-2">
                    <MessageSquare className="w-7 h-7 text-slate-300 mx-auto" />
                    <p className="text-xs font-medium text-slate-600">
                      No public community posts yet.
                    </p>
                  </CardBody>
                </Card>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Card key={post.id} className="border border-medinex-border hover:border-teal-200 transition-colors">
                      <CardBody className="p-5 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              src={post.authorAvatarUrl || profile.avatarUrl}
                              smSrc={post.authorAvatarSmUrl || profile.avatarSmUrl}
                              lgSrc={post.authorAvatarLgUrl || profile.avatarLgUrl}
                              fullName={post.authorFullName}
                              username={post.authorUsername}
                              size="md"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-medinex-text">
                                  {post.authorFullName}
                                </span>
                                {post.isAuthorVerified && (
                                  <ShieldCheck className="w-3.5 h-3.5 text-medinex-teal" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400">
                                {new Date(post.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {post.isOfficialAnnouncement && (
                            <Badge variant="mint" size="sm">Official Update</Badge>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                          {post.content}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                          <div className="flex items-center gap-4">
                            <span className="inline-flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5" />
                              {post.likesCount}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5" />
                              {post.commentsCount}
                            </span>
                          </div>
                          <Link
                            href={`/community/posts/${post.id}`}
                            className="font-semibold text-medinex-teal hover:underline"
                          >
                            View Thread &rarr;
                          </Link>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
