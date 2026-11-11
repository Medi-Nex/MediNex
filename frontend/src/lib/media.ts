const DEFAULT_API_BASE = "http://localhost:8080/api/v1";

export type AvatarVariant = "sm" | "md" | "lg";

export function getApiOrigin(): string {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE;
  return apiBase.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");
}

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
