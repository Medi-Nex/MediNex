# MediNex — Phase 9: Security & Reliability Hardening Report

**Baseline Commit:** `7663aa8`  
**Phase:** 9 — Security, Privacy, Authorization, Reliability & Regression Hardening  
**Execution Date:** November 11, 2026  
**Target Workspace:** `e:/Project/MediNex`  
**Working Tree Status:** All Phase 9 fixes, migrations, tests, and documentation updates remain uncommitted as requested (no git commit or push performed). [`MEDINEX_LATEST_CHANGES_REPORT.md`](file:///e:/Project/MediNex/MEDINEX_LATEST_CHANGES_REPORT.md) was preserved untouched.

---

## 1. Executive Summary & Verification Classification

Phase 9 addressed the security, privacy, authorization, reliability, testing, and documentation gaps identified against baseline `7663aa8`. All code changes were built and deployed into the live multi-container stack (`medinex-backend`, `medinex-frontend`, `medinex-postgres`, `medinex-mailpit`) without deleting existing user data or resetting persistent Docker volumes (`users=19` preserved before and after deployment; Flyway migrated cleanly through `V6`).

### Overall Status Matrix

| Requirement / Control | Final Classification | Evidence & Notes |
| :--- | :--- | :--- |
| **P1.1–1.2** Remove plaintext OTP & reset-token logging (`EmailService`) | **Fixed and verified** | [`EmailService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/common/email/EmailService.java) logs `(OTP redacted)` / `(token redacted)` only. Verified via [`EmailServiceTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/common/email/EmailServiceTest.java), [`AuthIntegrationTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/auth/AuthIntegrationTest.java), and live `MailpitWireProbe`. |
| **P1.3–1.5** Enforce `isPublicVisible` & private posts consistently across backend | **Fixed and verified** | Centralized [`ProfileAccessGuard`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/user/service/ProfileAccessGuard.java) enforced across `UserService`, `TeamController`, `FollowService`, `CommunityService`, and `PostRepository.findFeedPosts` JPQL (`403 Forbidden` for private non-followers/anon/mutually blocked). Frontend `403` stub in [`users/[username]/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/users/%5Busername%5D/page.tsx) verified via `tsc --noEmit`, `eslint src/`, and `next build`. |
| **P1.6** Case-insensitive username lookups in `CommunityService` & `FollowService` | **Fixed and verified** | Replaced `findByUsername` with `findByUsernameIgnoreCase` across `CommunityService`, `FollowService`, and `ReportService`. Verified in [`PrivacyAndRbacIntegrationTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/security/PrivacyAndRbacIntegrationTest.java) and live HTTP probes (`Contributor-01`, `CONTRIBUTOR-01`, `CoNtRiBuToR-01` -> `200`). |
| **P2.1–2.2** Audit & restrict contributor seed accounts (`ROLE_USER` only) | **Fixed and verified** | [`DataInitializer.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/config/DataInitializer.java) updated + forward-only Flyway [`V6__restrict_contributor_roles.sql`](file:///e:/Project/MediNex/backend/src/main/resources/db/migration/V6__restrict_contributor_roles.sql) applied to live Postgres (`contributor-01..06` verified `{ROLE_USER}`, `medinex-admin` retains `{ROLE_ADMIN,ROLE_SUPER_ADMIN,ROLE_USER}`, `users=19`). |
| **P2.3** Prevent privileged role assignment on public registration | **Fixed and verified** | `AuthService.register` exclusively assigns `ROLE_USER`; verified in [`AuthIntegrationTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/auth/AuthIntegrationTest.java) (`shouldRejectPrivilegedRolesOnPublicRegistration`). |
| **P2.4–2.5** Moderator boundaries, admin escalation guards, `401`/`403` enforcement | **Fixed and verified** | [`SecurityConfig.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/config/SecurityConfig.java), [`AdminController.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/admin/controller/AdminController.java), [`AdminService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/admin/service/AdminService.java), [`AuthController.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/auth/controller/AuthController.java), and admin frontend layout/overview updated. Verified by `PrivacyAndRbacIntegrationTest` and live HTTP `401`/`403` probes. |
| **P3.1** Fix `npm run lint` for Next.js 16 | **Fixed and verified** | [`frontend/package.json`](file:///e:/Project/MediNex/frontend/package.json) changed from `next lint` to `eslint src/`; `npm run lint` exits `0` cleanly (`0` errors, `0` warnings). |
| **P3.2** Add local `uploads/` to `.gitignore` | **Fixed and verified** | Added `uploads/` and `backend/uploads/` to [`.gitignore`](file:///e:/Project/MediNex/.gitignore); `git status --short` shows no untracked uploads directory. |
| **P3.3** Avatar storage persistence & backup/restore verification | **Fixed and verified** | Verified [`AvatarUploadIntegrationTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/user/AvatarUploadIntegrationTest.java) + live `docker compose restart backend` SHA-256 byte-for-byte identity on `-sm.jpg`/`-md.jpg`/`-lg.jpg` + non-destructive `medinex_uploads` backup/restore drill via `alpine` tarball & temporary volume. |
| **P3.4 (Local Mailpit)** Controlled SMTP delivery test via `EmailService` | **Fixed and verified** | Executed `EmailService.sendVerificationEmail` & `sendPasswordResetEmail` against live `medinex-mailpit` (`localhost:1026`), verified `200 OK` receipt via Mailpit API (`http://localhost:8026/api/v1/messages`) with redacted logs, then cleaned up test messages. |
| **P3.4 (External Gmail)** End-to-end external inbox SMTP delivery (`smtp.gmail.com:587`) | **Blocked** *(readback mailbox unavailable)* / **Fixed but not independently verified** | Verified TCP + `EHLO` (`250`) + `STARTTLS` (`220`) TLS handshake to `smtp.gmail.com:587` with zero secret exposure. End-to-end external recipient inbox receipt was **not** executed because no controlled external recipient mailbox with readback access is provisioned and `.env` credentials must not be exposed or abused. |
| **P3.5** OTP resend behavior on transient email failure | **Fixed and verified** | Removed unused `@Async` from `EmailService`, added `boolean` delivery return, and aborted `resendVerificationEmail` with `503 Service Unavailable` + transactional rollback on failure. Verified by `EmailServiceTest` and `AuthIntegrationTest.shouldNotImposeCooldownAfterTransientResendEmailFailure`. |
| **P3.6** Direct WebP upload compatibility | **Fixed and verified** *(unit/integration)*; *(live HTTP WebP upload inside container not mutated)* | Added pure-Java `com.twelvemonkeys.imageio:imageio-webp:3.13.1` to [`pom.xml`](file:///e:/Project/MediNex/backend/pom.xml) + `"webp"` in [`AvatarImageService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/user/service/AvatarImageService.java). Verified lossy VP8 & lossless VP8L uploads in `AvatarUploadIntegrationTest` (JDK 21), and confirmed `imageio-webp-3.13.1.jar` packaged inside Alpine `medinex-backend` `/app/BOOT-INF/lib/`. Live HTTP WebP upload mutation was avoided on live users to preserve existing avatars. |
| **P4** Comprehensive regression test suite | **Fixed and verified** | Backend Maven suite: **60 tests across 12 classes** (`0` failures, `0` errors, `0` skipped). Frontend: **7 Node tests** passing, `npm run lint` (`0`), `tsc --noEmit` (`0`), `next build` (`37` routes). *(Note: Playwright/headless browser DOM clicking on `403` profile stubs / moderator sidebar was not run; verified via static TypeScript/ESLint/build + API integration).* |
| **P5** Documentation updates | **Fixed and verified** | Updated `API_DOCUMENTATION.md`, `ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `DEPLOYMENT.md`, `ENVIRONMENT_VARIABLES.md`, `MEDINEX_DEPLOYMENT_GUIDE.md`, `MEDINEX_KNOWN_ISSUES.md`, `MEDINEX_SECURITY_AUDIT.md`, `README.md`, `SECURITY.md`, and `TESTING.md`. |
| **Unrelated Pre-Existing Debt** (`ISSUE-005`, `ISSUE-008` backend, `ISSUE-009`, `ISSUE-011`) | **Still unresolved** *(Out of Phase 9 scope)* | `AdminService.settingsHolder` remains in-memory (`AtomicReference`), `HttpOnly` cookie / auth rate-limiter filter not yet implemented, and optional `backend/.dockerignore` / binary post-media upload remain open P2/P3 backlog items tracked in `MEDINEX_KNOWN_ISSUES.md`. |

---

## 2. Priority 1 — Critical Security Fixes

### 2.1 OTP & Password Reset Token Log Redaction ([`EmailService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/common/email/EmailService.java))
- Removed plaintext `rawOtp` and `rawToken` log formatting.
- `sendVerificationEmail(...)` now logs strictly: `[EMAIL SERVICE] Dispatching verification code to {} (OTP redacted)`.
- `sendPasswordResetEmail(...)` logs strictly: `[EMAIL SERVICE] Dispatching password reset instructions to {} (token redacted)`.
- Migrated `AuthIntegrationTest` from regex-scraping plaintext application logs to capturing dispatched credentials safely via `@MockitoSpyBean EmailService`, adding [`EmailServiceTest.java`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/common/email/EmailServiceTest.java) (`CapturedOutput`) to fail immediately if any OTP, reset token, or `mailPassword` ever reaches logs.

### 2.2 Uniform Backend Profile & Post Privacy Enforcement ([`ProfileAccessGuard.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/user/service/ProfileAccessGuard.java))
- Created [`ForbiddenException`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/common/exception/ForbiddenException.java) (`HTTP 403`) and [`UnauthorizedException`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/common/exception/UnauthorizedException.java) (`HTTP 401`).
- Centralized privacy rules in `ProfileAccessGuard`:
  - `isPublicVisible(User)` treats a profile as public only when `profile == null || profile.isPublicVisible()`.
  - `isMutuallyBlocked(viewerId, targetUserId)` checks bidirectional blocks via `BlockRepository.areMutuallyBlocked`.
  - `isOwnerOrAcceptedFollower(targetUserId, viewerId)` grants access to private profiles **only** to the owner (`viewerId.equals(targetUserId)`) or accepted followers persisted in `user_follows` (`PENDING` follow requests are denied).
- Wired `ProfileAccessGuard` consistently across:
  - [`UserController`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/user/controller/UserController.java) & [`UserService`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/user/service/UserService.java) (`GET /api/v1/users/{username}` returns `403` when private to anon/non-follower or mutually blocked).
  - [`TeamController`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/team/controller/TeamController.java) (`getMembers` filters restricted profiles; `getMemberByUsername` enforces `requireProfileViewAccess`).
  - [`FollowService`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/follow/service/FollowService.java) (`getUserFollowers` & `getUserFollowing` enforce `requireProfileViewAccess`; `getPendingFollowRequests` uses `UserDto.fromPublicEntity` to redact requester emails).
  - [`PostRepository.findFeedPosts`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/community/repository/PostRepository.java) & [`CommunityService`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/community/service/CommunityService.java): feed JPQL natively filters out mutually blocked authors, private (`isPublicVisible = false`) authors unless the viewer is the owner or an accepted follower, `MEMBERS_ONLY` for anonymous viewers (`401`), and `PRIVATE` posts for everyone except the author (`403` via `validateAndLoadViewablePost`, shared across post fetch, comments fetch, likes, and comment replies).
- Updated frontend [`frontend/src/app/users/[username]/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/users/%5Busername%5D/page.tsx) to catch `403` `ApiError` responses from `getPublicProfile` and render a dedicated private-account lock view + `<FollowButton>` powered strictly by public `/follow-stats` flags, preventing fallback to placeholder team data or misleading `404` states.

### 2.3 Case-Insensitive Username Lookups
- Replaced exact `findByUsername(...)` lookups with `findByUsernameIgnoreCase(...)` across:
  - `CommunityService` (`getUserPosts` etc.)
  - `FollowService` (all 7 username lookup paths across follow/unfollow, follow stats, followers/following lists, and block/unblock)
  - `ReportService` (`submitReport`)
  - `TeamController` / `UserService` (`teamMemberRepository.findByUserUsernameIgnoreCase`, `userRepository.findByUsernameIgnoreCase`).

---

## 3. Priority 2 — Authorization & Least-Privilege Hardening

### 3.1 Contributor Seed Least Privilege (`V6__restrict_contributor_roles.sql`)
- Audited [`DataInitializer.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/config/DataInitializer.java) and removed `RoleType.ROLE_ADMIN` from `initContributor(...)`; contributors now seed strictly with `ROLE_USER`.
- Created and applied forward-only idempotent Flyway migration [`V6__restrict_contributor_roles.sql`](file:///e:/Project/MediNex/backend/src/main/resources/db/migration/V6__restrict_contributor_roles.sql), ensuring `ROLE_USER` and removing `ROLE_ADMIN` / `ROLE_SUPER_ADMIN` grants from `contributor-01`..`contributor-06` in `user_roles` without dropping or mutating any user row.

**Observed Live PostgreSQL State After Deploy:**

```text
    username    |                  roles
----------------+-----------------------------------------
 contributor-01 | {ROLE_USER}
 contributor-02 | {ROLE_USER}
 contributor-03 | {ROLE_USER}
 contributor-04 | {ROLE_USER}
 contributor-05 | {ROLE_USER}
 contributor-06 | {ROLE_USER}
 medinex-admin  | {ROLE_ADMIN,ROLE_SUPER_ADMIN,ROLE_USER}
```

### 3.2 Moderator Separation, Admin Escalation Guards & `401`/`403` Responses
- [`AuthController.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/auth/controller/AuthController.java) (`/api/v1/auth/me`) throws `UnauthorizedException` (`401`) when unauthenticated instead of failing late.
- [`SecurityConfig.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/config/SecurityConfig.java) places `/api/v1/auth/me` and `/api/v1/auth/change-password` under `.authenticated()` prior to public `/api/v1/auth/**` rules, permits `SUPER_ADMIN`, `ADMIN`, and `MODERATOR` on moderation routes (`/api/v1/admin/reports/**`, `/posts/**`, `/comments/**`, `/media/**`), and locks all other `/api/v1/admin/**` routes to `SUPER_ADMIN` / `ADMIN`.
- [`AdminController.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/admin/controller/AdminController.java) replaces class-wide admin annotation with explicit method-level `@PreAuthorize` checks matching each endpoint's privilege boundary.
- [`AdminService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/admin/service/AdminService.java):
  - Rejects invalid role strings cleanly (`BadRequestException`).
  - Blocks non-`SUPER_ADMIN` callers from assigning `ROLE_SUPER_ADMIN`, modifying any existing `ROLE_SUPER_ADMIN`, altering their own roles, or suspending themselves (`ForbiddenException`).
  - Restricts `resolveReport` action `SUSPEND_USER` exclusively to `ROLE_ADMIN` / `ROLE_SUPER_ADMIN` (moderators receive `403 Forbidden`), and prevents `ROLE_ADMIN` from suspending `ROLE_SUPER_ADMIN`.
- Updated frontend navigation and admin console ([`Navbar.tsx`](file:///e:/Project/MediNex/frontend/src/components/layout/Navbar.tsx), [`admin/layout.tsx`](file:///e:/Project/MediNex/frontend/src/app/(admin)/admin/layout.tsx), [`admin/page.tsx`](file:///e:/Project/MediNex/frontend/src/app/(admin)/admin/page.tsx)) so pure moderators can access moderation views without spurious admin-only stats/users requests.

---

## 4. Priority 3 — Reliability Hardening Verification

1. **Next.js 16 Lint Command:** Updated [`frontend/package.json`](file:///e:/Project/MediNex/frontend/package.json) `"lint": "next lint"` to `"lint": "eslint src/"`; verified `npm run lint` exits `0` with `0` errors and `0` warnings.
2. **Git Ignore Exclusions:** Updated [`.gitignore`](file:///e:/Project/MediNex/.gitignore) with `uploads/` and `backend/uploads/`; `git status --short` shows clean tracking with no local upload directory leakage.
3. **Avatar Storage Persistence & Volume Backup/Restore Drill:**
   - Pre-restart live container checks against `http://localhost:8082/uploads/avatars/f87aa498-aef7-47ad-946b-fa5a95dc99bf/10e4de2a-b6f8-4d6a-970e-db2d94d48fe9-{sm,md,lg}.jpg`:
     - `-sm.jpg`: HTTP `200`, `2875` bytes, `sha256_prefix=b717985a8317bb42`
     - `-md.jpg`: HTTP `200`, `27838` bytes, `sha256_prefix=ad579b8e098afedb`
     - `-lg.jpg`: HTTP `200`, `79518` bytes, `sha256_prefix=3e436cf64f43adc0`
   - Executed `docker compose restart backend` -> health check `healthy`.
   - Post-restart checks returned **HTTP `200`** with **identical byte counts and SHA-256 prefixes** across all three resolution variants.
   - Executed non-destructive archive drill on named volume `medinex_uploads` -> `tar czf` -> restored into ephemeral `medinex_uploads_restore_drill` volume -> confirmed identical full SHA-256 (`ad579b8e098afedbd374d9f6d8793933dd8ac6dc76f5b3313d493d4cb03b387a`) -> cleaned up temporary drill artifacts.
4. **Controlled SMTP Delivery Verification (No Secret Exposure):**
   - **Mailpit End-to-End Test:** Ran `MailpitWireProbe` invoking `EmailService.sendVerificationEmail` and `EmailService.sendPasswordResetEmail` against live `medinex-mailpit` (`localhost:1026`), observed `(OTP redacted)` and `(token redacted)` log output, verified HTTP `200` retrieval of both subjects from `http://localhost:8026/api/v1/messages`, and removed the two test messages via `DELETE`.
   - **External Gmail Transport Reachability vs Live Inbox Delivery:** Confirmed non-authenticated `EHLO` (`250`) + `STARTTLS` (`220`) TLS connectivity to `smtp.gmail.com:587`. Actual inbox landing via `medinexbd.noreply@gmail.com` could not be verified without exposing `.env` credentials or reading an external test inbox (`Blocked` / `Fixed but not independently verified` for external inbox receipt).
5. **Transient SMTP Resend Cooldown Protection:** Removed misleading `@Async` from `EmailService` (`MediNexApplication` does not enable `@EnableAsync`), propagated `boolean` dispatch status, and ensured `AuthService.resendVerificationEmail` aborts with HTTP `503 Service Unavailable` rolling back token/cooldown persistence when `EmailService` returns `false`.
6. **Direct WebP Compatibility:** Added pure-Java `com.twelvemonkeys.imageio:imageio-webp:3.13.1` (`imageio-core`, `imageio-metadata`, `imageio-webp`) to [`backend/pom.xml`](file:///e:/Project/MediNex/backend/pom.xml) (avoiding native `musl` JNI instability on Alpine) and added `"webp"` to `AvatarImageService.ALLOWED_FORMATS`. Verified both lossy VP8 and lossless VP8L 32x32 WebP uploads in `AvatarUploadIntegrationTest` (`5/5` passing), and verified all three `imageio-*-3.13.1.jar` artifacts inside the running `medinex-backend` Alpine container (`/app/BOOT-INF/lib/`).

---

## 5. Priority 4 — Observed Test & Live Verification Results

### 5.1 Backend Maven Suite (`mvn test`)
**Observed Result:** **60 tests run, 0 Failures, 0 Errors, 0 Skipped** (`BUILD SUCCESS`)

| Test Class | Tests Run | Key Phase 9 & Core Coverage | Status |
| :--- | :---: | :--- | :---: |
| [`AdminIntegrationTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/admin/AdminIntegrationTest.java) | 6 | Admin stats, user role/status audit logging, reports, settings, analytics, RBAC | **PASS** |
| [`AuthIntegrationTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/auth/AuthIntegrationTest.java) | 13 | `@MockitoSpyBean` OTP/reset log redaction, `ROLE_USER`-only registration, `503` transient SMTP retry without cooldown lock, refresh token rotation | **PASS** |
| [`EmailServiceTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/common/email/EmailServiceTest.java) | 2 | OTP/reset token/SMTP password log redaction (`CapturedOutput`), `false` return on `MailSendException` | **PASS** |
| [`CommunityIntegrationTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/community/CommunityIntegrationTest.java) | 7 | Feed, likes, nested comments, attachments, soft delete, unauthorized edit denial | **PASS** |
| [`FullUserJourneyE2EIntegrationTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/e2e/FullUserJourneyE2EIntegrationTest.java) | 1 | Complete registration-to-moderation-resolution user journey | **PASS** |
| [`FollowIntegrationTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/follow/FollowIntegrationTest.java) | 6 | Follows, private follow requests, mutual blocks, self-follow rejection | **PASS** |
| [`MediNexApplicationTests`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/MediNexApplicationTests.java) | 1 | Full Spring Boot context wiring | **PASS** |
| [`ProjectControllerTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/project/ProjectControllerTest.java) | 4 | Project reads & `401`/`403` update protection | **PASS** |
| [`PrivacyAndRbacIntegrationTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/security/PrivacyAndRbacIntegrationTest.java) | 4 | Private profile (`403` anon/non-follower/pending vs owner/accepted follower), `PRIVATE` posts (`403`), mixed-case lookups, contributor `ROLE_USER` restriction, `ADMIN` vs `SUPER_ADMIN` escalation prevention, `ROLE_MODERATOR` endpoint & `SUSPEND_USER` boundaries, `/auth/me` `401` | **PASS** |
| [`SecurityHardeningAndPhiTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/security/SecurityHardeningAndPhiTest.java) | 5 | Zero-PHI regex enforcement (`400`) and security headers | **PASS** |
| [`TeamControllerTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/team/TeamControllerTest.java) | 6 | 6 team profiles & `401`/`403` mutation protection | **PASS** |
| [`AvatarUploadIntegrationTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/user/AvatarUploadIntegrationTest.java) | 5 | JPEG/PNG/WebP (VP8 & VP8L) uploads, 64/256/512px generation, reload storage persistence, validation errors | **PASS** |

### 5.2 Frontend Verification Suite
- `npm test` (`node --test src/__tests__/*.test.mjs`): **7/7 passing**, `0` failures, `0` skipped.
- `npm run lint` (`eslint src/`): **Exited `0`** (`0` errors, `0` warnings).
- `npx tsc --noEmit`: **Exited `0`**.
- `npm run build` (Next.js 16.4.6 Turbopack): **Exited `0`** (`37` routes compiled cleanly).

### 5.3 Live Docker Runtime Probes (`compose.yaml` Stack)
- `docker compose ps`: `medinex-backend`, `medinex-frontend`, `medinex-mailpit`, and `medinex-postgres` all `Up` and `(healthy)`.
- PostgreSQL `flyway_schema_history`: Ranks `1` (`V1`) through `6` (`V6__restrict_contributor_roles.sql`) all `success = t`; `users=19` preserved.
- Live HTTP probes against `http://localhost:8082`:
  - Anonymous `GET /api/v1/auth/me` -> `401`
  - Anonymous `GET /api/v1/admin/stats` -> `401`
  - Anonymous `GET /api/v1/admin/reports` -> `401`
  - Mixed-case `GET /api/v1/users/Contributor-01`, `/CONTRIBUTOR-01/follow-stats`, `/community/users/CoNtRiBuToR-01/posts` -> `200`
  - Frontend SSR `GET http://localhost:3002/users/Contributor-01` -> `200`
  - Authenticated `contributor-01` (`roles: ["ROLE_USER"]`) `GET /api/v1/auth/me` -> `200`; `GET /admin/stats`, `GET /admin/users`, `GET /admin/reports`, `PUT /projects/shasthosetu`, `PUT /team/members/contributor-02` -> **`403 Forbidden`**.

---

## 6. Files Created & Modified in Phase 9

- **Created Backend / Migrations / Tests:**
  - `backend/src/main/java/com/medinex/common/exception/ForbiddenException.java`
  - `backend/src/main/java/com/medinex/common/exception/UnauthorizedException.java`
  - `backend/src/main/java/com/medinex/user/service/ProfileAccessGuard.java`
  - `backend/src/main/resources/db/migration/V6__restrict_contributor_roles.sql`
  - `backend/src/test/java/com/medinex/common/email/EmailServiceTest.java`
  - `backend/src/test/java/com/medinex/security/PrivacyAndRbacIntegrationTest.java`
- **Modified Backend:**
  - `backend/pom.xml`, `AdminController.java`, `AdminService.java`, `AuthController.java`, `AuthService.java`, `EmailService.java`, `PostRepository.java`, `CommunityService.java`, `DataInitializer.java`, `SecurityConfig.java`, `FollowService.java`, `ReportService.java`, `TeamController.java`, `UserController.java`, `AvatarImageService.java`, `UserService.java`
  - Modified tests: `AuthIntegrationTest.java`, `AvatarUploadIntegrationTest.java`
- **Modified Frontend & Config:**
  - `frontend/package.json`, `frontend/src/components/layout/Navbar.tsx`, `frontend/src/app/(admin)/admin/layout.tsx`, `frontend/src/app/(admin)/admin/page.tsx`, `frontend/src/app/users/[username]/page.tsx`, `.gitignore`
- **Updated Documentation & Report:**
  - `API_DOCUMENTATION.md`, `ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `DEPLOYMENT.md`, `ENVIRONMENT_VARIABLES.md`, `MEDINEX_DEPLOYMENT_GUIDE.md`, `MEDINEX_KNOWN_ISSUES.md`, `MEDINEX_SECURITY_AUDIT.md`, `README.md`, `SECURITY.md`, `TESTING.md`, and this report [`MEDINEX_PHASE9_SECURITY_HARDENING_REPORT.md`](file:///e:/Project/MediNex/MEDINEX_PHASE9_SECURITY_HARDENING_REPORT.md).
