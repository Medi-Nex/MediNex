import { test, expect, Page } from "@playwright/test";

const SEED_CONTRIBUTOR_USER = "contributor-01";
const SEED_CONTRIBUTOR_PASS =
  process.env.E2E_CONTRIBUTOR_PASSWORD || "Contributor@SecurePass2026!";
const SEED_ADMIN_USER = "medinex-admin";
const SEED_ADMIN_PASS =
  process.env.E2E_ADMIN_PASSWORD || "Admin@SecurePass2026!";

function trackRuntimeErrors(page: Page) {
  const pageErrors: string[] = [];
  const serverErrors: string[] = [];

  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  page.on("response", (res) => {
    if (res.status() >= 500) {
      serverErrors.push(`${res.status()} ${res.url()}`);
    }
  });

  return { pageErrors, serverErrors };
}

test.describe("MediNex Live Stack Read-Only Verification", () => {
  test("public routes, case-insensitive user profiles, and clickable author links work without errors", async ({
    page,
  }) => {
    const { pageErrors, serverErrors } = trackRuntimeErrors(page);

    await page.goto("/");
    await expect(page).toHaveTitle(/MediNex/i);
    await expect(page.getByRole("link", { name: "Community", exact: true })).toBeVisible();

    // Public profile direct visit + mixed-case lookup
    await page.goto("/users/contributor-01");
    await expect(page.getByText("@contributor-01")).toBeVisible();
    await expect(page.getByText("This Account Is Private")).toHaveCount(0);

    await page.goto("/users/Contributor-01");
    await expect(page.getByText("@contributor-01")).toBeVisible();

    // Community feed clickable profile link navigation
    await page.goto("/community");
    const authorLink = page
      .locator('a[href="/users/contributor-01"]')
      .first();
    await expect(authorLink).toBeVisible();
    await authorLink.click();
    await expect(page).toHaveURL(/\/users\/contributor-01/i);
    await expect(page.getByText("@contributor-01")).toBeVisible();

    // Team page clickable navigation
    await page.goto("/team");
    await expect(
      page.getByRole("heading", { name: "Profiles" })
    ).toBeVisible();
    const firstTeamCardLink = page.locator('a[href^="/team/"]').first();
    await expect(firstTeamCardLink).toBeVisible();
    await firstTeamCardLink.click();
    await expect(page).toHaveURL(/\/(team|users)\//i);

    expect(pageErrors).toEqual([]);
    expect(serverErrors).toEqual([]);
  });

  test("anonymous visitors are redirected from protected dashboard and admin routes", async ({
    page,
  }) => {
    const { pageErrors, serverErrors } = trackRuntimeErrors(page);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);

    expect(pageErrors).toEqual([]);
    expect(serverErrors).toEqual([]);
  });

  test("standard contributor logs in, is denied admin console access, and logs out cleanly", async ({
    page,
  }) => {
    const { pageErrors, serverErrors } = trackRuntimeErrors(page);

    await page.goto("/login");
    await page
      .locator('input[placeholder="you@domain.org or username"]')
      .fill(SEED_CONTRIBUTOR_USER);
    await page.locator('input[type="password"]').fill(SEED_CONTRIBUTOR_PASS);
    await page.locator('form button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(SEED_CONTRIBUTOR_USER).first()).toBeVisible();

    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "Access Restricted" })
    ).toBeVisible();

    // Sign out cleanly via navbar button
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page.getByRole("link", { name: /Sign In/i }).first()).toBeVisible();

    expect(pageErrors).toEqual([]);
    expect(serverErrors).toEqual([]);
  });

  test("seed super admin accesses admin overview, users, and settings safely", async ({
    page,
  }) => {
    const { pageErrors, serverErrors } = trackRuntimeErrors(page);

    await page.goto("/login");
    await page
      .locator('input[placeholder="you@domain.org or username"]')
      .fill(SEED_ADMIN_USER);
    await page.locator('input[type="password"]').fill(SEED_ADMIN_PASS);
    await page.locator('form button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto("/admin");
    await expect(page.getByText("Access Restricted")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Site Settings", exact: true })).toBeVisible();

    await page.goto("/admin/users");
    await expect(
      page.getByRole("heading", { name: "Innovator Accounts Management" })
    ).toBeVisible();

    await page.goto("/admin/settings");
    await expect(
      page.getByRole("heading", {
        name: "Platform Configuration & Security Governance",
      })
    ).toBeVisible();

    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Sign Out" }).click();
    await expect(page.getByRole("link", { name: /Sign In/i }).first()).toBeVisible();

    expect(pageErrors).toEqual([]);
    expect(serverErrors).toEqual([]);
  });
});
