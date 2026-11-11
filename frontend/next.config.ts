import type { NextConfig } from "next";

const configuredApiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim().replace(/\/+$/, "");
const configuredAppUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim();
const isCloudHttpsProduction =
  process.env.VERCEL === "1" ||
  Boolean(process.env.VERCEL_ENV) ||
  configuredAppUrl.startsWith("https://");

if (isCloudHttpsProduction) {
  let isValidHttpsApi = false;
  try {
    const parsed = new URL(configuredApiBase);
    isValidHttpsApi =
      parsed.protocol === "https:" &&
      parsed.hostname !== "localhost" &&
      parsed.hostname !== "127.0.0.1" &&
      parsed.hostname !== "0.0.0.0";
  } catch {
    isValidHttpsApi = false;
  }
  if (!isValidHttpsApi) {
    throw new Error(
      `Invalid or missing NEXT_PUBLIC_API_BASE_URL (${configuredApiBase || "unset"}) for HTTPS/Vercel production build. Cannot fall back to localhost.`
    );
  }
}

let configuredApiOrigin = "";
let configuredApiPattern: { protocol: "http" | "https"; hostname: string; port?: string } | null = null;
if (configuredApiBase) {
  try {
    const parsed = new URL(configuredApiBase);
    configuredApiOrigin = parsed.origin;
    configuredApiPattern = {
      protocol: parsed.protocol === "https:" ? "https" : "http",
      hostname: parsed.hostname,
      ...(parsed.port ? { port: parsed.port } : {}),
    };
  } catch {
    configuredApiOrigin = "";
  }
}

const devLocalMediaOrigins = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:8082",
  "http://127.0.0.1:8082",
];

const cspMediaOrigins = isCloudHttpsProduction
  ? [configuredApiOrigin].filter(Boolean).join(" ")
  : [...devLocalMediaOrigins, configuredApiOrigin].filter(Boolean).join(" ");

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' blob: data: ${cspMediaOrigins} https://images.unsplash.com https://avatars.githubusercontent.com https:`.replace(/\s+/g, " "),
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' ${cspMediaOrigins} https:`.replace(/\s+/g, " "),
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      ...(configuredApiPattern ? [configuredApiPattern] : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
