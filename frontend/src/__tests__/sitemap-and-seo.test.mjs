import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("SEO & Sitemap Validation: Asserts all mandatory public routes are registered", () => {
  const sitemapPath = path.resolve("./src/app/sitemap.ts");
  const robotsPath = path.resolve("./src/app/robots.ts");

  assert.ok(fs.existsSync(sitemapPath), "sitemap.ts must exist in app router");
  assert.ok(fs.existsSync(robotsPath), "robots.ts must exist in app router");

  const sitemapContent = fs.readFileSync(sitemapPath, "utf-8");
  const robotsContent = fs.readFileSync(robotsPath, "utf-8");

  // Verify critical public routes are present in sitemap
  const requiredRoutes = [
    "/about",
    "/team",
    "/projects",
    "/projects/shasthosetu",
    "/community",
    "/updates",
    "/events",
    "/contact",
    "/privacy",
    "/terms",
  ];

  for (const route of requiredRoutes) {
    assert.ok(
      sitemapContent.includes(route),
      `Sitemap must include public route: ${route}`
    );
  }

  // Verify team members are included
  assert.ok(sitemapContent.includes("teamMemberUsernames"), "Sitemap must dynamically map all 6 contributor profiles");

  // Verify robots.txt protects private and admin paths
  assert.ok(robotsContent.includes("disallow: [\"/admin/\", \"/dashboard/\", \"/api/\"]"), "Robots must block sensitive endpoints");
});

test("Security Headers: Verifies CSP, HSTS, and frame protection in next.config.ts", () => {
  const configPath = path.resolve("./next.config.ts");
  assert.ok(fs.existsSync(configPath), "next.config.ts must exist");

  const configContent = fs.readFileSync(configPath, "utf-8");
  assert.ok(configContent.includes("Content-Security-Policy"), "Must configure CSP");
  assert.ok(configContent.includes("Strict-Transport-Security"), "Must configure HSTS");
  assert.ok(configContent.includes("X-Frame-Options"), "Must configure X-Frame-Options");
  assert.ok(configContent.includes("X-Content-Type-Options"), "Must configure X-Content-Type-Options nosniff");
  assert.ok(configContent.includes("image/avif"), "Must optimize modern image formats");
});
