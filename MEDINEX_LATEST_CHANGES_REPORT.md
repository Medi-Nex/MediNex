# MediNex — Latest Changes & Implementation Report

**Repository:** `e:/Project/MediNex`  
**Branch:** `main` (tracked with `origin/main`)  
**Baseline Commit:** `142aa7b` (`fix(release): resolve schema drift, project/team authorization, role names, and context path`)  
**Inspected HEAD Commit:** `7663aa8` (`feat(profiles,media): add multi-resolution avatar uploads and clickable user profiles`, `2026-11-11 08:08:20 +0600`)  
**Audit Date:** November 11, 2026  
**Scope:** Forensic Git diff analysis, architecture & implementation review, security & regression audit, and live verification across backend, frontend, PostgreSQL/Flyway, and Docker Compose since commit `142aa7b`.

---

## 1. Executive Summary

Between baseline release commit `142aa7b` and current `HEAD` (`7663aa8`), **9 commits** were added on `main`, touching **65 unique files** (**48 modified**, **17 added**, **0 deleted**, **0 renamed**) with **+3,885 insertions / -224 deletions**. At the start of inspection, the Git working tree had **0 uncommitted changes**; `.env` and `frontend/.env.local` exist locally as gitignored runtime configuration files.

Four functional and operational themes define this release window:
1. **Release Audit Documentation & Team Data Alignment (`10564d0`, `7e5f8f3`):** Added five release/security audit Markdown deliverables and updated contributor skills in `frontend/src/lib/team-data.ts` (note: commit `7e5f8f3` is titled `"fix(release): resolve schema drift"` despite modifying only `team-data.ts`).
2. **Docker Build-Arg Inlining, Port Alignment, CORS & Live Gmail SMTP (`541b7b9`, `c6029ad`, `8d322dd`):** Resolved cross-origin browser failures on `localhost:3002 -> localhost:8082`, added `frontend/.dockerignore`, baked `NEXT_PUBLIC_*` build arguments into `frontend/Dockerfile`, bound Spring Mail properties to Gmail SMTP (`medinexbd.noreply@gmail.com`), and aligned `.env.example` ports (`3002` / `8082` / `8083` / `5434`).
3. **6-Digit Email OTP Verification & 2-Minute Resend Cooldown (`e2a632e`, `65c463b`, `4888471`):** Replaced raw hex token confirmation with a 6-digit `SecureRandom` numeric OTP (`10m` expiry, `SHA-256(userId:otp)` hashed storage, constant-time digest comparison, `MAX_OTP_FAILED_ATTEMPTS = 5` lockout returning HTTP `429`), Flyway migration `V5`, `POST /api/v1/auth/resend-verification` with a server/client 120-second cooldown, and direct post-signup navigation to `/verify-email`.
4. **Multi-Resolution Profile Avatars & Public User Profiles (`7663aa8`):** Built server-side Java2D/ImageIO avatar validation, EXIF-stripping RGB re-encoding, and progressive center-cropped variant generation (`64x64` `sm`, `256x256` `md`, `512x512` `lg` JPEGs), static media serving under `/uploads/**` backed by Docker volume `medinex_uploads`, `POST/DELETE /api/v1/users/profile/avatar`, the public `/users/[username]` route, and clickable `UserAvatar` / profile links across navigation, community feed, post details, following/followers, notifications, team cards, and settings.

### Verification Snapshot (Directly Executed)
- **Backend Automated Tests (`mvn test`):** **49 / 49 passing** across 10 test classes (0 failures, 0 errors, 0 skipped; H2 in-memory profile `test`).
- **Frontend Tests (`npm test`):** **7 / 7 passing** (`node --test src/__tests__/*.test.mjs`).
- **Frontend TypeScript (`npx tsc --noEmit`):** **Pass** (exit code `0`).
- **Frontend ESLint (`npx eslint src/`):** **Pass** (exit code `0`); **`npm run lint` still fails** (exit code `1`, `ISSUE-007`: Next.js 16 interprets `next lint` argument `lint` as a directory path).
- **Frontend Production Build (`npm run build`):** **Pass** (Next.js 16.4.6 Turbopack; 37 routes generated cleanly).
- **Docker Build & Stack (`docker compose build`, `docker compose ps`):** **Pass** (`medinex-backend`, `medinex-frontend`, `medinex-postgres`, `medinex-mailpit` all `Up` and `(healthy)`).
- **Flyway & Hibernate Validation (Live PostgreSQL 16.4):** **Pass** (`V1`–`V5` all `success = t` in `flyway_schema_history`; `ddl-auto: validate` starts cleanly).
- **Important Caveat & Audit Findings:** Live Gmail SMTP delivery to an external inbox was **not triggered** in this read-only audit (only Mailpit empty queue and container `MAIL_PASSWORD` non-zero 16-byte configuration were verified). Security & regression review identified **plaintext OTP/reset token logging** at `INFO` level in `EmailService`, **case-sensitive username lookup** in `CommunityService` and `FollowService` causing `HTTP 404` on mixed-case `/users/{username}` stats/posts, **missing server-side enforcement of `isPublicVisible = false`** on `GET /api/v1/users/{username}` and `GET /api/v1/community/users/{username}/posts`, and **documentation drift** across earlier release docs.

---

## 2. Git Change Summary

### 2.1 Repository Status & Baseline Verification
- **Branch & Sync:** `main` at `7663aa857e2330a9a7a74034965b7602d4635cf8`, matching `origin/main`.
- **Baseline:** `142aa7b` is present and valid in commit history.
- **Uncommitted Working Tree Changes:** None before report creation (`MEDINEX_LATEST_CHANGES_REPORT.md` created as the sole new untracked file; `.env`, `frontend/.env.local`, and `frontend/.next/` remain gitignored).

### 2.2 Commit Chronology (`142aa7b..HEAD`)

| # | Hash | Timestamp (`+0600`) | Subject | Files Changed | Diff Stat |
| :-: | :--- | :--- | :--- | :---: | :--- |
| 1 | `10564d0` | `2026-11-11 06:03:21` | `docs(audit): update release deliverables with blocker remediation and Docker verification` | 5 | `+871 / -0` |
| 2 | `7e5f8f3` | `2026-11-11 06:04:42` | `fix(release): resolve schema drift` | 1 | `+7 / -2` |
| 3 | `541b7b9` | `2026-11-11 06:11:20` | `fix(docker): inline frontend API URL build args, expand CORS origins, and add frontend .dockerignore` | 4 | `+35 / -5` |
| 4 | `c6029ad` | `2026-11-11 06:52:28` | `feat(mail): configure Gmail SMTP delivery with medinexbd.noreply@gmail.com` | 6 | `+65 / -18` |
| 5 | `8d322dd` | `2026-11-11 06:59:55` | `fix(env): align .env.example defaults with compose ports and CORS` | 1 | `+7 / -6` |
| 6 | `e2a632e` | `2026-11-11 07:07:52` | `feat(auth-ui): redirect directly to email verification page after signup` | 2 | `+31 / -9` |
| 7 | `65c463b` | `2026-11-11 07:32:06` | `feat(auth): add verification code resend with 2-minute cooldown` | 9 | `+283 / -20` |
| 8 | `4888471` | `2026-11-11 07:45:51` | `feat(auth): switch email verification to 6-digit OTP with attempt lockout` | 10 | `+262 / -56` |
| 9 | `7663aa8` | `2026-11-11 08:08:20` | `feat(profiles,media): add multi-resolution avatar uploads and clickable user profiles` | 44 | `+2361 / -145` |
| **Total** | **`142aa7b..7663aa8`** | **—** | **Cumulative unique net diff** | **65 unique** | **`+3885 / -224`** |

