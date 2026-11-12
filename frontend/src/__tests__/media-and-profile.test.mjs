import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Public User Profile & Multi-Resolution Avatar Components Exist", () => {
  const usersRoute = path.resolve("./src/app/users/[username]/page.tsx");
  const avatarComponent = path.resolve("./src/components/ui/UserAvatar.tsx");
  const uploadCard = path.resolve("./src/components/settings/AvatarUploadCard.tsx");
  const mediaHelper = path.resolve("./src/lib/media.ts");

  assert.ok(fs.existsSync(usersRoute), "/users/[username]/page.tsx public profile route must exist");
  assert.ok(fs.existsSync(avatarComponent), "Reusable UserAvatar component must exist");
  assert.ok(fs.existsSync(uploadCard), "Reusable AvatarUploadCard settings component must exist");
  assert.ok(fs.existsSync(mediaHelper), "Media URL resolution helper must exist");

  const mediaSrc = fs.readFileSync(mediaHelper, "utf-8");
  assert.ok(mediaSrc.includes("deriveAvatarVariantUrl"), "media.ts must derive sm/md/lg variants");
  assert.ok(mediaSrc.includes("selectAvatarVariantUrl"), "media.ts must pick variant matching avatar slot size");
  assert.ok(mediaSrc.includes("getUserProfileHref"), "media.ts must canonicalize /users/<username> links");
});

test("Settings, Profile, Community, Posts, Following & Notifications Wire Clickable Profiles & Avatars", () => {
  const settingsSrc = fs.readFileSync(
    path.resolve("./src/app/(dashboard)/dashboard/settings/page.tsx"),
    "utf-8"
  );
  const communitySrc = fs.readFileSync(path.resolve("./src/app/community/page.tsx"), "utf-8");
  const postDetailSrc = fs.readFileSync(
    path.resolve("./src/app/community/posts/[id]/page.tsx"),
    "utf-8"
  );
  const followingSrc = fs.readFileSync(
    path.resolve("./src/app/(dashboard)/dashboard/following/page.tsx"),
    "utf-8"
  );
  const notificationsSrc = fs.readFileSync(
    path.resolve("./src/app/(dashboard)/dashboard/notifications/page.tsx"),
    "utf-8"
  );
  const cspSrc = fs.readFileSync(path.resolve("./next.config.ts"), "utf-8");

  assert.ok(settingsSrc.includes("<AvatarUploadCard"), "Settings page must render AvatarUploadCard");
  assert.ok(communitySrc.includes("getUserProfileHref(post.authorUsername)"), "Feed posts must link to user profile");
  assert.ok(communitySrc.includes("getUserProfileHref(c.authorUsername)"), "Feed comments must link to user profile");
  assert.ok(communitySrc.includes("getUserProfileHref(reply.authorUsername)"), "Feed replies must link to user profile");
  assert.ok(postDetailSrc.includes("getUserProfileHref(post.authorUsername)"), "Post details author must link to user profile");
  assert.ok(postDetailSrc.includes("getUserProfileHref(comment.authorUsername)"), "Post detail comments must link to user profile");
  assert.ok(postDetailSrc.includes("getUserProfileHref(reply.authorUsername)"), "Post detail replies must link to user profile");
  assert.ok(followingSrc.includes("getUserProfileHref(u.username)"), "Following list must link to user profile");
  assert.ok(notificationsSrc.includes("getUserProfileHref(item.actorUsername)"), "Notifications must link to actor profile");
  assert.ok(cspSrc.includes("http://localhost:8082"), "CSP img-src must permit backend media origin");
});

