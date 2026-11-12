"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProfileHeroCover } from "@/components/profile/ProfileHeroCover";
import {
  ArrowLeft,
  Edit3,
  Globe,
  CheckCircle2,
  Calendar,
  Building,
  GraduationCap,
  Share2,
  Mail,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/SocialIcons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { INITIAL_TEAM_MEMBERS } from "@/lib/team-data";
import { TeamMember } from "@/types";
import { FollowButton } from "@/components/follow/FollowButton";
import { getUserFollowStats } from "@/lib/api/follow";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth-context";
import { getUserProfileHref } from "@/lib/media";

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const username = decodeURIComponent((params?.username as string) || "");

  const [member, setMember] = useState<TeamMember | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isOwner = Boolean(user && username && user.username.toLowerCase() === username.toLowerCase());
  const isAdmin = Boolean(user?.roles?.some((r) => r === "ROLE_ADMIN" || r === "ROLE_SUPER_ADMIN"));

  useEffect(() => {
    if (username) {
      getUserFollowStats(username)
        .then((stats) => {
          setFollowerCount(stats.followerCount);
          setIsFollowing(stats.isFollowing);
          setHasPendingRequest(stats.hasPendingRequest);
        })
        .catch(() => {});
    }
  }, [username]);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;

    const resolveMember = async () => {
      let baseMember =
        INITIAL_TEAM_MEMBERS.find((m) => m.username.toLowerCase() === username.toLowerCase()) || null;

      try {
        const apiUser = await authApi.getPublicProfile(username);
        if (cancelled) return;

        if (!baseMember && apiUser.isTeamMember && apiUser.fullName) {
          baseMember =
            INITIAL_TEAM_MEMBERS.find(
              (m) => m.fullName.toLowerCase() === apiUser.fullName.trim().toLowerCase()
            ) || null;
        }

        if (!baseMember && !apiUser.isTeamMember) {
          router.replace(getUserProfileHref(username));
          return;
        }

        if (baseMember && apiUser.username.toLowerCase() !== baseMember.username.toLowerCase() && !apiUser.isTeamMember) {
          setMember(baseMember);
          return;
        }

        const isNotBlank = (val?: string | null): val is string => Boolean(val && val.trim().length > 0);

        const merged: TeamMember = baseMember
          ? {
              ...baseMember,
              fullName: isNotBlank(apiUser.fullName) ? apiUser.fullName : baseMember.fullName,
              designation: isNotBlank(apiUser.designation) ? apiUser.designation : baseMember.designation,
              department: isNotBlank(apiUser.department) ? apiUser.department : baseMember.department,
              university: isNotBlank(apiUser.university) ? apiUser.university : baseMember.university,
              bio: isNotBlank(apiUser.bio) ? apiUser.bio : baseMember.bio,
              skills: apiUser.skills && apiUser.skills.length > 0 ? apiUser.skills : baseMember.skills,
              responsibilities:
                apiUser.responsibilities && apiUser.responsibilities.length > 0
                  ? apiUser.responsibilities
                  : baseMember.responsibilities,
              portfolioUrl: isNotBlank(apiUser.portfolioUrl) ? apiUser.portfolioUrl : baseMember.portfolioUrl,
              githubUrl: isNotBlank(apiUser.githubUrl) ? apiUser.githubUrl : baseMember.githubUrl,
              linkedinUrl: isNotBlank(apiUser.linkedinUrl) ? apiUser.linkedinUrl : baseMember.linkedinUrl,
              email: isNotBlank(apiUser.email) ? apiUser.email : baseMember.email,
              avatarUrl: isNotBlank(apiUser.avatarUrl) ? apiUser.avatarUrl : baseMember.avatarUrl,
              avatarSmUrl: isNotBlank(apiUser.avatarSmUrl) ? apiUser.avatarSmUrl : baseMember.avatarSmUrl,
              avatarLgUrl: isNotBlank(apiUser.avatarLgUrl) ? apiUser.avatarLgUrl : baseMember.avatarLgUrl,
              coverImageUrl: isNotBlank(apiUser.coverImageUrl) ? apiUser.coverImageUrl : baseMember.coverImageUrl,
            }
          : {
              id: apiUser.id,
              username: apiUser.username,
              fullName: apiUser.fullName,
              designation: apiUser.designation || "MediNex Contributor",
              department: apiUser.department || "Healthcare Innovation",
              university: apiUser.university || "MediNex Community",
              bio: apiUser.bio || "",
              skills: apiUser.skills || [],
              responsibilities: apiUser.responsibilities || [],
              portfolioUrl: apiUser.portfolioUrl || undefined,
              githubUrl: apiUser.githubUrl || undefined,
              linkedinUrl: apiUser.linkedinUrl || undefined,
              avatarUrl: apiUser.avatarUrl || undefined,
              avatarSmUrl: apiUser.avatarSmUrl || undefined,
              avatarLgUrl: apiUser.avatarLgUrl || undefined,
              coverImageUrl: apiUser.coverImageUrl || undefined,
              isLead: false,
              isPlaceholder: false,
              publicVisibility: apiUser.isPublicVisible ?? true,
              displayOrder: 99,
            };

        setMember(merged);
      } catch {
        if (!cancelled && baseMember) {
          setMember(baseMember);
        }
      }
    };

    resolveMember();
    return () => {
      cancelled = true;
    };
  }, [username, router]);

  if (!member) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-medinex-text">Contributor Profile Not Found</h2>
        <p className="text-sm text-medinex-muted">
          No contributor profile matching &quot;{username}&quot; was found among the six team slots.
        </p>
        <Link href="/team">
          <Button variant="primary">Return to Team Directory</Button>
        </Link>
      </div>
    );
  }

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-medinex-light pb-20">
      {/* Top Breadcrumb Header */}
      <div className="bg-white border-b border-medinex-border py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link
            href="/team"
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-medinex-teal transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to All 6 Contributors</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-medinex-teal bg-slate-50 border border-slate-200 rounded-lg inline-flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? "Link Copied!" : "Share Profile"}</span>
            </button>
            {isOwner ? (
              <Link href="/dashboard/profile">
                <Button variant="outline" size="sm" className="inline-flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit My Profile</span>
                </Button>
              </Link>
            ) : isAdmin ? (
              <Link href="/admin/team">
                <Button variant="outline" size="sm" className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Manage Team</span>
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Profile Card Banner */}
        <ProfileHeroCover
          subject={{ ...member, isTeamMember: true }}
          onUpdated={(updatedUser) => {
            setMember((prev) =>
              prev
                ? {
                    ...prev,
                    coverImageUrl: updatedUser.coverImageUrl || undefined,
                    avatarUrl: updatedUser.avatarUrl || prev.avatarUrl,
                    avatarSmUrl: updatedUser.avatarSmUrl || prev.avatarSmUrl,
                    avatarLgUrl: updatedUser.avatarLgUrl || prev.avatarLgUrl,
                  }
                : prev
            );
          }}
          badges={
            <Badge variant="mint" size="sm">
              Verified Contributor Profile
            </Badge>
          }
          actions={
            <FollowButton
              username={member.username}
              initialIsFollowing={isFollowing}
              initialHasPendingRequest={hasPendingRequest}
              size="md"
              onFollowChange={(newIsFollowing, delta) => {
                setIsFollowing(newIsFollowing);
                setFollowerCount((prev) => Math.max(0, prev + delta));
              }}
            />
          }
        >
          {/* Profile Identity Details */}
          <div className="space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-medinex-text">
                    {member.fullName}
                  </h1>
                  {member.isLead && <Badge variant="teal">Team Lead</Badge>}
                </div>
                <p className="text-sm font-semibold text-medinex-teal mt-0.5">
                  {member.designation} &bull; <span className="text-slate-500">@{member.username}</span>
                </p>
              </div>

              {/* University & Department */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span>{member.department}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  <span>{member.university}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Joined: {member.verifiedJoinDate || "2026-01-15 (Team Formation)"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800">{followerCount}</span>
                  <span className="text-slate-500">Followers</span>
                </div>
              </div>

              {/* Social links */}
              <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-medinex-teal transition-colors font-medium"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </a>
                )}
                {member.portfolioUrl && (
                  <a
                    href={member.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-medinex-teal transition-colors font-medium"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Portfolio</span>
                  </a>
                )}
                {member.githubUrl && (
                  <a
                    href={member.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-medinex-teal transition-colors font-medium"
                  >
                    <GithubIcon className="w-3.5 h-3.5" />
                    <span>GitHub</span>
                  </a>
                )}
                {member.linkedinUrl && (
                  <a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-medinex-teal transition-colors font-medium"
                  >
                    <LinkedinIcon className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {member.researchGateUrl && (
                  <a
                    href={member.researchGateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-medinex-teal transition-colors font-medium"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>ResearchGate</span>
                  </a>
                )}
              </div>
          </div>
        </ProfileHeroCover>

        {/* Detailed Sections: Bio, Responsibilities, Focus Areas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Biography & Responsibilities */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-base font-bold text-medinex-text">Biography &amp; Focus</h2>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {member.bio}
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-base font-bold text-medinex-text">Hackathon Responsibilities</h2>
              </CardHeader>
              <CardBody>
                <ul className="space-y-2.5">
                  {member.responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-medinex-teal shrink-0 mt-0.5" />
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>

          {/* Right Column: Skills & Official Project Mapping */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-base font-bold text-medinex-text">Technical Skills</h2>
              </CardHeader>
              <CardBody>
                <div className="flex flex-wrap gap-2">
                  {member.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 rounded-md font-medium border border-slate-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50/50 to-white">
              <CardHeader>
                <h2 className="text-base font-bold text-medinex-text">Assigned Projects</h2>
              </CardHeader>
              <CardBody className="space-y-3">
                <div className="p-3 bg-white rounded-lg border border-medinex-border">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-medinex-text">ShasthoSetu</span>
                    <Badge variant="warning" size="sm">
                      Development
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Interoperable digital health record &amp; exchange platform prototype.
                  </p>
                  <Link
                    href="/projects/shasthosetu"
                    className="text-xs text-medinex-teal font-semibold mt-2 inline-block hover:underline"
                  >
                    View Project Specification &rarr;
                  </Link>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
