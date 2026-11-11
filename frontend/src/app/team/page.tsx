"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image"; // Added missing import
import {
  ArrowRight,
  UserCheck,
  UserPlus,
  Info,
  Globe,
  Mail,
  BookOpen,
} from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/SocialIcons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { INITIAL_TEAM_MEMBERS } from "@/lib/team-data";
import { TeamMember } from "@/types";
import { apiClient } from "@/lib/api/client";
import { resolveMediaUrl } from "@/lib/media";

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [isFollowingTeam, setIsFollowingTeam] = useState<boolean>(false);
  const [teamFollowersCount, setTeamFollowersCount] = useState<number>(0);

  useEffect(() => {
    apiClient<Partial<TeamMember>[]>("/team/members")
      .then((liveMembers) => {
        if (!Array.isArray(liveMembers) || liveMembers.length === 0) return;
        setMembers((prev) =>
          prev.map((local) => {
            const match = liveMembers.find(
              (m) => m.username?.toLowerCase() === local.username.toLowerCase()
            );
            if (!match) return local;
            return {
              ...local,
              fullName: match.fullName || local.fullName,
              designation: match.designation || local.designation,
              department: match.department || local.department,
              university: match.university || local.university,
              bio: match.bio || local.bio,
              avatarUrl: match.avatarUrl || local.avatarUrl,
              avatarSmUrl: match.avatarSmUrl || local.avatarSmUrl,
              avatarLgUrl: match.avatarLgUrl || local.avatarLgUrl,
            };
          })
        );
      })
      .catch(() => {});
  }, []);

  const handleFollowTeam = () => {
    setIsFollowingTeam(!isFollowingTeam);
    setTeamFollowersCount((prev) => (isFollowingTeam ? Math.max(0, prev - 1) : prev + 1));
  };

  const filteredMembers = members.filter((m) => {
    if (filterRole === "LEAD") return m.isLead;
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Dark Hero Banner */}
      <section className="bg-medinex-dark text-white py-16 border-b border-emerald-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <Badge variant="mint">Six-Contributor Squad</Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              MediNex Innovation Contributors
            </h1>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              Meet the six interdisciplinary engineers and researchers building the MediNex platform
              and ShasthoSetu for E-Health Hackathon 2026.
            </p>

            <div className="flex items-center gap-2 p-3 bg-emerald-950/70 border border-emerald-900 rounded-lg text-xs text-slate-300">
              <Info className="w-4 h-4 text-medinex-mint shrink-0" />
              <span>
                <strong>Verified Placeholder Notice:</strong> Contributor names, universities, and
                credentials are preserved as structured placeholders until each team member submits
                their verified profile info. No fake credentials or awards are invented.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Official Team Account Card */}
      <section className="bg-white border-b border-medinex-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-slate-50 to-emerald-50/40 border border-medinex-border">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-medinex-teal to-medinex-deep flex items-center justify-center text-white text-2xl font-bold shadow-md">
                MN
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-medinex-text">MediNex Official Team Account</h2>
                  <Badge variant="teal" size="sm">
                    Multidisciplinary Core Team
                  </Badge>
                </div>
                <p className="text-xs text-medinex-muted mt-0.5">@medinex-official &bull; 6 Core Members</p>
                <div className="flex items-center gap-4 text-xs text-slate-600 mt-2 font-medium">
                  <span>
                    <strong className="text-medinex-text">{teamFollowersCount}</strong> Team Followers
                  </span>
                  <span>
                    <strong className="text-medinex-text">1</strong> Official Project (ShasthoSetu)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant={isFollowingTeam ? "outline" : "primary"}
                size="md"
                onClick={handleFollowTeam}
                className="shrink-0"
              >
                {isFollowingTeam ? (
                  <>
                    <UserCheck className="w-4 h-4 mr-1.5 text-medinex-teal" />
                    <span>Following Team</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    <span>Follow MediNex</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Members Directory */}
      <section className="py-16 bg-medinex-light flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-medinex-border">
            <div>
              <h2 className="text-xl font-bold text-medinex-text">The Six Profiles</h2>
              <p className="text-xs text-medinex-muted">Click any member to view full details or edit in-place</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterRole("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterRole === "ALL"
                    ? "bg-medinex-teal text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                All 6 Members
              </button>
              <button
                type="button"
                onClick={() => setFilterRole("LEAD")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterRole === "LEAD"
                    ? "bg-medinex-teal text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                Team Lead
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <Card key={member.id} hoverEffect className="flex flex-col justify-between">
                <CardBody className="space-y-4">
                  {/* Top Bar with Avatar and Badge */}
                  <div className="flex flex-col items-start gap-4">
                    <Link
                      href={`/team/${member.username}`}
                      className="w-full aspect-[4/4] md:aspect-[4/4.5] rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-4xl text-slate-300 shadow-inner overflow-hidden relative block group"
                    >
                      <span className="absolute inset-0 flex items-center justify-center font-bold text-6xl text-slate-300 z-0">
                        {member.username.replace("contributor-", "C")}
                      </span>
                      {member.avatarLgUrl || member.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolveMediaUrl(member.avatarLgUrl || member.avatarUrl)!}
                          alt={member.fullName}
                          className="w-full h-full object-cover object-top relative z-10 group-hover:scale-[1.02] transition-transform"
                        />
                      ) : (
                        <Image
                          src={`/images/team/${member.username}.jpg`} // আপনার ছবিগুলো .jpg নাকি .png তা খেয়াল করে এক্সটেনশন পাল্টাবেন
                          alt={member.fullName}
                          fill
                          className="object-cover object-top relative z-10 group-hover:scale-[1.02] transition-transform"
                          onError={(e) => {
                            // যদি ছবি না পাওয়া যায়, তবে এই বক্সে ইনিশিয়াল (C01) দেখাবে
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </Link>

                    <div className="flex items-start justify-between w-full">
                      <div>
                        <Link
                          href={`/team/${member.username}`}
                          className="font-bold text-base text-medinex-text leading-tight hover:text-medinex-teal transition-colors block"
                        >
                          {member.fullName}
                        </Link>
                        <Link
                          href={`/team/${member.username}`}
                          className="text-xs text-medinex-teal font-medium mt-0.5 hover:underline block"
                        >
                          @{member.username}
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {member.isLead && (
                      <Badge variant="teal" size="sm">
                        Team Lead
                      </Badge>
                    )}
                    {member.isPlaceholder && (
                      <Badge variant="placeholder" size="sm">
                        Verified Placeholder
                      </Badge>
                    )}
                  </div>

                  {/* Role & Org */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-800">{member.designation}</p>
                    <p className="text-xs text-slate-500">{member.department}</p>
                    <p className="text-[11px] text-slate-400 italic">{member.university}</p>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {member.bio}
                  </p>

                  {/* Key Skills */}
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5">
                      Focus Areas &amp; Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {member.skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200/60"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardBody>

                {/* Footer Link */}
                <div className="px-6 py-3.5 bg-slate-50/80 border-t border-medinex-border/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="text-slate-400 hover:text-medinex-teal transition-colors"
                        aria-label={`Email ${member.fullName}`}
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                    {member.portfolioUrl && (
                      <a
                        href={member.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-medinex-teal transition-colors"
                        aria-label={`Portfolio website for ${member.fullName}`}
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                    {member.githubUrl && (
                      <a
                        href={member.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-medinex-teal transition-colors"
                        aria-label={`GitHub profile for ${member.fullName}`}
                      >
                        <GithubIcon className="w-4 h-4" />
                      </a>
                    )}
                    {member.linkedinUrl && (
                      <a
                        href={member.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-medinex-teal transition-colors"
                        aria-label={`LinkedIn profile for ${member.fullName}`}
                      >
                        <LinkedinIcon className="w-4 h-4" />
                      </a>
                    )}
                    {member.researchGateUrl && (
                      <a
                        href={member.researchGateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-medinex-teal transition-colors"
                        aria-label={`ResearchGate profile for ${member.fullName}`}
                      >
                        <BookOpen className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <Link
                    href={`/team/${member.username}`}
                    className="font-semibold text-medinex-teal hover:text-medinex-teal-hover inline-flex items-center gap-1"
                  >
                    <span>View &amp; Edit Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