test("Profile Banner Editor, Click-to-Preview Lightbox & Consistent Team Framing Exist", () => {
  const previewModalPath = path.resolve("./src/components/ui/ImagePreviewModal.tsx");
  const bannerCropModalPath = path.resolve("./src/components/settings/BannerCropUploadModal.tsx");
  const bannerCardPath = path.resolve("./src/components/settings/BannerUploadCard.tsx");
  const profileHeroPath = path.resolve("./src/components/profile/ProfileHeroCover.tsx");

  assert.ok(fs.existsSync(previewModalPath), "ImagePreviewModal lightbox must exist");
  assert.ok(fs.existsSync(bannerCropModalPath), "BannerCropUploadModal crop editor must exist");
  assert.ok(fs.existsSync(bannerCardPath), "BannerUploadCard settings card must exist");
  assert.ok(fs.existsSync(profileHeroPath), "ProfileHeroCover shared hero component must exist");

  const profileEditSrc = fs.readFileSync(
    path.resolve("./src/app/(dashboard)/dashboard/profile/page.tsx"),
    "utf-8"
  );
  const settingsSrc = fs.readFileSync(
    path.resolve("./src/app/(dashboard)/dashboard/settings/page.tsx"),
    "utf-8"
  );
  const usersProfileSrc = fs.readFileSync(path.resolve("./src/app/users/[username]/page.tsx"), "utf-8");
  const teamMemberSrc = fs.readFileSync(path.resolve("./src/app/team/[username]/page.tsx"), "utf-8");
  const teamDirSrc = fs.readFileSync(path.resolve("./src/app/team/page.tsx"), "utf-8");
  const homeSrc = fs.readFileSync(path.resolve("./src/app/page.tsx"), "utf-8");

  assert.ok(profileEditSrc.includes("<BannerUploadCard"), "Profile edit page must render BannerUploadCard");
  assert.ok(settingsSrc.includes("<BannerUploadCard"), "Settings page must render BannerUploadCard");
  assert.ok(usersProfileSrc.includes("<ProfileHeroCover"), "/users/[username] must use shared ProfileHeroCover");
  assert.ok(teamMemberSrc.includes("<ProfileHeroCover"), "/team/[username] must use shared ProfileHeroCover");

  assert.ok(!teamDirSrc.includes("aspect-[16/10]"), "/team portraits must not crop faces with mobile aspect-[16/10]");
  assert.ok(!homeSrc.includes("aspect-[16/10]"), "Homepage portraits must not crop faces with mobile aspect-[16/10]");
  assert.ok(teamDirSrc.includes("<UserAvatar"), "/team cards must use UserAvatar multi-step fallback");
  assert.ok(homeSrc.includes("<UserAvatar"), "Homepage team cards must use UserAvatar multi-step fallback");
});

test("Username Change Card, Validation Helper & API Client Are Wired", () => {
  const usernameHelperPath = path.resolve("./src/lib/username.ts");
  const usernameCardPath = path.resolve("./src/components/settings/UsernameChangeCard.tsx");
  const authApiSrc = fs.readFileSync(path.resolve("./src/lib/api/auth.ts"), "utf-8");
  const mediaSrc = fs.readFileSync(path.resolve("./src/lib/media.ts"), "utf-8");
  const profileEditSrc = fs.readFileSync(
    path.resolve("./src/app/(dashboard)/dashboard/profile/page.tsx"),
    "utf-8"
  );
  const settingsSrc = fs.readFileSync(
    path.resolve("./src/app/(dashboard)/dashboard/settings/page.tsx"),
    "utf-8"
  );
  const registerSrc = fs.readFileSync(path.resolve("./src/app/(auth)/register/page.tsx"), "utf-8");

  assert.ok(fs.existsSync(usernameHelperPath), "Shared username validation helper must exist");
  assert.ok(fs.existsSync(usernameCardPath), "Reusable UsernameChangeCard component must exist");
  assert.ok(authApiSrc.includes("checkUsernameAvailability"), "authApi must expose checkUsernameAvailability");
  assert.ok(authApiSrc.includes("updateUsername"), "authApi must expose updateUsername");
  assert.ok(mediaSrc.includes("getTeamPortraitFallback"), "media.ts must expose shared team portrait fallback");
  assert.ok(profileEditSrc.includes("<UsernameChangeCard"), "Profile edit page must render UsernameChangeCard");
  assert.ok(settingsSrc.includes("<UsernameChangeCard"), "Settings page must render UsernameChangeCard");
  assert.ok(registerSrc.includes("checkUsernameAvailability"), "Register page must check live username availability");

  const usernameHelperSrc = fs.readFileSync(usernameHelperPath, "utf-8");
  assert.ok(
    usernameHelperSrc.includes("getContributorUsernameConflict"),
    "username.ts must enforce official contributor handle ownership rules"
  );
  assert.ok(
    /shopnil\s*:/.test(usernameHelperSrc) && usernameHelperSrc.includes('"medinex-admin"'),
    "username.ts must protect official contributor and admin handles"
  );
});

test("Dashboard Hero Buttons & Cover Preview Card Avoid Text Contrast Conflicts", () => {
  const dashboardSrc = fs.readFileSync(
    path.resolve("./src/app/(dashboard)/dashboard/page.tsx"),
    "utf-8"
  );
  const bannerCardSrc = fs.readFileSync(
    path.resolve("./src/components/settings/BannerUploadCard.tsx"),
    "utf-8"
  );
  const bannerModalSrc = fs.readFileSync(
    path.resolve("./src/components/settings/BannerCropUploadModal.tsx"),
    "utf-8"
  );

  assert.ok(
    !/variant="outline"[^>]*text-slate-[123]00/.test(dashboardSrc),
    "Dashboard dark hero buttons must not use light text on white outline variant"
  );
  assert.ok(
    !bannerCardSrc.includes("flex items-end gap-3 -mt-6"),
    "BannerUploadCard name row must not pull dark text upward over dark cover banner"
  );
  assert.ok(
    !bannerModalSrc.includes("-mt-8 sm:-mt-10 flex items-end"),
    "BannerCropUploadModal name row must keep negative offset scoped to avatar only"
  );
});