> **Discrepancy Note (`7e5f8f3`):** Commit `7e5f8f3` carries the commit message `fix(release): resolve schema drift`, but its actual diff modifies only [`frontend/src/lib/team-data.ts`](file:///e:/Project/MediNex/frontend/src/lib/team-data.ts) (`+7/-2` lines reordering `contributor-04` skills and populating `contributor-05` skills). No database schema, Flyway, or Hibernate files were altered in `7e5f8f3`.

### 2.3 Complete File Inventory (`142aa7b..HEAD`, 65 Files)

#### Added Files (`17`)
- **Documentation & Audits (`5`):**
  - [`MEDINEX_DEPLOYMENT_GUIDE.md`](file:///e:/Project/MediNex/MEDINEX_DEPLOYMENT_GUIDE.md) (`10564d0`)
  - [`MEDINEX_FINAL_RELEASE_AUDIT.md`](file:///e:/Project/MediNex/MEDINEX_FINAL_RELEASE_AUDIT.md) (`10564d0`)
  - [`MEDINEX_KNOWN_ISSUES.md`](file:///e:/Project/MediNex/MEDINEX_KNOWN_ISSUES.md) (`10564d0`, modified in `541b7b9`)
  - [`MEDINEX_SECURITY_AUDIT.md`](file:///e:/Project/MediNex/MEDINEX_SECURITY_AUDIT.md) (`10564d0`)
  - [`MEDINEX_STAGING_CHECKLIST.md`](file:///e:/Project/MediNex/MEDINEX_STAGING_CHECKLIST.md) (`10564d0`)
- **Docker / DevOps (`1`):**
  - [`frontend/.dockerignore`](file:///e:/Project/MediNex/frontend/.dockerignore) (`541b7b9`)
- **Backend Java, Migration & Tests (`6`):**
  - [`backend/src/main/java/com/medinex/auth/dto/ResendVerificationRequest.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/auth/dto/ResendVerificationRequest.java) (`65c463b`)
  - [`backend/src/main/java/com/medinex/config/WebMvcConfig.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/config/WebMvcConfig.java) (`7663aa8`)
  - [`backend/src/main/java/com/medinex/user/service/AvatarImageService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/user/service/AvatarImageService.java) (`7663aa8`)
  - [`backend/src/main/java/com/medinex/user/service/AvatarUrlHelper.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/user/service/AvatarUrlHelper.java) (`7663aa8`)
  - [`backend/src/main/resources/db/migration/V5__add_otp_attempts_to_verification_tokens.sql`](file:///e:/Project/MediNex/backend/src/main/resources/db/migration/V5__add_otp_attempts_to_verification_tokens.sql) (`4888471`)
  - [`backend/src/test/java/com/medinex/user/AvatarUploadIntegrationTest.java`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/user/AvatarUploadIntegrationTest.java) (`7663aa8`)
- **Frontend Routes, Components, Utilities & Tests (`5`):**
  - [`frontend/src/app/users/[username]/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/users/[username]/page.tsx) (`7663aa8`)
  - [`frontend/src/components/settings/AvatarUploadCard.tsx`](file:///e:/Project/MediNex/frontend/src/components/settings/AvatarUploadCard.tsx) (`7663aa8`)
  - [`frontend/src/components/ui/UserAvatar.tsx`](file:///e:/Project/MediNex/frontend/src/components/ui/UserAvatar.tsx) (`7663aa8`)
  - [`frontend/src/lib/media.ts`](file:///e:/Project/MediNex/frontend/src/lib/media.ts) (`7663aa8`)
  - [`frontend/src/__tests__/media-and-profile.test.mjs`](file:///e:/Project/MediNex/frontend/src/__tests__/media-and-profile.test.mjs) (`7663aa8`)

#### Modified Files (`48`)
- **Infrastructure, Config & Environment (`6`):**
  - [`.env.example`](file:///e:/Project/MediNex/.env.example) (`c6029ad`, `8d322dd`)
  - [`compose.yaml`](file:///e:/Project/MediNex/compose.yaml) (`541b7b9`, `c6029ad`, `7663aa8`)
  - [`backend/Dockerfile`](file:///e:/Project/MediNex/backend/Dockerfile) (`7663aa8`)
  - [`backend/src/main/resources/application.yml`](file:///e:/Project/MediNex/backend/src/main/resources/application.yml) (`c6029ad`, `7663aa8`)
  - [`backend/src/test/resources/application-test.yml`](file:///e:/Project/MediNex/backend/src/test/resources/application-test.yml) (`7663aa8`)
  - [`frontend/Dockerfile`](file:///e:/Project/MediNex/frontend/Dockerfile) (`541b7b9`)
  - *(Plus `frontend/next.config.ts` listed below under Frontend)* — total Config/Infra files modified: 6 infra + `next.config.ts`
- **Backend Java & Tests (`21`):**
  - Auth & Mail: [`AuthController.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/auth/controller/AuthController.java), [`UserDto.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/auth/dto/UserDto.java), [`VerifyEmailRequest.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/auth/dto/VerifyEmailRequest.java), [`EmailVerificationToken.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/auth/entity/EmailVerificationToken.java), [`EmailVerificationTokenRepository.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/auth/repository/EmailVerificationTokenRepository.java), [`AuthService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/auth/service/AuthService.java), [`EmailService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/common/email/EmailService.java), [`AuthIntegrationTest.java`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/auth/AuthIntegrationTest.java)
  - Security & Exceptions: [`SecurityConfig.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/config/SecurityConfig.java), [`GlobalExceptionHandler.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/common/exception/GlobalExceptionHandler.java)
  - Users, Team, Community, Follow & Notifications: [`UserController.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/user/controller/UserController.java), [`UserService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/user/service/UserService.java), [`PostDto.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/community/dto/PostDto.java), [`CommentDto.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/community/dto/CommentDto.java), [`CommunityService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/community/service/CommunityService.java), [`FollowUserDto.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/follow/dto/FollowUserDto.java), [`FollowService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/follow/service/FollowService.java), [`NotificationDto.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/notification/dto/NotificationDto.java), [`NotificationService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/notification/service/NotificationService.java), [`TeamController.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/team/controller/TeamController.java), [`TeamMemberDto.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/team/dto/TeamMemberDto.java) *(21 backend Java/test files modified)*
- **Frontend Next.js & TypeScript (`21`):**
  - Config, Types & API Clients: [`frontend/next.config.ts`](file:///e:/Project/MediNex/frontend/next.config.ts), [`frontend/src/types/index.ts`](file:///e:/Project/MediNex/frontend/src/types/index.ts), [`frontend/src/lib/team-data.ts`](file:///e:/Project/MediNex/frontend/src/lib/team-data.ts), [`frontend/src/lib/api/auth.ts`](file:///e:/Project/MediNex/frontend/src/lib/api/auth.ts), [`frontend/src/lib/api/client.ts`](file:///e:/Project/MediNex/frontend/src/lib/api/client.ts), [`frontend/src/lib/api/community.ts`](file:///e:/Project/MediNex/frontend/src/lib/api/community.ts), [`frontend/src/lib/api/follow.ts`](file:///e:/Project/MediNex/frontend/src/lib/api/follow.ts), [`frontend/src/lib/api/notifications.ts`](file:///e:/Project/MediNex/frontend/src/lib/api/notifications.ts)
  - Pages & Components: [`Navbar.tsx`](file:///e:/Project/MediNex/frontend/src/components/layout/Navbar.tsx), [`(auth)/forgot-password/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/(auth)/forgot-password/page.tsx), [`(auth)/register/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/(auth)/register/page.tsx), [`(auth)/verify-email/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/(auth)/verify-email/page.tsx), [`(dashboard)/dashboard/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/(dashboard)/dashboard/page.tsx), [`(dashboard)/dashboard/profile/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/(dashboard)/dashboard/profile/page.tsx), [`(dashboard)/dashboard/settings/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/(dashboard)/dashboard/settings/page.tsx), [`(dashboard)/dashboard/following/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/(dashboard)/dashboard/following/page.tsx), [`(dashboard)/dashboard/notifications/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/(dashboard)/dashboard/notifications/page.tsx), [`community/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/community/page.tsx), [`community/posts/[id]/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/community/posts/[id]/page.tsx), [`team/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/team/page.tsx), [`team/[username]/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/team/[username]/page.tsx)

*(Count verification: `6 infra/root + 21 backend modified + 21 frontend modified = 48 M` + `17 A` = `65` total unique files.)*

---

## 3. New Features

### 3.1 6-Digit Email Verification OTP with Lockout & 2-Minute Resend (`65c463b`, `4888471`, `e2a632e`)
- **What & Why:** Replaced the legacy 24-character hex verification token with an industry-standard 6-digit numeric OTP flow, immediate post-registration redirection to `/verify-email`, and a 2-minute resend throttle so real users receive short manual codes cleanly over email without token copy-paste friction or brute-force exposure.
- **How It Works:**
  - [`AuthService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/auth/service/AuthService.java) generates a zero-padded 6-digit code via `SecureRandom.nextInt(1_000_000)` (`OTP_EXPIRATION_MINUTES = 10`, `MAX_OTP_FAILED_ATTEMPTS = 5`, `RESEND_VERIFICATION_COOLDOWN_SECONDS = 120`).
  - Stored hash binds the OTP to user identity (`SHA-256` of `userId + ":" + otp` via `JwtTokenProvider.hashToken`), verified with constant-time `MessageDigest.isEqual`.
  - `@Transactional(noRollbackFor = AppException.class)` ensures `failed_attempts` persists across failed verification exceptions; reaching 5 failed attempts locks the code (`HTTP 429 TOO_MANY_REQUESTS`).
  - `POST /api/v1/auth/resend-verification` deletes prior verification tokens after confirming `120s` has elapsed since `latestToken.createdAt`, returning remaining wait seconds (`HTTP 429`) during cooldown and an anti-enumeration `200 OK` message for nonexistent or already-verified addresses.
  - Frontend [`verify-email/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/(auth)/verify-email/page.tsx) uses `<Suspense>`, `inputMode="numeric"`, `autoComplete="one-time-code"`, `sessionStorage` key `medinex_resend_until_<email>` for client countdown persistence across refreshes, and synchronizes countdown state when the backend responds `HTTP 429` with `"wait X second..."`.
- **Completeness:** End-to-end backend + frontend implemented and tested in `AuthIntegrationTest`. Live third-party Gmail delivery depends on runtime SMTP credentials (not invoked in this read-only audit).

### 3.2 Multi-Resolution Avatar Upload, Processing & Static Serving (`7663aa8`)
- **What & Why:** Added user profile photo management in Settings and Edit Profile with automated server-side cropping and downscaling into three optimized JPEG variants (`64x64` `sm`, `256x256` `md`, `512x512` `lg`) so compact slots (navbar pills, comments, replies, notifications) load tiny thumbnails instead of oversized images.
- **How It Works:**
  - [`AvatarImageService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/user/service/AvatarImageService.java) enforces `MAX_UPLOAD_BYTES = 5 MB`, inspects binary image readers via `ImageIO.getImageReaders` (accepting only decoded `jpeg`/`jpg`/`png`/`gif`/`bmp`, rejecting spoofed headers/non-images), enforces bounds `16x16` to `4096x4096`, composites alpha over white into `BufferedImage.TYPE_INT_RGB` (stripping EXIF/camera metadata), center-crops to square, applies progressive step-down halving bicubic scaling (`64px` quality `0.88f`, `256px` quality `0.90f`, `512px` quality `0.92f`), writes to `<uploadDir>/avatars/<userId>/<uuid>-{sm,md,lg}.jpg`, and removes stale avatar files in the user directory.
  - [`AvatarUrlHelper.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/user/service/AvatarUrlHelper.java) derives `-sm` / `-md` / `-lg` variant URLs uniformly from canonical `user_profiles.avatar_url` without altering the database schema.
  - [`WebMvcConfig.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/config/WebMvcConfig.java) exposes `/uploads/**` from `${medinex.storage.upload-dir:./uploads}` with `Cache-Control: max-age=86400`; [`SecurityConfig.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/config/SecurityConfig.java#L85) permits anonymous `GET /uploads/**`.
  - [`AvatarUploadCard.tsx`](file:///e:/Project/MediNex/frontend/src/components/settings/AvatarUploadCard.tsx) validates types/sizes client-side, converts `image/webp` to `image/png` in browser `<canvas>` before upload (`normalizeWebpIfNeeded`), previews the image, displays the generated 64px / 256px / 512px badges, and supports deletion.
  - [`UserAvatar.tsx`](file:///e:/Project/MediNex/frontend/src/components/ui/UserAvatar.tsx) + [`media.ts`](file:///e:/Project/MediNex/frontend/src/lib/media.ts) pick variant URLs (`xs`/`sm` -> `smUrl`, `md` -> `mdUrl`, `lg`/`xl` -> `lgUrl`) and resolve `/uploads/...` against `NEXT_PUBLIC_API_BASE_URL` origin.
- **Verified Live Output:** Existing user `jihadjkhan` avatar files served from live container HTTP `200`, `Content-Type: image/jpeg`, `Cache-Control: max-age=86400`: `-sm.jpg` (`2,875` bytes), `-md.jpg` (`27,838` bytes), `-lg.jpg` (`79,518` bytes).

### 3.3 Public User Profile Route `/users/[username]` & Clickable Profiles (`7663aa8`)
- **What & Why:** Previously, clicking authors on community posts or notifications linked to `/team/[username]` or was plain unlinked text, which broke for non-team community members. Added a dedicated public innovator profile page for any registered user.
- **How It Works:**
  - [`frontend/src/app/users/[username]/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/users/[username]/page.tsx) (529 lines) fetches `GET /api/v1/users/{username}`, follow stats (`/follow-stats`), and recent public posts (`/community/users/{username}/posts`), displays follower/following counts, bio, university, skills, responsibilities, social links, posts tab, `FollowButton`, and falls back to `INITIAL_TEAM_MEMBERS` if offline/static seed only.
  - [`team/[username]/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/team/[username]/page.tsx) redirects non-team usernames fetched from `/api/v1/users/{username}` to `/users/{username}` and renders uploaded `UserAvatar` variants when available.
  - Clickable profile links and multi-resolution `UserAvatar` were wired into [`Navbar.tsx`](file:///e:/Project/MediNex/frontend/src/components/layout/Navbar.tsx), [`community/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/community/page.tsx), [`community/posts/[id]/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/community/posts/[id]/page.tsx), [`dashboard/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/(dashboard)/dashboard/page.tsx), [`dashboard/following/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/(dashboard)/dashboard/following/page.tsx), [`dashboard/notifications/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/(dashboard)/dashboard/notifications/page.tsx), [`team/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/team/page.tsx), [`dashboard/profile/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/(dashboard)/dashboard/profile/page.tsx), and [`dashboard/settings/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/(dashboard)/dashboard/settings/page.tsx).

---

## 4. Modified Features

- **Registration & Verification Flow (`e2a632e`, `65c463b`, `4888471`):**
  - [`register/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/(auth)/register/page.tsx): Redirects immediately on `201 Created` to `/verify-email?email=<encoded>&sent=1`.
  - [`dashboard/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/(dashboard)/dashboard/page.tsx#L123): Unverified account banner passes `?email=<encoded>` into `/verify-email`.
  - [`forgot-password/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/(auth)/forgot-password/page.tsx): Updated copy from Mailpit-only guidance to Gmail inbox/spam check alongside `medinexbd.noreply@gmail.com`.
- **Gmail SMTP Transport Integration (`c6029ad`):**
  - [`application.yml`](file:///e:/Project/MediNex/backend/src/main/resources/application.yml#L45-L66) and [`compose.yaml`](file:///e:/Project/MediNex/compose.yaml#L55-L62) now explicitly bind `spring.mail.host` (`smtp.gmail.com`), `port` (`587`), `username` (`medinexbd.noreply@gmail.com`), `password` (`MAIL_PASSWORD`), `smtp.auth`, `smtp.starttls.enable/required`, `5000ms` timeouts, and `management.health.mail.enabled: false` (so container healthcheck does not fail if SMTP server is temporarily unreachable).
  - [`EmailService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/common/email/EmailService.java) formats `From` as `"MediNex Platform <medinexbd.noreply@gmail.com>"`, and skips live SMTP safely if `smtpAuth` is enabled with blank `MAIL_PASSWORD` (falling back to simulation log for local/CI tests).
- **Dashboard Profile Hydration (`7663aa8`):**
  - [`dashboard/profile/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/(dashboard)/dashboard/profile/page.tsx#L45-L58) now pre-populates `headline`, `designation`, `department`, `university`, `bio`, `skills`, `portfolioUrl`, `githubUrl`, and `linkedinUrl` from `user` (`useAuth()`) instead of initializing only `fullName`, and embeds `<AvatarUploadCard compact />`.
- **Public Profile DTO Redaction & User DTO Expansion (`7663aa8`):**
  - [`UserDto.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/auth/dto/UserDto.java#L63-L100) added `avatarSmUrl`, `avatarLgUrl`, and `UserDto.fromPublicEntity(User)` which redacts `email` (`null`), used by [`UserService.getUserByUsername`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/user/service/UserService.java#L27-L32).
  - [`FollowRequestDto`](file:///e:/Project/MediNex/frontend/src/lib/api/follow.ts#L46-L54) made `requester.email` optional and added `avatarSmUrl`/`avatarLgUrl`.
- **HTTP Client FormData Support (`7663aa8`):**
  - [`client.ts`](file:///e:/Project/MediNex/frontend/src/lib/api/client.ts#L31-L36) omits `Content-Type: application/json` when `options.body instanceof FormData` so the browser sets multipart boundary headers automatically.
- **Team Static Data (`7e5f8f3`) & Live Synchronization (`7663aa8`):**
  - [`team-data.ts`](file:///e:/Project/MediNex/frontend/src/lib/team-data.ts) updated `contributor-04` and `contributor-05` skill arrays.
  - [`team/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/team/page.tsx#L31-L55) fetches `/team/members` on mount to overlay live DB names, bios, and uploaded avatars over static fallback cards.

---

## 5. Removed Features

- **Removed Inline Post-Registration Token Confirmation Box (`e2a632e`):** On `/register`, the intermediate static card instructing users to confirm a hex token from Mailpit was removed in favor of routing directly to `/verify-email`.
- **Removed Single-Field Legacy Hex Token Verification Payload (`4888471`):**
  - While [`VerifyEmailRequest.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/auth/dto/VerifyEmailRequest.java#L18-L25) retains `@JsonAlias("token")` on the `otp` field for partial backward compatibility, both `email` (`@Email @NotBlank`) and a strictly 6-digit numeric code (`@Pattern(regexp = "^\\d{6}$")`) are now enforced. Legacy calls posting `{ "token": "<24-char hex>" }` without `email` or with non-6-digit format now fail with `HTTP 400 Validation failed`.
- **Deleted Files / Dropped Endpoints / Removed Services:** **0** files deleted (`git diff --diff-filter=DR` returned empty); no backend routes, database tables, or Docker services were removed.

---

## 6. Architecture Changes

1. **Email Transport Shift (Simulated/Mailpit Default -> Gmail SMTP with Fallback):**
   - Runtime email switched from implicit Mailpit-by-default (`spring.mail.*` previously unbound per `ISSUE-012`) to explicit `smtp.gmail.com:587` TLS configuration, retaining Mailpit in `compose.yaml` as an idle local testing container (`MAIL_HOST=mailpit`, `MAIL_PORT=1025`, `MAIL_SMTP_AUTH=false` can still opt in via `.env`).
2. **Storage Topology Update (Container-Local Disk + Named Docker Volume `medinex_uploads`):**
   - Rather than streaming avatars into the optional MinIO S3 service (`profile: storage`), avatar binaries are stored locally on container disk at `/app/uploads/avatars/<userId>/` backed by named volume [`medinex_uploads`](file:///e:/Project/MediNex/compose.yaml#L176-L177) and served directly by Spring MVC [`WebMvcConfig`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/config/WebMvcConfig.java) under `/uploads/**`. [`backend/Dockerfile`](file:///e:/Project/MediNex/backend/Dockerfile#L51-L52) pre-creates `/app/uploads` owned by non-root `appuser:appgroup` (`10001`).
   - Implication: Zero external S3 dependency for core deployments, but creates stateful coupling to a single volume unless migrated to shared object storage (MinIO/S3) before multi-instance horizontal scaling.
3. **Docker Frontend Build-Time Env & Context Optimization:**
   - [`frontend/Dockerfile`](file:///e:/Project/MediNex/frontend/Dockerfile#L25-L31) accepts `ARG`/`ENV NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_TAGLINE`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_BASE_URL` supplied by `compose.yaml` so the Next.js production bundle does not bake fallback `localhost:8080` API URLs when host runs on port `8082`.
   - [`frontend/.dockerignore`](file:///e:/Project/MediNex/frontend/.dockerignore) excludes `node_modules`, `.next`, `.env*.local`, test reports, and logs (verified build context transfer in `docker compose build`: `6.64kB`).
4. **CSP Expansion (`frontend/next.config.ts`):**
   - [`frontend/next.config.ts`](file:///e:/Project/MediNex/frontend/next.config.ts#L34) expanded `img-src` from `https://images.unsplash.com https://avatars.githubusercontent.com` to include `http://localhost:8080 http://127.0.0.1:8080 http://localhost:8082 http://127.0.0.1:8082 https:` so uploaded `/uploads/**` images from backend port `8082` (or HTTPS media origins) render without Content Security Policy blocks.

---

## 7. Database Changes

### 7.1 New Flyway Migration (`V5`)
- **File:** [`backend/src/main/resources/db/migration/V5__add_otp_attempts_to_verification_tokens.sql`](file:///e:/Project/MediNex/backend/src/main/resources/db/migration/V5__add_otp_attempts_to_verification_tokens.sql)
- **DDL:**
  ```sql
  ALTER TABLE email_verification_tokens
      ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0;
  ```
- **Entity Alignment:** [`EmailVerificationToken.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/auth/entity/EmailVerificationToken.java#L34-L36) adds `@Column(name = "failed_attempts", nullable = false) private int failedAttempts = 0;`.
- **Repository Change:** [`EmailVerificationTokenRepository.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/auth/repository/EmailVerificationTokenRepository.java) adds `List<EmailVerificationToken> findAllByUserIdOrderByCreatedAtDesc(UUID userId)`.
- **Migration Safety:** Forward-only, idempotent (`IF NOT EXISTS`), non-destructive (`DEFAULT 0`), backwards-safe with existing rows, no table rewrites or locks beyond instant column metadata add in PostgreSQL 16.

### 7.2 Live PostgreSQL Verification (`medinex-postgres`)
- Verified `flyway_schema_history`:

| Rank | Version | Description | Type | Success |
| :-: | :--- | :--- | :--- | :-: |
| `1` | `1` | `init schema` | `SQL` | `t` |
| `2` | `2` | `performance indexes` | `SQL` | `t` |
| `3` | `3` | `align collection tables` | `SQL` | `t` |
| `4` | `4` | `align role names` | `SQL` | `t` |
| `5` | `5` | `add otp attempts to verification tokens` | `SQL` | `t` |

- Verified `\d email_verification_tokens` confirms `failed_attempts | integer | not null | default 0`, alongside `roles` (`ROLE_ADMIN`, `ROLE_MODERATOR`, `ROLE_SUPER_ADMIN`, `ROLE_USER`).
- Note on Avatar Schema: `user_profiles.avatar_url` column length/type was unchanged; canonical `-md.jpg` URL is persisted there and `-sm` / `-lg` URLs are computed dynamically in DTOs via `AvatarUrlHelper`.

---

## 8. API Changes

### 8.1 New Endpoints

| Method & Path | Auth | Request / Input | Response | Behavior / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `POST /api/v1/auth/resend-verification` | Public (`permitAll`) | JSON `{ "email": "..." }` (`@NotBlank @Email`) | `200 OK` generic message; `429` with wait seconds inside cooldown | Enforces 120s cooldown per latest token; deletes prior tokens on reissue; generic `200` on unknown/already-verified email |
| `POST /api/v1/users/profile/avatar` | Authenticated (`isAuthenticated()`) | `multipart/form-data` part `"file"` (<= 5MB JPEG/PNG/GIF/BMP) | `200 OK` `ApiResponse<UserDto>` (with `avatarUrl`, `avatarSmUrl`, `avatarLgUrl`); `400` invalid image/part; `401` anon; `413` >5MB | Processes 64px / 256px / 512px JPEGs on disk; strips EXIF; cleans old user avatars |
| `DELETE /api/v1/users/profile/avatar` | Authenticated (`isAuthenticated()`) | Bearer JWT | `200 OK` `ApiResponse<UserDto>` (`avatar*Url = null`); `401` anon | Removes stored avatar variants from user folder and nulls `user_profiles.avatar_url` |
| `GET /uploads/**` | Public (`permitAll`) | Static resource path (e.g., `/uploads/avatars/<uuid>/<file>-sm.jpg`) | `200 OK` `image/jpeg`, `Cache-Control: max-age=86400`; `404` missing | Served via Spring MVC `ResourceHandlerRegistry` |

### 8.2 Modified Endpoints & Payloads
- **`POST /api/v1/auth/verify-email`:** Now requires `{ "email": "...", "otp": "123456" }` (`otp` supports `@JsonAlias("token")`, must match `^\d{6}$`). Tracks `failed_attempts`, returning `400` (`N attempt(s) remaining`) up to attempt 4 and `429 TOO_MANY_REQUESTS` on attempt 5. **Breaking change** for callers omitting `email` or passing legacy hex tokens.
- **`POST` / `GET` Multi-Resolution Avatar DTO Fields (`7663aa8`):**
  - [`UserDto`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/auth/dto/UserDto.java): added `avatarSmUrl`, `avatarLgUrl`. **`GET /api/v1/users/{username}`** now serializes `email: null` via `UserDto.fromPublicEntity`.
  - [`PostDto`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/community/dto/PostDto.java), [`CommentDto`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/community/dto/CommentDto.java): added `authorAvatarSmUrl`, `authorAvatarLgUrl`.
  - [`FollowUserDto`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/follow/dto/FollowUserDto.java), [`TeamMemberDto`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/team/dto/TeamMemberDto.java): added `avatarSmUrl`, `avatarLgUrl`.
  - [`NotificationDto`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/notification/dto/NotificationDto.java): added `actorAvatarSmUrl`.
- **Exception Handling ([`GlobalExceptionHandler.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/common/exception/GlobalExceptionHandler.java#L61-L74)):** Added explicit handlers for `MaxUploadSizeExceededException` (`413 PAYLOAD_TOO_LARGE`) and `MissingServletRequestPartException` (`400 BAD_REQUEST`).

---

## 9. Security Changes

### 9.1 Controls Added Since `142aa7b`
1. **Cryptographic OTP Hashing & Attempt Lockout (`4888471`):**
   - 6-digit codes generated with `SecureRandom`, salted per user (`SHA-256(userId + ":" + otp)`), verified with constant-time `MessageDigest.isEqual`, expiring in 10 minutes, locked at 5 wrong guesses (`429`), and rate-throttled on resend (`120s`).
2. **Email Redaction on Public Profile Lookups (`7663aa8`):**
   - Verified live: `GET /api/v1/users/contributor-01` and `GET /api/v1/users/jihadjkhan` return `"email": null` via `UserDto.fromPublicEntity` (while authenticated `POST /auth/login` and `GET /auth/me` continue returning the user's own email via `UserDto.fromEntity`).
3. **Multipart & Image Upload Hardening (`7663aa8`):**
   - Strictly authenticated (`@PreAuthorize("isAuthenticated()")`, `anyRequest().authenticated()`), scoped to `principal.getId()` (no user ID path/query param — prevents upload IDOR).
   - Enforces `5 MB` file / `6 MB` request Spring multipart limits (`application.yml`), rejects empty/spoofed magic bytes (`ImageIO.getImageReaders` + `ALLOWED_FORMATS`), bounds image dimensions (`16x16`..`4096x4096` against decompression bombs), re-encodes into clean `TYPE_INT_RGB` JPEGs (stripping EXIF GPS/device metadata & polyglot payloads), and normalizes paths with `startsWith` containment checks (`resolveUserAvatarDir`, `safeChildPath`).
   - Verified live path traversal probe `GET /uploads/../../../etc/passwd` rejected with `HTTP 401`.
4. **Expanded Browser CORS & CSP Alignment (`541b7b9`, `7663aa8`):**
   - Explicit allowlist in `compose.yaml` and `.env.example` (no wildcard `*`) including `http://localhost:3002`. Verified live `OPTIONS /api/v1/auth/register` with `Origin: http://localhost:3002` returns `Access-Control-Allow-Origin: http://localhost:3002`.
   - Frontend CSP `img-src` permits explicit dev ports + `https:` rather than `http:` wildcard across arbitrary hosts.

### 9.2 Residual & Newly Introduced Security Gaps
1. **Plaintext OTP & Reset Token Logging (`EmailService.java`):** `INFO` logs print raw OTPs and password reset tokens unconditionally ([Section 11, Finding #1](#11-bugs-and-risks)).
2. **Private Profile Data Not Redacted Server-Side When `isPublicVisible = false`:** `GET /api/v1/users/{username}` and `GET /api/v1/community/users/{username}/posts` do not enforce `isPublicVisible` on the backend ([Section 11, Finding #3](#11-bugs-and-risks)).
3. **Permissive `connect-src` / `img-src` `https:` + `'unsafe-inline'`/`'unsafe-eval'` in `next.config.ts`:** `img-src ... https:` allows any HTTPS origin for avatars/external images, broader than the prior Unsplash/GitHub allowlist (carried forward `'unsafe-inline'`/`'unsafe-eval'` for scripts/styles).
4. **Carried-Forward Dev Defaults & Pre-Existing Open Items:** Default dev `JWT_SECRET_KEY` and `POSTGRES_PASSWORD` in `application.yml` / `compose.yaml` (must be overridden in prod), unthrottled `/login` and `/forgot-password` (`ISSUE-009`), contributor seed accounts carrying `ROLE_ADMIN` (`ISSUE-010`, verified live on `contributor-01`), `ROLE_MODERATOR` excluded from `/api/v1/admin/**` (`ISSUE-006`), empty `blockedAuthorIds` in main feed (`ISSUE-004`), and `GET /api/v1/auth/me` returning HTTP `200` `{"success":false,"message":"Not authenticated"}` when anonymous ([`AuthController.java#L89-L90`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/auth/controller/AuthController.java#L89-L90)).

---

## 10. Test Results

All checks below were freshly executed against the current repository at `7663aa8` without modifying application code.

### 10.1 Automated Suites & Build Checks

| Check | Command | Scope / Environment | Outcome | Details |
| :--- | :--- | :--- | :---: | :--- |
| Backend Tests | `mvn -f backend/pom.xml test` | Spring Boot `test` profile (H2 in-memory, `ddl-auto: create-drop`, `MAIL_PASSWORD` blank -> simulated email) | **PASS (`49/49`)** | `Failures: 0, Errors: 0, Skipped: 0` (53.482s) |
| Frontend Unit Tests | `npm test` (`frontend/`) | `node --test src/__tests__/*.test.mjs` | **PASS (`7/7`)** | Zero-PHI, SEO/sitemap, CSP headers, team integrity, avatar/profile wiring |
| TypeScript Check | `npx tsc --noEmit` (`frontend/`) | Full frontend TS compilation | **PASS** | Exit code `0`, zero diagnostics |
| ESLint Direct | `npx eslint src/` (`frontend/`) | All `src/` TypeScript/TSX files | **PASS** | Exit code `0` |
| `npm run lint` Script | `npm run lint` (`frontend/`) | Runs `"next lint"` in Next 16.4.6 | **FAIL (`exit 1`)** | `Invalid project directory provided, no such directory: E:\Project\MediNex\frontend\lint` (`ISSUE-007`) |
| Production Build | `npm run build` (`frontend/`) | Next.js 16.4.6 Turbopack + TypeScript (`NODE_ENV=production`) | **PASS** | Compiled in `4.6s`, 37/37 routes built (`31` static, `3` dynamic `ƒ`: `/community/posts/[id]`, `/team/[username]`, `/users/[username]`, plus `robots.txt`/`sitemap.xml`) |
| Docker Build | `docker compose build` | `backend` + `frontend` Dockerfiles | **PASS** | Both images `medinex-backend:latest` & `medinex-frontend:latest` built (`exit 0`, cached layers clean); `compose config --quiet` `exit 0` |

#### Backend Test Breakdown (49 Tests across 10 Classes)
- `AdminIntegrationTest`: **6 / 6 pass** (`21.17s`)
- `AuthIntegrationTest`: **10 / 10 pass** (`3.969s`) — includes `shouldEnforceTwoMinuteCooldownAndAllowResendVerificationAfterExpiry`, `shouldVerifyEmailWithSixDigitOtpAndRejectNonDigitFormat`, `shouldLockOtpAfterFiveFailedAttempts`
- `CommunityIntegrationTest`: **7 / 7 pass** (`5.276s`)
- `FullUserJourneyE2EIntegrationTest`: **1 / 1 pass** (`1.523s`)
- `FollowIntegrationTest`: **6 / 6 pass** (`5.187s`)
- `MediNexApplicationTests`: **1 / 1 pass** (`4.189s`)
- `ProjectControllerTest`: **4 / 4 pass** (`0.829s`)
- `SecurityHardeningAndPhiTest`: **5 / 5 pass** (`1.069s`)
- `TeamControllerTest`: **6 / 6 pass** (`0.894s`)
- `AvatarUploadIntegrationTest`: **3 / 3 pass** (`5.449s`) — tests `401` anonymous upload rejection, spoofed-JPEG/`8x8` rejection (`400`), `800x600` PNG conversion -> exact `64x64`/`256x256`/`512x512` JPEGs via `/uploads/**`, `email: null` on public user read, post/comment multi-res avatar propagation, and `DELETE` disk cleanup

### 10.2 Live Stack, Flyway, Hibernate & HTTP Integration Probes

Executed non-destructively against running containers (`medinex-postgres`, `medinex-backend`, `medinex-frontend`, `medinex-mailpit`):

| Verification Target | Method / Probe | Observed Result |
| :--- | :--- | :--- |
| Compose Services | `docker compose ps` | `medinex-postgres` (healthy), `medinex-backend` (healthy, ports `8082->8080`, `8083->8081`), `medinex-frontend` (healthy, `3002->3000`), `medinex-mailpit` (healthy, `8026->8025`, `1026->1025`) |
| Flyway Migrations | `psql` query on `flyway_schema_history` + backend boot logs | `DbValidate` validated 5 migrations (`00:00.063s`), current schema version `5`, ranks `1..5` all `success = t` |
| Hibernate Schema Validation | `medinex-backend` boot with `ddl-auto: validate` against PostgreSQL 16.4 | `LocalContainerEntityManagerFactoryBean` initialized cleanly; Tomcat started on `8080`/`8081` with context path `/` in `12.722s` |
| Actuator Health | `GET http://localhost:8083/actuator/health` | `HTTP 200` `{"status":"UP"}` |
| OpenAPI Docs | `GET http://localhost:8082/v3/api-docs` | `HTTP 200` (`57,376` bytes) |
| CORS Preflight | `OPTIONS http://localhost:8082/api/v1/auth/register` (`Origin: http://localhost:3002`) | `HTTP 200`, `Access-Control-Allow-Origin: http://localhost:3002`, `Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS` |
| Auth / RBAC Enforcement (Anon) | `GET /admin/stats`, `PUT /projects/shasthosetu`, `PUT /users/profile`, `POST /users/profile/avatar`, `DELETE /users/profile/avatar` | All **5** returned **`HTTP 401`** (`GET /auth/me` returned **`HTTP 200`** `{"success":false,"message":"Not authenticated"}` per pre-existing handler) |
| Input Validation | `POST /api/v1/auth/verify-email` with `{"email":"not-an-email","otp":"abc"}` | **`HTTP 400`** `{"success":false,"message":"Validation failed","errors":{"otp":"Verification OTP must be a 6-digit numeric code","email":"Valid email is required"}}` |
| Anti-Enumeration (Resend) | `POST /api/v1/auth/resend-verification` for nonexistent email | **`HTTP 200`** generic message |
| Public Profile Redaction & Avatars | `GET /api/v1/users/contributor-01`, `GET /api/v1/users/jihadjkhan` | **`HTTP 200`**, `"email": null`, `avatarUrl`/`avatarSmUrl`/`avatarLgUrl` populated for `jihadjkhan` |
| Multi-Res Static Serving | `GET /uploads/avatars/f87aa498-.../10e4de2a-...-{sm,md,lg}.jpg` | All **`HTTP 200`** `image/jpeg`, `Cache-Control: max-age=86400` (`sm=2875B`, `md=27838B`, `lg=79518B`) |
| Path Traversal Probe | `GET http://localhost:8082/uploads/../../../etc/passwd` | **`HTTP 401`** (normalized outside `/uploads/**` and rejected) |
| Case Sensitivity Regression Probe | `GET /users/Contributor-01/follow-stats` & `/community/users/Contributor-01/posts` | Both returned **`HTTP 404`** (while `GET /api/v1/users/contributor-01` returns `200`) |
| Frontend Routes | `GET http://localhost:3002{/verify-email,/users/hasnat,/dashboard/settings,/community/posts/381f4e30-c390-4c4a-9f89-86da976a3720,/}` | All **`HTTP 200`**, CSP header includes `http://localhost:8082` |

### 10.3 Items Explicitly Unverified in This Audit
- **Live external Gmail SMTP delivery (`medinexbd.noreply@gmail.com -> real recipient`):** Live backend has `MAIL_HOST=smtp.gmail.com` and a 16-byte `MAIL_PASSWORD`, and Mailpit holds `0` messages (`http://localhost:8026/api/v1/messages`), but no new registration/resend email was triggered during this non-mutating audit. Live end-to-end SMTP delivery is inferred only from existing verified DB accounts (`jihadjp1`, `jihadjkhan`, `otpsmoke_1794383127`), not freshly executed here.
- **Playwright / Full Browser Headless UI E2E:** No automated browser runner was configured or executed; frontend React client flows rely on Next.js build verification, static pattern assertions in `media-and-profile.test.mjs`, and live backend HTTP checks.

---

## 11. Bugs and Risks

| ID | Severity | Component / File | Finding & Impact |
| :-: | :-: | :--- | :--- |
| **BUG-01** | **HIGH** | [`EmailService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/common/email/EmailService.java#L34-L47) | **Plaintext OTP & Reset Token Logging at `INFO`:** `sendVerificationEmail` and `sendPasswordResetEmail` unconditionally log raw OTPs and password-reset tokens to stdout (`(OTP: {})`, `(Token: {})`) even in SMTP-enabled environments. Exposes active credentials to anyone with container or centralized log read access. |
| **BUG-02** | **MEDIUM** | [`CommunityService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/community/service/CommunityService.java#L183), [`FollowService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/follow/service/FollowService.java#L49,L129,L144,L176,L185,L264,L292) | **Case-Sensitive Username Lookup Mismatch (`HTTP 404`):** `UserService.getUserByUsername` uses `findByUsernameIgnoreCase`, whereas `CommunityService.getUserPosts` and all 7 methods in `FollowService` use case-sensitive `findByUsername`. Verified live: `/api/v1/users/Contributor-01/follow-stats` and `/api/v1/community/users/Contributor-01/posts` fail with `HTTP 404`, causing `/users/[MixedCase]` to render missing stats and empty posts. |
| **BUG-03** | **MEDIUM** | [`UserService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/user/service/UserService.java#L27-L32), [`CommunityService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/community/service/CommunityService.java#L181-L202) | **Incomplete Server-Side Enforcement of `isPublicVisible = false`:** When a user disables `isPublicVisible`, `GET /api/v1/users/{username}` still serializes full bio, headline, university, skills, links, and roles, relying purely on client UI state in `/users/[username]` (`isPrivateLocked`), and `GET /api/v1/community/users/{username}/posts` still returns `PUBLIC`/`MEMBERS_ONLY` posts to non-followers. |
| **BUG-04** | **MEDIUM** | [`frontend/package.json`](file:///e:/Project/MediNex/frontend/package.json#L9) | **`npm run lint` Still Broken in Next.js 16 (`ISSUE-007`):** `"lint": "next lint"` fails with `exit code 1`; `npx eslint src/` passes cleanly. Blocks CI pipelines calling `npm run lint`. |
| **BUG-05** | **MEDIUM** | [`AvatarImageService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/user/service/AvatarImageService.java), [`compose.yaml`](file:///e:/Project/MediNex/compose.yaml#L69-L70), [`.gitignore`](file:///e:/Project/MediNex/.gitignore) | **Single-Node Volume Coupling & Unignored Local `uploads/`:** Avatars are written to container/local filesystem (`medinex_uploads`), preventing stateless multi-replica horizontal scaling until moved to S3/MinIO; `uploads/` is also absent from `.gitignore` if run outside Docker. |
| **BUG-06** | **LOW/MED** | Root `*.md` Documentation | **Documentation Drift:** [`API_DOCUMENTATION.md`](file:///e:/Project/MediNex/API_DOCUMENTATION.md), [`DATABASE_SCHEMA.md`](file:///e:/Project/MediNex/DATABASE_SCHEMA.md), [`ENVIRONMENT_VARIABLES.md`](file:///e:/Project/MediNex/ENVIRONMENT_VARIABLES.md), [`MEDINEX_DEPLOYMENT_GUIDE.md`](file:///e:/Project/MediNex/MEDINEX_DEPLOYMENT_GUIDE.md), [`MEDINEX_KNOWN_ISSUES.md`](file:///e:/Project/MediNex/MEDINEX_KNOWN_ISSUES.md), [`MEDINEX_FINAL_RELEASE_AUDIT.md`](file:///e:/Project/MediNex/MEDINEX_FINAL_RELEASE_AUDIT.md), and [`README.md`](file:///e:/Project/MediNex/README.md) do not yet reflect `V5`, OTP auth payload/cooldowns, `/users/profile/avatar`, `/users/[username]`, `UPLOAD_DIR`, or resolved Gmail SMTP transport (`ISSUE-012`). |
| **BUG-07** | **LOW** | [`AuthService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/auth/service/AuthService.java#L294), [`AvatarImageService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/user/service/AvatarImageService.java#L47) | **Edge-Case Friction:** (a) `@Async` email dispatch after token deletion in `resendVerificationEmail` means transient SMTP failure locks out another retry for 120s; (b) `verifyEmail` distinguishes `"Email address is already verified"` vs `"Invalid or expired verification OTP"`; (c) raw `.webp` uploaded directly via API returns `400` because Java `ImageIO` lacks native WebP support (browser UI works around this via `<canvas>` PNG transcode). |
| **CARRIED** | **P2–P3** | Baseline Open Items (`MEDINEX_KNOWN_ISSUES.md`) | Unresolved baseline items verified still present: `ISSUE-004` (empty `blockedAuthorIds` in `getCommunityFeed`), `ISSUE-005` (`AtomicReference` in-memory `AdminSettingsDto`), `ISSUE-006` (`ROLE_MODERATOR` lacks moderation route access), `ISSUE-009` (no rate limiting on `/login` & `/forgot-password`; JWT in `localStorage`), `ISSUE-010` (`contributor-01`..`06` retain `ROLE_ADMIN`), and anonymous `GET /auth/me` returning HTTP `200` `success: false`. |

---

## 12. Pending Work

1. **Must-Fix Before Public Production:**
   - Gate or mask OTP/password-reset token logging in `EmailService` so plaintext secrets are logged **only** when SMTP delivery is unconfigured/simulated in local dev/test profiles.
   - Fix `CommunityService.getUserPosts` and `FollowService` to use `userRepository.findByUsernameIgnoreCase(...)` consistently with `UserService`.
   - Enforce `isPublicVisible = false` server-side in `UserService.getUserByUsername` and `CommunityService.getUserPosts` (checking ownership and accepted follower relationship before returning profile details or posts).
   - Rotate `JWT_SECRET_KEY`, `POSTGRES_PASSWORD`, and `SEED_ADMIN_PASSWORD` away from default values in `.env.example` / `application.yml`, and ensure HTTPS (`https://`) origins in `CORS_ALLOWED_ORIGINS` and `NEXT_PUBLIC_API_BASE_URL` for deployed environments.
   - Fix `frontend/package.json` `"lint": "eslint src/"` (`ISSUE-007`), add `uploads/` to `.gitignore`, and resolve open moderation/blocklist items (`ISSUE-004`, `ISSUE-006`, `ISSUE-010`).
2. **Recommended Hardening & Cleanup:**
   - Migrate `AvatarImageService` storage backend to MinIO / S3 (using existing `MINIO_*` / `STORAGE_ENDPOINT` config) for stateless multi-instance scaling, and move `WebP` decoding support (e.g., TwelveMonkeys ImageIO) to the backend if API clients upload WebP directly.
   - Update `API_DOCUMENTATION.md`, `DATABASE_SCHEMA.md`, `ENVIRONMENT_VARIABLES.md`, `MEDINEX_KNOWN_ISSUES.md`, and `MEDINEX_DEPLOYMENT_GUIDE.md` to match `HEAD` (`V5`, OTP auth, avatars, Gmail SMTP).
   - Clean up temporary `smoke_*`, `cors_*`, `smtpsmoke_*`, `livemail_*`, `resendsmoke_*`, `otpsmoke_*`, `df_*`, `aaaa` test accounts in the local dev PostgreSQL database before exporting seed snapshots.

---

## 13. Deployment Impact

- **Database Schema (`V5`):** Requires running Flyway on startup (`SPRING_FLYWAY_ENABLED=true`). `V5__add_otp_attempts_to_verification_tokens.sql` adds `failed_attempts INTEGER NOT NULL DEFAULT 0` safely and non-destructively to `email_verification_tokens`.
- **Docker Rebuild & Persistent Volume:**
  - `backend` and `frontend` containers **must be rebuilt** (`docker compose up -d --build`) when deploying from `142aa7b` because:
    - `frontend/Dockerfile` bakes `NEXT_PUBLIC_API_BASE_URL` (`http://localhost:8082/api/v1`) and `NEXT_PUBLIC_APP_URL` (`http://localhost:3002`) into client bundles at build time.
    - `backend/Dockerfile` initializes `/app/uploads` permissions for non-root `appuser`, and `compose.yaml` mounts persistent volume **`medinex_uploads:/app/uploads`**. Backups must include both `medinex_pgdata` and `medinex_uploads`.
- **Environment Configuration & Firewall/Mail:**
  - Live deployments must set `MAIL_PASSWORD` (App Password or SMTP secret) alongside `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_FROM_ADDRESS`; otherwise `EmailService` silently simulates email instead of sending over SMTP.
  - Reverse proxies (Nginx/Caddy/Cloudflare) fronting the app must allow **`POST /api/v1/users/profile/avatar`** payloads up to **`6 MB`** (`client_max_body_size` >= `6M`) and proxy or permit static **`/uploads/**`** requests to the backend origin configured in `NEXT_PUBLIC_API_BASE_URL` / CSP `img-src`.
- **Client Compatibility Impact:** Any external API client or mobile app calling `POST /api/v1/auth/verify-email` must send both `email` and a 6-digit `otp` (or aliased `token`); single-field hex token verification is no longer accepted.

---

## 14. Final Assessment

- **Overall Readiness:** **Suitable for Staging / Hackathon Demo**; **Conditionally Ready for Production pending P1/Medium Security & Consistency Fixes.**
- **What Is Solid:**
  - All **49 backend tests** (including new OTP cooldown/lockout tests and physical 64px/256px/512px image dimension tests), **7 frontend unit tests**, **TypeScript**, **ESLint (`npx eslint src/`)**, **Next.js production build**, **Docker Compose multi-container builds**, **Flyway `V1`–`V5`**, and **Hibernate `validate`** pass cleanly with zero regressions on verified paths.
  - Live containers run healthy, upload & serve crisp multi-resolution JPEGs from persistent storage, enforce CORS (`localhost:3002 -> localhost:8082`), enforce `401` RBAC guards on protected routes, strip image EXIF metadata on upload, and redact `email` on public user endpoints.
- **Blockers Before Production Launch:**
  1. Remove/mask plaintext OTP and reset token logging in `EmailService` (`BUG-01`).
  2. Enforce `isPublicVisible = false` server-side for profile metadata and posts (`BUG-03`), and switch `CommunityService` / `FollowService` username lookups to ignore-case (`BUG-02`).
  3. Supply non-default production secrets (`JWT_SECRET_KEY`, DB credentials, SMTP password) and fix `"lint": "eslint src/"` + outstanding security debt (`ISSUE-004`, `ISSUE-006`, `ISSUE-009`, `ISSUE-010`).
