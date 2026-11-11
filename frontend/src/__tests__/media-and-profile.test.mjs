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
