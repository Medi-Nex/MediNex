"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getUserProfileHref, selectAvatarVariantUrl } from "@/lib/media";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-7 h-7 text-[11px]",
  md: "w-10 h-10 text-xs",
  lg: "w-14 h-14 text-base",
  xl: "w-28 h-28 sm:w-32 sm:h-32 text-3xl",
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
}: UserAvatarProps) {
  const chosenUrl = selectAvatarVariantUrl(
    { smUrl: smSrc, mdUrl: src, lgUrl: lgSrc },
    size
  );

  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  useEffect(() => {
    setFailedUrl(null);
  }, [chosenUrl]);

  const showImage = Boolean(chosenUrl) && failedUrl !== chosenUrl;
  const initialsSource = (fullName || username || "MX").trim();
  const initials = initialsSource.length >= 2
    ? initialsSource.slice(0, 2).toUpperCase()
    : initialsSource.toUpperCase();

  const frame = (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-gradient-to-br from-teal-600 to-emerald-800 text-white font-bold select-none shadow-sm border border-white/80 ${SIZE_CLASSES[size]} ${SHAPE_CLASSES[shape]} ${className}`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={chosenUrl!}
          alt={fullName || username || "User avatar"}
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(chosenUrl)}
          className="w-full h-full object-cover"
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
