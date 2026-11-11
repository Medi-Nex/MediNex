import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveConfiguredApiBaseUrl } from "../lib/env.ts";

test("API Env Guard: Allows localhost fallback strictly in local development", () => {
  const url = resolveConfiguredApiBaseUrl({
    apiBaseUrl: "",
    appUrl: "http://localhost:3000",
    nodeEnv: "development",
    vercel: "",
    vercelEnv: "",
    browserProtocol: "http:",
  });
  assert.equal(url, "http://localhost:8080/api/v1");
});

test("API Env Guard: Rejects silent localhost fallback in generic production build when unset", () => {
  assert.throws(
    () =>
      resolveConfiguredApiBaseUrl({
        apiBaseUrl: "",
        appUrl: "",
        nodeEnv: "production",
        vercel: "",
        vercelEnv: "",
      }),
    /Missing NEXT_PUBLIC_API_BASE_URL/
  );
});

test("API Env Guard: Rejects localhost or plain HTTP URL in Vercel / HTTPS production", () => {
  assert.throws(
    () =>
      resolveConfiguredApiBaseUrl({
        apiBaseUrl: "http://localhost:8080/api/v1",
        appUrl: "https://medinex-bd.vercel.app",
        nodeEnv: "production",
        vercel: "1",
        vercelEnv: "production",
      }),
    /cannot use http:\/\/ or localhost/
  );

  assert.throws(
    () =>
      resolveConfiguredApiBaseUrl({
        apiBaseUrl: "http://api.example.com/api/v1",
        appUrl: "https://medinex-bd.vercel.app",
        nodeEnv: "production",
      }),
    /cannot use http:\/\/ or localhost/
  );
});

test("API Env Guard: Accepts valid HTTPS API URL in Vercel production and trims trailing slash", () => {
  const url = resolveConfiguredApiBaseUrl({
    apiBaseUrl: "https://api.medinex.example/api/v1/",
    appUrl: "https://medinex-bd.vercel.app",
    nodeEnv: "production",
    vercel: "1",
    vercelEnv: "production",
    browserProtocol: "https:",
  });
  assert.equal(url, "https://api.medinex.example/api/v1");
});

test("API Clients & Media Helpers: No hardcoded localhost URLs outside env.ts", () => {
  const clientSrc = fs.readFileSync(path.resolve("./src/lib/api/client.ts"), "utf-8");
  const mediaSrc = fs.readFileSync(path.resolve("./src/lib/media.ts"), "utf-8");
  const nextConfigSrc = fs.readFileSync(path.resolve("./next.config.ts"), "utf-8");

  assert.ok(!clientSrc.includes("http://localhost:"), "client.ts must delegate API base resolution to env.ts");
  assert.ok(!mediaSrc.includes("http://localhost:"), "media.ts must delegate API origin resolution to env.ts");
  assert.ok(nextConfigSrc.includes("isCloudHttpsProduction"), "next.config.ts must validate production HTTPS API URL");
});
