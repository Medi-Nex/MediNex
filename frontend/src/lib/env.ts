const DEV_DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";

function isLocalhostUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "0.0.0.0";
  } catch {
    return false;
  }
}

export interface ApiEnvInput {
  apiBaseUrl?: string;
  appUrl?: string;
  nodeEnv?: string;
  vercel?: string;
  vercelEnv?: string;
  browserProtocol?: string;
}

/**
 * Resolves the backend API base URL without ever silently falling back to localhost in production.
 * - Cloud/HTTPS production (Vercel or https:// app origin) strictly requires a non-localhost https:// URL.
 * - Generic production builds require explicit NEXT_PUBLIC_API_BASE_URL (e.g. Docker Compose build arg).
 * - Local development permits fallback to http://localhost:8080/api/v1.
 */
export function resolveConfiguredApiBaseUrl(input: ApiEnvInput = {}): string {
  const rawApiBase = (input.apiBaseUrl ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
  const rawAppUrl = (input.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
  const nodeEnv = input.nodeEnv ?? process.env.NODE_ENV ?? "development";
  const isVercel = (input.vercel ?? process.env.VERCEL) === "1" || Boolean(input.vercelEnv ?? process.env.VERCEL_ENV);
  const browserProtocol =
    input.browserProtocol ?? (typeof window !== "undefined" ? window.location.protocol : undefined);

  const isCloudOrHttpsProd =
    isVercel ||
    rawAppUrl.startsWith("https://") ||
    browserProtocol === "https:";

  if (isCloudOrHttpsProd) {
    if (!rawApiBase) {
      throw new Error(
        "Missing NEXT_PUBLIC_API_BASE_URL: HTTPS/Vercel production deployments must configure a public HTTPS backend API URL."
      );
    }
    if (!rawApiBase.startsWith("https://") || isLocalhostUrl(rawApiBase)) {
      throw new Error(
        `Invalid NEXT_PUBLIC_API_BASE_URL (${rawApiBase}): production cannot use http:// or localhost endpoints.`
      );
    }
    return rawApiBase;
  }

  if (nodeEnv === "production" && !rawApiBase) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_BASE_URL in production build/runtime; refusing silent localhost fallback."
    );
  }

  return rawApiBase || DEV_DEFAULT_API_BASE_URL;
}

export function getApiBaseUrl(): string {
  return resolveConfiguredApiBaseUrl();
}

export function getApiOrigin(): string {
  return getApiBaseUrl().replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");
}
