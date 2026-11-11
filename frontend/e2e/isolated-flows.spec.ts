import { test, expect, APIRequestContext, Page } from "@playwright/test";

const API_BASE = process.env.E2E_API_URL || "http://127.0.0.1:18080/api/v1";
const MAILPIT_URL = process.env.E2E_MAILPIT_URL || "http://localhost:8026";
const ADMIN_USERNAME = "medinex-admin";
const ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD || "Admin@SecurePass2026!";

interface MailpitListResponse {
  messages: Array<{
    ID: string;
    Subject: string;
    From?: { Address: string; Name: string };
    To?: Array<{ Address: string }>;
  }>;
}

interface MailpitMessageResponse {
  ID: string;
  Subject: string;
  From: { Address: string; Name: string };
  To: Array<{ Address: string }>;
  Text: string;
  HTML: string;
}

async function fetchOtpFromMailpit(
  request: APIRequestContext,
  recipientEmail: string,
  expectedSubject = "Your MediNex Verification Code (OTP)"
): Promise<{ otp: string; subject: string; fromAddress: string; bodyText: string }> {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const listResp = await request.get(`${MAILPIT_URL}/api/v1/messages?limit=50`);
    expect(listResp.ok()).toBeTruthy();
    const listJson = (await listResp.json()) as MailpitListResponse;
    const match = listJson.messages.find(
      (m) =>
        m.To?.some(
          (t) => t.Address.toLowerCase() === recipientEmail.toLowerCase()
        ) && m.Subject.includes(expectedSubject)
    );
    if (match) {
      const msgResp = await request.get(`${MAILPIT_URL}/api/v1/message/${match.ID}`);
      expect(msgResp.ok()).toBeTruthy();
      const msg = (await msgResp.json()) as MailpitMessageResponse;
      const bodyText = msg.Text || msg.HTML;
      const codeMatch = bodyText.match(/verification OTP is:\s*(\d{6})/i) || bodyText.match(/\b(\d{6})\b/);
      if (codeMatch) {
        return {
          otp: codeMatch[1],
          subject: msg.Subject,
          fromAddress: msg.From?.Address || "",
          bodyText,
        };
      }
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timed out waiting for Mailpit email to ${recipientEmail}`);
}

async function loginViaUi(page: Page, emailOrUsername: string, password: string) {
  await page.goto("/login");
  await page
    .locator('input[placeholder="you@domain.org or username"]')
    .fill(emailOrUsername);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function signOutViaUi(page: Page) {
  const signOutBtn = page.getByRole("button", { name: "Sign Out" });
  if ((await signOutBtn.count()) > 0) {
    await signOutBtn.first().click();
  } else {
    await page.goto("/");
    await page.getByRole("button", { name: "Sign Out" }).first().click();
  }
  await expect(page.getByRole("link", { name: /Sign In/i }).first()).toBeVisible();
}

async function registerAndVerifyViaApi(
  request: APIRequestContext,
  fullName: string,
  username: string,
  email: string,
  password: string
): Promise<{ id: string; token: string }> {
  const regResp = await request.post(`${API_BASE}/auth/register`, {
    data: { fullName, username, email, password, agreeTerms: true },
  });
  expect(regResp.ok()).toBeTruthy();

  const mail = await fetchOtpFromMailpit(request, email);
  const verResp = await request.post(`${API_BASE}/auth/verify-email`, {
    data: { email, otp: mail.otp },
  });
  expect(verResp.ok()).toBeTruthy();

  const loginResp = await request.post(`${API_BASE}/auth/login`, {
    data: { emailOrUsername: username, password },
  });
  expect(loginResp.ok()).toBeTruthy();
  const loginJson = await loginResp.json();
  return {
    id: loginJson.data.user.id,
    token: loginJson.data.accessToken,
  };
}

test.describe.serial("MediNex Isolated E2E Security, Privacy & Mailpit Flows", () => {
  const runId = Date.now().toString().slice(-6);
  const userA = {
    fullName: `Phase10 Alice ${runId}`,
    username: `p10alice_${runId}`,
    email: `p10alice_${runId}@medinex-e2e.test`,
    password: "P10Alice@Secure2026!",
  };
  const userB = {
    fullName: `Phase10 Bob ${runId}`,
    username: `p10bob_${runId}`,
    email: `p10bob_${runId}@medinex-e2e.test`,
    password: "P10Bob@Secure2026!",
  };
  const postText = `Phase10 isolated privacy check post ${runId} for interoperability review.`;
  let userBId = "";
  let userAId = "";

  test("1. Registration redirects to verify-email OTP page, enforces resend cooldown, validates OTP via Mailpit, and allows login/logout", async ({
    page,
    request,
  }) => {
    await page.goto("/register");
    await page.locator('input[placeholder="Dr. Alex Rivera"]').fill(userA.fullName);
    await page.locator('input[placeholder="alexrivera"]').fill(userA.username);
    await page.locator('input[placeholder="alex@example.org"]').fill(userA.email);
    await page.locator('input[placeholder="••••••••••••"]').fill(userA.password);
    await page.locator("#agreeTerms").check();
    await page.locator('form button[type="submit"]').click();

    // Redirect to /verify-email with email & sent=1
    await expect(page).toHaveURL(
      new RegExp(`/verify-email\\?email=${encodeURIComponent(userA.email)}&sent=1`)
    );

    // 2-minute resend button must be disabled under active cooldown
    const resendButton = page.getByRole("button", { name: /Resend/i });
    await expect(resendButton).toBeDisabled();

    // Submit invalid 6-digit OTP first
    await page.locator('input[inputmode="numeric"]').fill("000000");
    await page.getByRole("button", { name: /Verify OTP/i }).click();
    await expect(page.locator("form div.bg-red-50")).toBeVisible();

    // Retrieve real OTP from Mailpit (no secret password leaked)
    const mail = await fetchOtpFromMailpit(request, userA.email);
    expect(mail.fromAddress.toLowerCase()).toBe("medinexbd.noreply@gmail.com");
    expect(mail.bodyText).not.toContain(userA.password);

    // Submit valid OTP
    await page.locator('input[inputmode="numeric"]').fill(mail.otp);
    await page.getByRole("button", { name: /Verify OTP/i }).click();
    await expect(
      page.getByRole("heading", { name: "Email Address Verified!" })
    ).toBeVisible();

    // Sign in with verified user & inspect dashboard
    await page.getByRole("link", { name: "Sign In to Community" }).click();
    await expect(page).toHaveURL(/\/login/);
    await loginViaUi(page, userA.username, userA.password);
    await expect(page.getByText(userA.username).first()).toBeVisible();
    await signOutViaUi(page);
  });

  test("2. Profile privacy toggle hides private content until follow request is accepted", async ({
    page,
    request,
  }) => {
    const regB = await registerAndVerifyViaApi(
      request,
      userB.fullName,
      userB.username,
      userB.email,
      userB.password
    );
    userBId = regB.id;

    // Fetch userA id & bio update
    const loginA = await request.post(`${API_BASE}/auth/login`, {
      data: { emailOrUsername: userA.username, password: userA.password },
    });
    const loginAJson = await loginA.json();
    userAId = loginAJson.data.user.id;
    const tokenA = loginAJson.data.accessToken;
    await request.put(`${API_BASE}/users/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: {
        bio: `Confidential research bio for ${userA.username}`,
      },
    });

    // While User A is public, create a post and confirm clickable community author link -> profile
    await loginViaUi(page, userA.username, userA.password);
    await page.goto("/community");
    await page.locator("form textarea").first().fill(postText);
    await page.getByRole("button", { name: "Publish Post" }).click();
    await expect(page.getByText(postText).first()).toBeVisible();
    await signOutViaUi(page);

    await loginViaUi(page, userB.username, userB.password);
    await page.goto("/community");
    await expect(page.getByText(postText).first()).toBeVisible();
    await page.locator(`a[href="/users/${userA.username}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`/users/${userA.username}`, "i"));
    await expect(
      page.getByText(`Confidential research bio for ${userA.username}`)
    ).toBeVisible();
    await signOutViaUi(page);

    // User A switches profile to private via UI Settings
    await loginViaUi(page, userA.username, userA.password);
    await page.goto("/dashboard/settings");
    await page.getByRole("button", { name: "Switch to Private" }).click();
    await expect(
      page.getByRole("button", { name: "Make Profile Public" })
    ).toBeVisible();
    await signOutViaUi(page);

    // Non-follower User B sees Private lock, hidden posts on feed/profile, and Follow Request flow
    await loginViaUi(page, userB.username, userB.password);
    await page.goto("/community");
    await expect(page.getByText(postText)).toHaveCount(0);

    await page.goto(`/users/${userA.username}`);
    await expect(
      page.getByRole("heading", { name: "This Account Is Private" })
    ).toBeVisible();
    await expect(page.getByText(postText)).toHaveCount(0);

    // User B sends Follow Request via UI (shows "Cancel Request" while pointer stays hovered, "Requested" when unhovered)
    await page.getByRole("button", { name: "Follow" }).click();
    await expect(
      page.getByRole("button", { name: /Requested|Cancel Request/ })
    ).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page.getByRole("button", { name: "Requested" })).toBeVisible();
    await signOutViaUi(page);

    // User A accepts follow request on /dashboard/following
    await loginViaUi(page, userA.username, userA.password);
    await page.goto("/dashboard/following");
    await page.getByRole("button", { name: /Follow Requests/i }).click();
    await expect(page.getByText(`@${userB.username}`)).toBeVisible();
    await page.getByRole("button", { name: "Accept" }).first().click();
    await expect(page.getByText(`@${userB.username}`)).toHaveCount(0);
    await signOutViaUi(page);

    // Accepted follower User B now sees User A's profile details and post
    await loginViaUi(page, userB.username, userB.password);
    await page.goto(`/users/${userA.username}`);
    await expect(page.getByText("This Account Is Private")).toHaveCount(0);
    await expect(
      page.getByText(`Confidential research bio for ${userA.username}`)
    ).toBeVisible();
    await expect(page.getByText(postText)).toBeVisible();
    await signOutViaUi(page);
  });

  test("3. Moderator permissions allow content moderation while blocking user/settings management and protecting SUPER_ADMIN", async ({
    page,
    request,
  }) => {
    const adminLogin = await request.post(`${API_BASE}/auth/login`, {
      data: { emailOrUsername: ADMIN_USERNAME, password: ADMIN_PASSWORD },
    });
    expect(adminLogin.ok()).toBeTruthy();
    const adminJson = await adminLogin.json();
    const superAdminId: string = adminJson.data.user.id;
    const superAdminToken: string = adminJson.data.accessToken;

    // Promote User B to ROLE_MODERATOR + create a non-super regular admin User C
    const modPromoteResp = await request.put(
      `${API_BASE}/admin/users/${userBId}`,
      {
        headers: { Authorization: `Bearer ${superAdminToken}` },
        data: { roles: ["ROLE_MODERATOR", "ROLE_USER"] },
      }
    );
    expect(modPromoteResp.ok()).toBeTruthy();

    const regularAdmin = await registerAndVerifyViaApi(
      request,
      `Phase10 Admin ${runId}`,
      `p10admin_${runId}`,
      `p10admin_${runId}@medinex-e2e.test`,
      "P10Admin@Secure2026!"
    );
    const adminPromoteResp = await request.put(
      `${API_BASE}/admin/users/${regularAdmin.id}`,
      {
        headers: { Authorization: `Bearer ${superAdminToken}` },
        data: { roles: ["ROLE_ADMIN", "ROLE_USER"] },
      }
    );
    expect(adminPromoteResp.ok()).toBeTruthy();

    // Moderator logs in via UI
    await loginViaUi(page, userB.username, userB.password);
    await expect(page.getByRole("link", { name: "Moderation", exact: true })).toBeVisible();

    await page.goto("/admin");
    await expect(page.getByRole("link", { name: "Moderation Queue", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Post Moderation", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Innovator Accounts", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Site Settings", exact: true })).toHaveCount(0);

    // Direct navigation to admin-only routes denied in UI
    await page.goto("/admin/users");
    await expect(
      page.getByRole("heading", { name: "Access Restricted" })
    ).toBeVisible();

    await page.goto("/admin/settings");
    await expect(
      page.getByRole("heading", { name: "Access Restricted" })
    ).toBeVisible();

    // Moderator can moderate posts in UI
    await page.goto("/admin/posts");
    const postRow = page.locator("tr", { hasText: postText }).first();
    await expect(postRow).toBeVisible();
    await postRow.getByRole("button", { name: "Hide" }).click();
    await expect(postRow.getByText("Hidden")).toBeVisible();

    // Backend enforcement: Moderator cannot suspend user or manage settings (403)
    const modLoginApi = await request.post(`${API_BASE}/auth/login`, {
      data: { emailOrUsername: userB.username, password: userB.password },
    });
    const modToken = (await modLoginApi.json()).data.accessToken;

    const suspendResp = await request.put(
      `${API_BASE}/admin/users/${userAId}`,
      {
        headers: { Authorization: `Bearer ${modToken}` },
        data: { status: "SUSPENDED" },
      }
    );
    expect(suspendResp.status()).toBe(403);

    // Backend enforcement: Regular ADMIN cannot alter SUPER_ADMIN roles (403)
    const alterSuperAdminResp = await request.put(
      `${API_BASE}/admin/users/${superAdminId}`,
      {
        headers: { Authorization: `Bearer ${regularAdmin.token}` },
        data: { roles: ["ROLE_USER"] },
      }
    );
    expect(alterSuperAdminResp.status()).toBe(403);

    await signOutViaUi(page);
  });
});
