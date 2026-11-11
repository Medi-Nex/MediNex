"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getUserProfileHref, selectAvatarVariantUrl } from "@/lib/media";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "fill";

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-7 h-7 text-[11px]",
  md: "w-10 h-10 text-xs",
  lg: "w-14 h-14 text-base",
  xl: "w-28 h-28 sm:w-32 sm:h-32 text-3xl",
  fill: "w-full h-full text-4xl sm:text-5xl",
};

const SHAPE_CLASSES: Record<"circle" | "rounded" | "square", string> = {
  circle: "rounded-full",
  rounded: "rounded-xl",
  square: "rounded-lg",
};

export interface UserAvatarProps {
  src?: string | null;
  smSrc?: string | null;
  lgSrc?: string | null;
  fullName?: string | null;
  username?: string | null;
  size?: AvatarSize;
  shape?: "circle" | "rounded" | "square";
  clickable?: boolean;
  href?: string;
  className?: string;
  imgClassName?: string;
}

export function UserAvatar({
  src,
  smSrc,
  lgSrc,
  fullName,
  username,
  size = "md",
  shape = "circle",
  clickable = false,
  href,
  className = "",
  imgClassName = "",
}: UserAvatarProps) {
  const KNOWN_TEAM_USERNAMES = new Set(["hasnat", "jihadjp", "tarek", "shopnil", "nabil", "puja"]);

  const teamImageCandidate =
    username && KNOWN_TEAM_USERNAMES.has(username.toLowerCase())
      ? `/images/team/${username.toLowerCase()}.jpg`
      : null;

  const isDefaultAvatar = (url?: string | null) =>
    Boolean(url && (url.includes("default.png") || url.includes("default-avatar") || url.includes("placeholder")));

  const variantSlot = size === "fill" ? "lg" : size;

  const rawCandidates = [
    selectAvatarVariantUrl({ smUrl: smSrc, mdUrl: src, lgUrl: lgSrc }, variantSlot),
    selectAvatarVariantUrl({ mdUrl: src }, "md"),
    selectAvatarVariantUrl({ lgUrl: lgSrc, mdUrl: src }, "lg"),
    selectAvatarVariantUrl({ smUrl: smSrc, mdUrl: src }, "sm"),
    teamImageCandidate,
  ];

  const candidates: string[] = [];
  for (const candidate of rawCandidates) {
    if (candidate && !isDefaultAvatar(candidate) && !candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  }

  const candidateKey = candidates.join("|");
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [candidateKey]);

  const currentImgSrc = candidates[candidateIndex] ?? null;
  const showImage = Boolean(currentImgSrc);

  const initialsParts = (fullName || username || "MN")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const initials =
    initialsParts.length >= 2
      ? `${initialsParts[0][0]}${initialsParts[initialsParts.length - 1][0]}`.toUpperCase()
      : (initialsParts[0] || "MN").slice(0, 2).toUpperCase();

  const frame = (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-gradient-to-br from-teal-600 to-emerald-800 text-white font-bold select-none shadow-sm border border-white/80 ${SIZE_CLASSES[size]} ${SHAPE_CLASSES[shape]} ${className}`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentImgSrc!}
          alt={fullName || username || "User avatar"}
          loading="lazy"
          decoding="async"
          onError={() => setCandidateIndex((idx) => idx + 1)}
          className={`w-full h-full object-cover object-top ${imgClassName}`}
        />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );

  if (clickable && username) {
    return (
      <Link
        href={href || getUserProfileHref(username)}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex shrink-0 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#0D9488] rounded-full"
        title={`View ${fullName || username}'s profile`}
      >
        {frame}
      </Link>
    );
  }

  return frame;
}
