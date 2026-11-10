"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit3,
  Save,
  X,
  Globe,
  CheckCircle2,
  Calendar,
  Building,
  GraduationCap,
  UserPlus,
  UserCheck,
  Share2,
} from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/SocialIcons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { INITIAL_TEAM_MEMBERS } from "@/lib/team-data";
import { TeamMember } from "@/types";

export default function MemberProfilePage() {
  const params = useParams();
  const username = params?.username as string;

  const [member, setMember] = useState<TeamMember | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState<Partial<TeamMember>>({});

  useEffect(() => {
    // Check localStorage first for updated profile
    const saved = typeof window !== "undefined" ? localStorage.getItem(`medinex_member_${username}`) : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMember(parsed);
        setFormData(parsed);
        return;
      } catch (e) {
        console.error("Failed to parse saved member", e);
      }
    }

    const defaultMember = INITIAL_TEAM_MEMBERS.find((m) => m.username === username);
    if (defaultMember) {
      setMember(defaultMember);
      setFormData(defaultMember);
    }
  }, [username]);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: TeamMember = {
      ...member,
      ...formData,
      isPlaceholder: false, // Once modified with verified information, clear placeholder mark
    } as TeamMember;

    setMember(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(`medinex_member_${username}`, JSON.stringify(updated));
    }
    setIsEditing(false);
  };

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    setFollowerCount((prev) => (isFollowing ? Math.max(0, prev - 1) : prev + 1));
  };

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? "Cancel Editing" : "Edit Profile Info"}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Profile Card Banner */}
        <div className="bg-white border border-medinex-border rounded-2xl overflow-hidden shadow-subtle">
          {/* Cover gradient */}
          <div className="h-36 sm:h-48 bg-gradient-to-r from-medinex-dark via-medinex-deep to-medinex-teal relative">
            <div className="absolute top-4 right-4 flex gap-2">
              {member.isPlaceholder ? (
                <Badge variant="placeholder" size="sm">
                  Placeholder — Pending Verified Credentials
                </Badge>
              ) : (
                <Badge variant="mint" size="sm">
                  Verified Contributor Information
                </Badge>
              )}
            </div>
          </div>

          <div className="px-6 sm:px-8 pb-8 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-6">
              {/* Avatar */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white p-1.5 shadow-lg border border-medinex-border">
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-extrabold text-3xl text-medinex-deep border border-slate-200">
                  {member.username.replace("contributor-", "C")}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 self-start sm:self-auto pt-2">
                <Button
                  variant={isFollowing ? "outline" : "primary"}
                  size="md"
                  onClick={handleFollowToggle}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 mr-1.5 text-medinex-teal" />
                      <span>Following Contributor</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-1.5" />
                      <span>Follow Contributor</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

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
              </div>
            </div>
          </div>
        </div>

        {/* In-Place Editing Form (When Toggle Active) */}
        {isEditing && (
          <Card className="border-2 border-medinex-teal shadow-elevated">
            <CardHeader className="bg-slate-50/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-medinex-text">Update Contributor Profile Information</h3>
                <p className="text-xs text-medinex-muted">
                  Replace placeholder text with verified real credentials for {member.fullName}
                </p>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Close form"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleSave}>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Legal / Preferred Name
                    </label>
                    <input
                      type="text"
                      value={formData.fullName || ""}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-medinex-teal focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Official Designation
                    </label>
                    <input
                      type="text"
                      value={formData.designation || ""}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      required
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-medinex-teal focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Academic Department
                    </label>
                    <input
                      type="text"
                      value={formData.department || ""}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      required
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-medinex-teal focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      University / Affiliation
                    </label>
                    <input
                      type="text"
                      value={formData.university || ""}
                      onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                      required
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-medinex-teal focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Biography (Verified Overview)
                  </label>
                  <textarea
                    rows={4}
                    value={formData.bio || ""}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    required
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-medinex-teal focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      GitHub Profile URL
                    </label>
                    <input
                      type="url"
                      value={formData.githubUrl || ""}
                      onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                      placeholder="https://github.com/username"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-medinex-teal focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      value={formData.linkedinUrl || ""}
                      onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-medinex-teal focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="inline-flex items-center gap-1.5">
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Real Details</span>
                  </Button>
                </div>
              </CardBody>
            </form>
          </Card>
        )}

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
                    Grassroots telemedicine connectivity bridge for rural clinics.
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
