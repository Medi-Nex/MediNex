import { getApiOrigin } from "@/lib/env";

export type AvatarVariant = "sm" | "md" | "lg";

export { getApiOrigin };

/**
 * Resolves relative backend upload paths (`/uploads/...`) against the configured API origin
 * while preserving absolute URLs, blob/data previews, and static frontend paths (`/images/...`).
 */
export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  if (trimmed.startsWith("/uploads/")) {
    return `${getApiOrigin()}${trimmed}`;
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function deriveAvatarVariantUrl(
  url?: string | null,
  variant: AvatarVariant = "md"
): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(.*\/uploads\/avatars\/.+)-(sm|md|lg)\.(jpg|jpeg|png)$/i);
  if (match) {
    return resolveMediaUrl(`${match[1]}-${variant}.${match[3].toLowerCase()}`);
  }
  return resolveMediaUrl(trimmed);
}

export function selectAvatarVariantUrl(
  sources: {
    smUrl?: string | null;
    mdUrl?: string | null;
    lgUrl?: string | null;
  },
  size: "xs" | "sm" | "md" | "lg" | "xl"
): string | null {
  const sm = resolveMediaUrl(sources.smUrl) || deriveAvatarVariantUrl(sources.mdUrl, "sm");
  const md = resolveMediaUrl(sources.mdUrl);
  const lg = resolveMediaUrl(sources.lgUrl) || deriveAvatarVariantUrl(sources.mdUrl, "lg");

  if (size === "xs" || size === "sm") {
    return sm || md || lg || null;
  }
  if (size === "md") {
    return md || lg || sm || null;
  }
  return lg || md || sm || null;
}

export function getUserProfileHref(username?: string | null): string {
  if (!username) return "/community";
  return `/users/${encodeURIComponent(username)}`;
}

const KNOWN_TEAM_PORTRAITS: Record<string, string> = {
  hasnat: "/images/team/hasnat.jpg",
  jihadjp: "/images/team/jihadjp.jpg",
  tarek: "/images/team/tarek.jpg",
  shopnil: "/images/team/shopnil.jpg",
  nabil: "/images/team/nabil.jpg",
  puja: "/images/team/puja.jpg",
};

const KNOWN_TEAM_PORTRAITS_BY_NAME: Record<string, string> = {
  "md abu hasnat abdullah": "/images/team/hasnat.jpg",
  "jihad khan": "/images/team/jihadjp.jpg",
  "m tarek rahman": "/images/team/tarek.jpg",
  "md. khairul anam shopnil": "/images/team/shopnil.jpg",
  "md. nabil shikdar": "/images/team/nabil.jpg",
  "paromita karmoker puja": "/images/team/puja.jpg",
};

/**
 * Resolves the bundled team portrait fallback path by handle or verified contributor name
 * so contributor cards retain portraits even after a handle rename.
 */
export function getTeamPortraitFallback(
  username?: string | null,
  fullName?: string | null
): string | null {
  const byUsername = username ? KNOWN_TEAM_PORTRAITS[username.trim().toLowerCase()] : null;
  if (byUsername) return byUsername;
  const byName = fullName ? KNOWN_TEAM_PORTRAITS_BY_NAME[fullName.trim().toLowerCase()] : null;
  return byName || null;
}
