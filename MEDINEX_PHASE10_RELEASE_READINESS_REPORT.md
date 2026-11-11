# MediNex — Phase 10 Release Readiness, End-to-End Verification & Recovery Validation Report

**Project:** MediNex — *"Healthcare Innovation. Connected Communities."*  
**Phase:** 10 — Release Readiness, End-to-End Verification & Recovery Validation  
**Audit Date:** November 11, 2026  
**Baseline Git Commit:** `7663aa857e2330a9a7a74034965b7602d4635cf8` (branch `main`, with uncommitted Phase 9 hardening changes preserved in place)  
**Target Workspace:** `e:/Project/MediNex`  

---

## Executive Decision

| Deployment Target | Decision | Summary Rationale |
| :--- | :--- | :--- |
| **Local Demo & Local Staging (`docker compose` on `localhost:3000` / `8080`)** | **READY FOR LOCAL STAGING** | All 4 containers (`medinex-frontend`, `medinex-backend`, `medinex-postgres`, `medinex-mailpit`) run `(healthy)`; Flyway `V1`–`V6` and Hibernate `ddl-auto: validate` pass; `60/60` Maven integration tests, `7/7` Node tests, ESLint (`0`), TypeScript (`0`), Next.js production build (`37` routes), Playwright (`4/4` live read-only + `3/3` isolated E2E), live WebP (`VP8`/`VP8L`) + EXIF stripping + restart persistence, Mailpit + transient SMTP `503` recovery, and isolated DB/uploads backup & restore drills all passed with `0` data loss (`users=19` preserved). |
| **Public Staging / Production Deployment** | **CONDITIONALLY READY FOR PRODUCTION** *(Blocked for unattended public launch until remediation items below are completed)* | Core application security, RBAC, privacy, and recovery mechanics are sound, but production deployment requires closing concrete operational/infra gaps: live `.env` still runs `SPRING_PROFILES_ACTIVE=dev` (`show-sql: true`, `DEBUG` logs, public `/v3/api-docs`), `.env` reuses default example `POSTGRES_PASSWORD` and `JWT_SECRET_KEY`, `medinex-admin` in Postgres was not rotated when `.env` `SEED_ADMIN_PASSWORD` changed, `GlobalExceptionHandler` reflects `ex.getMessage()` on `500`, frontend `next.config.ts` CSP contains `'unsafe-eval'`, `'unsafe-inline'`, and localhost dev URLs, tokens use `localStorage` (`ISSUE-009`) despite HttpOnly claims in `/privacy`, no reverse-proxy TLS/rate-limiting config exists in `infrastructure/`, `AdminSettingsDto` is in-memory only (`ISSUE-005`), backup scripts exclude `medinex_uploads`, and external Gmail inbox landing remains **BLOCKED** for automated verification. |

---

## 1. Absolute Data-Preservation & Repository Integrity Audit (Task A)

All Phase 9 modifications remained intact throughout Phase 10, zero destructive Git/Docker/SQL operations were run, and all Phase 10 E2E/WebP/backup tests isolated mutations away from real user records:

| Verification Item | Observed Evidence | Status |
| :--- | :--- | :---: |
| **Branch & HEAD Commit** | Branch `main` at `7663aa857e2330a9a7a74034965b7602d4635cf8` (no commits or resets performed) | **Verified** |
| **Prior Reports Untouched** | [`MEDINEX_LATEST_CHANGES_REPORT.md`](file:///e:/Project/MediNex/MEDINEX_LATEST_CHANGES_REPORT.md) SHA-256: `EA50ED5C497D06525DED5A608D265AE3AC373F7460B64B63B1ACE546FF43E87A`<br>[`MEDINEX_PHASE9_SECURITY_HARDENING_REPORT.md`](file:///e:/Project/MediNex/MEDINEX_PHASE9_SECURITY_HARDENING_REPORT.md) SHA-256: `7C37AD1C142294ECE5A0D382D1428743C83D5A6B246DADAEC3DD25E5F6320AB5` | **Verified** |
| **Phase 9 Working Tree Preservation** | All Phase 9 backend, frontend, Flyway `V6`, and doc modifications remain uncommitted in `git status --short`; zero unintended deletions. | **Verified** |
| **Phase 10 Workspace Additions** | Added `backups/` to [`.gitignore`](file:///e:/Project/MediNex/.gitignore), installed `@playwright/test@1.59.1` (`devDependencies`) and scripts `test:e2e:live` / `test:e2e:isolated` in [`frontend/package.json`](file:///e:/Project/MediNex/frontend/package.json), and added [`frontend/playwright.config.ts`](file:///e:/Project/MediNex/frontend/playwright.config.ts), [`frontend/e2e/live-smoke.spec.ts`](file:///e:/Project/MediNex/frontend/e2e/live-smoke.spec.ts), and [`frontend/e2e/isolated-flows.spec.ts`](file:///e:/Project/MediNex/frontend/e2e/isolated-flows.spec.ts). | **Verified** |
| **Live DB User Count & Avatar Preservation** | `users=19` unchanged before, during, and after all live probes, backend restart, Playwright E2E, and backup/restore tests; `@jihadjkhan` avatar `/uploads/avatars/f87aa498-aef7-47ad-946b-fa5a95dc99bf/10e4de2a-b6f8-4d6a-970e-db2d94d48fe9-md.jpg` and all 3 variants match exact pre-test SHA-256 hashes (`-lg.jpg`: `3e436c...`, `-md.jpg`: `ad579b...`, `-sm.jpg`: `b71798...`). | **Verified** |
| **`.env` vs `.env.example` Drift** | Key parity is `100%` (`0` missing keys between `.env` and [`.env.example`](file:///e:/Project/MediNex/.env.example)), **however port defaults drifted**: live `.env` & runtime use PostgreSQL `5432`, backend `8080` (`8081` actuator), frontend `3000`; `.env.example` & [`frontend/Dockerfile`](file:///e:/Project/MediNex/frontend/Dockerfile) ARGs default to `5434`, `8082`/`8083`, and `3002`. | **Finding Recorded** |
| **Compose & Flyway Inventory** | `docker compose config --quiet` exited `0`; 6 forward-only migrations exist in [`backend/src/main/resources/db/migration`](file:///e:/Project/MediNex/backend/src/main/resources/db/migration): `V1__init_schema.sql` (`22,391` B), `V2__performance_indexes.sql` (`1,965` B), `V3__align_collection_tables.sql` (`2,683` B), `V4__align_role_names.sql` (`1,141` B), `V5__add_otp_attempts_to_verification_tokens.sql` (`507` B), `V6__restrict_contributor_roles.sql` (`1,049` B). Local root `hs_err_pid27608.log` remains git-ignored. | **Verified** |

---

## 2. Docker & PostgreSQL Runtime Health (Task B)

All four Compose services attached to bridge network `medinex-network` with named volumes `medinex_pgdata` and `medinex_uploads` reported `Up` and `(healthy)` after final verification:

| Service / Container | Status & Health | Mapped Host Ports | Observed Runtime Checks |
| :--- | :--- | :--- | :--- |
| **`medinex-frontend`** | `Up` (`healthy`) | `3000->3000` | Runs as non-root `nextjs`; HTTP `200` on public/route checks; CSP & security headers verified. |
| **`medinex-backend`** | `Up` (`healthy`) | `8080->8080`, `8081->8081` | Runs as non-root `appuser`; `8081/actuator/health` -> `200 {"status":"UP"}`; `8081/actuator/metrics` -> `401` anon; Flyway `max installed_rank = 6` (`success=t`); Hibernate `ddl-auto: validate` clean; `users=19`. |
| **`medinex-postgres`** | `Up` (`healthy`) | `5432->5432` | PostgreSQL `16.4-alpine`, database `medinex_db`, volume `medinex_pgdata`; all 6 Flyway migrations applied and healthy. |
| **`medinex-mailpit`** | `Up` (`healthy`) | `1026->1025`, `8026->8025` | SMTP sink/UI active; `MAILPIT_MESSAGE_COUNT=0` after isolated test cleanup. |

---

## 3. Backend Integration & Live Security Regression (Task C)

### 3.1 Maven Suite (`mvn test` — Run After All Edits)
Executed in `e:/Project/MediNex/backend`: **`Tests run: 60, Failures: 0, Errors: 0, Skipped: 0`**, `BUILD SUCCESS`, `MVN_TEST_EXIT=0`, `mvn -q package -DskipTests` -> `MVN_PKG_EXIT=0`:

| Test Class | Tests | Elapsed | Result |
| :--- | :---: | :---: | :---: |
| [`AdminIntegrationTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/admin/AdminIntegrationTest.java) | 6 | `20.51 s` | **PASS** |
| [`AuthIntegrationTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/auth/AuthIntegrationTest.java) | 13 | `11.87 s` | **PASS** |
| [`EmailServiceTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/common/email/EmailServiceTest.java) | 2 | `0.220 s` | **PASS** |
| [`CommunityIntegrationTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/community/CommunityIntegrationTest.java) | 7 | `5.470 s` | **PASS** |
| [`FullUserJourneyE2EIntegrationTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/e2e/FullUserJourneyE2EIntegrationTest.java) | 1 | `1.495 s` | **PASS** |
| [`FollowIntegrationTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/follow/FollowIntegrationTest.java) | 6 | `5.144 s` | **PASS** |
| [`MediNexApplicationTests`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/MediNexApplicationTests.java) | 1 | `4.251 s` | **PASS** |
| [`ProjectControllerTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/project/ProjectControllerTest.java) | 4 | `0.808 s` | **PASS** |
| [`PrivacyAndRbacIntegrationTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/security/PrivacyAndRbacIntegrationTest.java) | 4 | `6.613 s` | **PASS** |
| [`SecurityHardeningAndPhiTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/security/SecurityHardeningAndPhiTest.java) | 5 | `1.008 s` | **PASS** |
| [`TeamControllerTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/team/TeamControllerTest.java) | 6 | `0.793 s` | **PASS** |
| [`AvatarUploadIntegrationTest`](file:///e:/Project/MediNex/backend/src/test/java/com/medinex/user/AvatarUploadIntegrationTest.java) | 5 | `6.037 s` | **PASS** |

### 3.2 Live HTTP & RBAC Probes (`http://localhost:8080`)
- **Anonymous denial (`401`):** `GET /api/v1/auth/me`, `GET /api/v1/admin/stats`, `GET /api/v1/admin/reports`, and `PUT /api/v1/projects/shasthosetu` all returned HTTP `401`.
- **Mixed-case public lookups (`200`):** `GET /api/v1/users/Contributor-01`, `GET /api/v1/users/CONTRIBUTOR-01/follow-stats`, and `GET /api/v1/community/users/CoNtRiBuToR-01/posts` all returned HTTP `200`.
- **Contributor least privilege (`403`):** `contributor-01` authenticated with roles `["ROLE_USER"]` only and received HTTP `403` on `/api/v1/admin/stats`, `/api/v1/admin/users`, `/api/v1/admin/reports`, `/api/v1/admin/settings`, `PUT /api/v1/projects/shasthosetu`, and `PUT /api/v1/team/members/contributor-02`.
- **Super Admin access (`200`):** `medinex-admin` (`["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_USER"]`) received HTTP `200` across `/api/v1/admin/{stats,users,audit-logs,analytics,settings,reports}`.
- **Operational Seed-Password Finding:** Authenticating `medinex-admin` with the updated `.env` `SEED_ADMIN_PASSWORD` (`SEED_ADMIN_PASSWORD_IS_DEFAULT_EXAMPLE: False`) returned `401`, whereas authenticating with [`DataInitializer`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/config/DataInitializer.java) default fallback credentials succeeded (`200`), because `DataInitializer` only hashes `SEED_ADMIN_PASSWORD` on initial creation (`if (!userRepository.existsByEmailIgnoreCase(adminEmail))`) and never rotates an already-seeded admin account when `.env` changes.

---

## 4. Playwright Browser E2E Verification (Task D)

Playwright (`@playwright/test@1.59.1`) executed real Chromium (`chrome.exe`, Chromium `148.0.7778.96`, `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`) across two complementary suites configured in [`frontend/playwright.config.ts`](file:///e:/Project/MediNex/frontend/playwright.config.ts):

### 4.1 Live Read-Only Smoke Suite (`npm run test:e2e:live`, Run After All Edits)
Executed against live `http://localhost:3000` -> `http://localhost:8080`: **`4 passed (13.6s)`**, `FE_LIVE_E2E=0`, zero `pageerror` exceptions, zero `5xx` responses, `users=19` unchanged:
1. Public routes, case-insensitive `/users/Contributor-01`, clickable author link from `/community` -> `/users/contributor-01`, and `/team` navigation render cleanly without client/server errors.
2. Anonymous visitors navigating to `/dashboard` and `/admin` are redirected away safely.
3. Standard contributor (`contributor-01`, `ROLE_USER`) logs in via UI, is denied `/admin` with `Access Restricted`, and signs out cleanly.
4. `medinex-admin` accesses `/admin`, `/admin/users`, and `/admin/settings` and signs out cleanly.

### 4.2 Ephemeral Isolated Mutating Suite (`npm run test:e2e:isolated` Against Temporary Stack)
Executed inside ephemeral containers (`medinex-p10-pg` on `--mount type=tmpfs`, `medinex-p10-backend` on `127.0.0.1:8082` wired to live Mailpit `mailpit:1025`, `medinex-p10-frontend` on `127.0.0.1:13000`; all temporary containers/image and Mailpit messages deleted immediately after): **`3 passed (19.9s)`**, `ISOLATED_E2E_EXIT=0`:
1. **Registration -> `/verify-email` OTP -> Resend Cooldown -> Mailpit Verify -> Login/Logout (`4.1s`):** Verifies redirect to `/verify-email?email=...&sent=1`, disabled 2-minute resend button during cooldown, error banner on invalid `000000` OTP, OTP retrieval from Mailpit (`From: medinexbd.noreply@gmail.com`, plaintext password absent from email body), account activation, dashboard login, and sign-out.
2. **Profile Privacy Toggle -> Private Feed/Profile Hide -> Follow Request Accept -> Unlock (`9.7s`):** Creates public post & bio, verifies clickable author link on `/community`, toggles `"Switch to Private"` in `/dashboard/settings`, confirms non-follower sees zero private posts on `/community` and `"This Account Is Private"` lock screen on `/users/[username]`, tests [`FollowButton`](file:///e:/Project/MediNex/frontend/src/components/follow/FollowButton.tsx#L88-L115) hover/pending state (`"Cancel Request"` while hovered -> `"Requested"` when pointer moves away), accepts the request in [`/dashboard/following`](file:///e:/Project/MediNex/frontend/src/app/(dashboard)/dashboard/following/page.tsx#L156-L372), and confirms accepted follower now views bio and private post. *(Note: initially caught two E2E script mismatches—hover state `"Cancel Request"` on [`FollowButton`](file:///e:/Project/MediNex/frontend/src/components/follow/FollowButton.tsx#L105-L112) and [`AdminController.updateUser`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/admin/controller/AdminController.java#L52-L61) `PUT /api/v1/admin/users/{id}` path; updating [`isolated-flows.spec.ts`](file:///e:/Project/MediNex/frontend/e2e/isolated-flows.spec.ts) led to a clean `3/3` pass.)*
3. **Moderator RBAC Boundaries & `SUPER_ADMIN` Protection (`4.4s`):** Promotes temporary user to `ROLE_MODERATOR` (`PUT /api/v1/admin/users/{id}`), verifies `"Moderation"` navbar link, checks `"Moderation Queue"` & `"Post Moderation"` visibility while `"Innovator Accounts"` & `"Site Settings"` are absent, confirms `"Access Restricted"` on `/admin/users` & `/admin/settings`, hides a post via `"Hide"` button (`"Hidden"` badge rendered) in [`/admin/posts`](file:///e:/Project/MediNex/frontend/src/app/(admin)/admin/posts/page.tsx#L189-L228), confirms `403` when moderator attempts user suspension via API, and confirms `403` when non-super `ROLE_ADMIN` attempts modifying `SUPER_ADMIN` roles.

---

## 5. Live-Container WebP, EXIF & Media Persistence Verification (Task E)

Tested live inside `medinex-backend` against safe placeholder account `contributor-06` (`d72dbfda-7177-4273-acd1-397f5125ffa2`, `avatar_url=null`, `is_placeholder=t`) and cleanly restored afterwards:
- **Validation & Security Gates:** Anonymous avatar upload -> `401`; disguised plain-text `.webp` -> `400`; undersized `8x8` WebP -> `400`; oversized `>5 MB` payload -> `413` ([`GlobalExceptionHandler.handleMaxUploadSizeException`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/common/exception/GlobalExceptionHandler.java#L53-L58)).
- **EXIF Stripping (JPEG):** Uploaded valid JPEG carrying 3 EXIF tags -> `200 OK`; all 3 generated variants (`64x64`, `256x256`, `512x512`) inspected and confirmed to contain **`exif_tags=0`**.
- **Pure-Java WebP Inside Alpine Container:** Both lossy **`VP8 `** (`600x400`) WebP and lossless **`VP8L`** RGBA (`400x600`) WebP uploads returned **`200 OK`**, confirming `com.twelvemonkeys.imageio:imageio-webp:3.13.1` runs natively inside Alpine JVM with no `musl` JNI errors.
- **Persistence Across Container Restart:** Ran `docker compose restart backend` -> backend returned healthy after 12 checks -> HTTP `8080` re-fetches of all three `VP8L`-derived JPEGs returned **100% matching byte lengths and SHA-256 checksums**:
  - `-sm.jpg` (`64px`): `693` bytes, SHA-256 `b1df777d320de3b74ed8b781a7842d5a79686ec19d0d670d323a892de1d7d89f`
  - `-md.jpg` (`256px`): `1,653` bytes, SHA-256 `c078b9e667b32df72868a641fb6af3917acc028ca268959fc5120c63b30078f7`
  - `-lg.jpg` (`512px`): `4,725` bytes, SHA-256 `8d47d421b9c2f19f204e6583014b820166b40b3bb3f359f566d84527c5a852bb`
- **Clean Restoration & Preservation:** Invoked `DELETE /api/v1/users/profile/avatar` (`200`), confirmed `user_profiles.avatar_url=NULL` and `0` leftover files in container directory `d72dbfda-...`, and re-verified `@jihadjkhan`'s original avatar hashes match byte-for-byte.

---

## 6. Email Delivery, Log Redaction & Transient SMTP Recovery (Task F)

| Verification Area | Observed Evidence | Status |
| :--- | :--- | :---: |
| **Live Container SMTP Env** | Inspected `medinex-backend` env: `MAIL_HOST=smtp.gmail.com`, `MAIL_PORT=587`, `MAIL_USERNAME=medinexbd.noreply@gmail.com`, `MAIL_SMTP_AUTH=true`, `MAIL_SMTP_STARTTLS=true`, `MAIL_FROM_ADDRESS=medinexbd.noreply@gmail.com`, `MAIL_FROM_NAME=MediNex Platform`, `MAIL_PASSWORD_LEN=19` (non-empty secret never printed). | **Verified** |
| **Gmail SMTP Network & STARTTLS** | Connected directly to `smtp.gmail.com:587`: `pre_tls_ehlo=250`, `starttls=220`, `post_tls_ehlo=250`, `auth_methods= LOGIN PLAIN XOAUTH2 PLAIN-CLIENTTOKEN OAUTHBEARER XOAUTH`. | **Verified** |
| **Mailpit Full Wire Flows** | Verified in isolated `medinex-p10-backend` + live Mailpit (`mailpit:1025`): `register` -> `201`, plain-text (`Text=True`, `HTML=False`) OTP from `medinexbd.noreply@gmail.com`, `verify-email` -> `200`, `forgot-password` -> `200`, `"MediNex Password Reset Request"` email received (`24`-char reset token), `reset-password` -> `200`, login with new password -> `200`. | **Verified** |
| **Credential Log Redaction** | Grepped full `medinex-p10-backend` container logs: **`otp_in_logs=False`**, **`reset_token_in_logs=False`**. | **Verified** |
| **Transient SMTP Failure Recovery** | Pointed `medinex-p10-badsmtp` (`127.0.0.1:18081`) at closed SMTP port `19999` with zero raw SQL: `register` returned `201` and rolled back/cleaned the undispatched token; immediate `resend-verification` against down SMTP returned **`503`** (`"Unable to dispatch verification code due to a temporary email service error. Please try again."`); immediate `resend-verification` against healthy Mailpit backend returned **`200`** with zero `120s` cooldown lock, followed by `verify-email` -> **`200`**. | **Verified** |
| **End-to-End External Gmail Inbox Receipt** | No controlled external recipient mailbox with automated IMAP/API readback is provisioned in this environment, and real Gmail send tests against third-party addresses were avoided per safety rules. | **BLOCKED** |

---

## 7. Admin Settings Persistence Investigation (Task G / `ISSUE-005`)

- **Schema & Codebase Findings:** PostgreSQL contains no `site_settings` table. Across all Java and TypeScript sources, [`AdminService.settingsHolder`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/admin/service/AdminService.java#L63-L73), [`getSettings`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/admin/service/AdminService.java#L376-L378), [`updateSettings`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/admin/service/AdminService.java#L380-L399), and [`AdminSettingsDto`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/admin/dto/AdminSettingsDto.java#L12-L19) (`maintenanceMode`, `allowUserRegistration`, `requireEmailVerification`, `phiWarningBannerEnabled`, `allowedDomains`, `platformNotice`) are referenced only by `AdminController`, `AdminService`, and `/admin/settings` — **no runtime filter or registration gate reads them**, and updates reset on container restart.
- **Phase 10 Decision:** Per Phase 10's preference against unnecessary schema changes, no Flyway migration was added; **`ISSUE-005` remains explicitly `OPEN` (P2)** and is flagged as a functional limitation for any operator assuming persistent enforcement of `/admin/settings`.

---

## 8. Non-Destructive Backup & Isolated Restore Validation (Task H)

### 8.1 Backup Artifacts Created (`e:/Project/MediNex/backups/phase10_20261111_095224/`)
All backup files were generated non-destructively from live `medinex-postgres` and read-only `medinex_uploads:/uploads:ro` and recorded in [`backup_manifest.json`](file:///e:/Project/MediNex/backups/phase10_20261111_095224/backup_manifest.json):

| File | Size | SHA-256 | Notes |
| :--- | :---: | :--- | :--- |
| `medinex_backup_20261111_095225.sql` (via [`backup.ps1`](file:///e:/Project/MediNex/infrastructure/scripts/backup.ps1)) | `103,414` B | `CA5436F857F346717CEDDB05D6EBC59E4A3A5FEBC352337C6922F106968BB589` | `ps1_sql_has_utf8_bom: true` due to PowerShell `Out-File -Encoding utf8`. |
| `medinex_db_clean_20261111_095224.sql` (via container `pg_dump -f`) | `101,174` B | `05BF10924799AE08BA273A57CC4B54A12A251E13ECC8A18BB6B40B3DE4F7B2FF` | No BOM (`first3=45,45,10`, portable across Linux `psql -f`). |
| `medinex_uploads_20261111_095224.tar.gz` | `109,539` B | `435E2617B8E7B51209A54ADD3AC327CFF6C017D8EB09F4525F7C60317278A2FE` | Captures named volume `medinex_uploads` (`--mount ro`). |

### 8.2 Isolated Restore Drill (`--tmpfs`, Ephemeral Containers Cleaned Up)
- Restored **both** `medinex_backup_20261111_095225.sql` (`Get-Content | psql`, matching [`restore.ps1`](file:///e:/Project/MediNex/infrastructure/scripts/restore.ps1): `PS1_BOM_RESTORE_EXIT=0`) and `medinex_db_clean_20261111_095224.sql` (`psql -v ON_ERROR_STOP=1 -f`) into ephemeral `postgres:16.4-alpine` `--tmpfs` instances (`medinex-p10-bompg`, `medinex-p10-restore-pg`), verifying `users=19`, `team_members=6`, `projects=1`, `flyway_max_rank=6`, and `jihadjkhan` `has_avatar=t`.
- Extracted `medinex_uploads_20261111_095224.tar.gz` and verified byte-for-byte SHA-256 identity across all 3 restored `@jihadjkhan` avatar resolution files.
- **Script Gaps Discovered:** (1) [`backup.ps1`](file:///e:/Project/MediNex/infrastructure/scripts/backup.ps1) writes a UTF-8 BOM (`0xEF 0xBB 0xBF`) via PowerShell redirection (`>`), which fails if passed directly to Linux `psql -f`; (2) all 4 scripts in [`infrastructure/scripts`](file:///e:/Project/MediNex/infrastructure/scripts) (`backup.ps1`, `restore.ps1`, `backup.sh`, `restore.sh`) back up PostgreSQL only and **omit `medinex_uploads`**; (3) [`01-init.sql`](file:///e:/Project/MediNex/infrastructure/docker/postgres/01-init.sql#L7) hardcodes `ALTER DATABASE medinex_db SET timezone TO 'UTC'`, assuming `POSTGRES_DB=medinex_db`.

---

## 9. Production Configuration, Security Posture & Backlog Review (Tasks I & J)

### 9.1 Production Readiness Checklist

| Control | Current State | Assessment |
| :--- | :--- | :---: |
| **Spring Profile (`SPRING_PROFILES_ACTIVE`)** | Live `.env` sets `dev` ([`application-dev.yml`](file:///e:/Project/MediNex/backend/src/main/resources/application-dev.yml) enables `show-sql: true` and `DEBUG` logging); **no `application-prod.yml` exists** in [`backend/src/main/resources`](file:///e:/Project/MediNex/backend/src/main/resources). | **Prod Blocker** |
| **PostgreSQL & JWT Secrets** | Live `.env` still uses default example `POSTGRES_PASSWORD` (`IsDefault=True`) and `JWT_SECRET_KEY` (`IsDefault=True`, length `96`); `SEED_ADMIN_PASSWORD` was changed in `.env`, but `medinex-admin` row still validates against the initial fallback seed credential. | **Prod Blocker** |
| **Swagger / OpenAPI Exposure** | `GET /v3/api-docs` returns HTTP `200` (unauthenticated `permitAll` in [`SecurityConfig`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/config/SecurityConfig.java)). | **Hardening Needed** |
| **Error Detail Reflection** | [`GlobalExceptionHandler.handleGenericException`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/common/exception/GlobalExceptionHandler.java#L67-L72) returns `"An unexpected error occurred: " + ex.getMessage()` on HTTP `500`. | **Hardening Needed** |
| **Token Storage vs Privacy Policy (`ISSUE-009`)** | [`AuthContext`](file:///e:/Project/MediNex/frontend/src/lib/auth-context.tsx#L24) stores `medinex_access_token` & `medinex_refresh_token` in `localStorage` ([`L53-L54`](file:///e:/Project/MediNex/frontend/src/lib/auth-context.tsx#L53-L54)), contradicting [`/privacy`](file:///e:/Project/MediNex/frontend/src/app/privacy/page.tsx#L69-L74) claiming `HttpOnly, Secure, SameSite cookies`. | **Hardening Needed** |
| **Frontend Security Headers & CSP** | Live `http://localhost:3000` serves `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`; however `Content-Security-Policy` in [`next.config.ts`](file:///e:/Project/MediNex/frontend/next.config.ts) allows `'unsafe-eval'`, `'unsafe-inline'`, and hardcoded dev origins (`localhost:8080/8082`, `127.0.0.1:8082`). | **Hardening Needed** |
| **CORS Preflight Enforcement** | Preflight `Origin: http://localhost:3000` -> `200` (`ACAO=http://localhost:3000`, `ACAC=true`); `Origin: https://evil.example.com` -> `403`. | **PASS** |
| **Actuator Locking** | `8081/actuator/health` -> `200 {"status":"UP"}`; `8081/actuator/metrics` -> `401` anonymous. | **PASS** |
| **Reverse Proxy, TLS & Rate Limiting** | No nginx/Caddy/Traefik TLS reverse proxy or auth rate-limiting filter (`ISSUE-009`) exists under [`infrastructure/`](file:///e:/Project/MediNex/infrastructure). | **Prod Blocker** |
| **Container Runtime & `.dockerignore`** | `medinex-backend` runs as `appuser`, `medinex-frontend` as `nextjs`; [`frontend/.dockerignore`](file:///e:/Project/MediNex/frontend/.dockerignore) exists, while `backend/.dockerignore` is absent (`ISSUE-008`). | **Minor Debt** |

### 9.2 Known Issues Backlog Review ([`MEDINEX_KNOWN_ISSUES.md`](file:///e:/Project/MediNex/MEDINEX_KNOWN_ISSUES.md))
- **Resolved & Verified in Phase 10:** `ISSUE-001` (schema/roles/context-path), `ISSUE-002` (project write RBAC), `ISSUE-003` (team contributor IDOR), `ISSUE-004` (private profile & mutual block feed/profile privacy, plus full E2E browser toggle & follow-request verification), `ISSUE-006` (moderator/admin boundaries verified in both API & Playwright), `ISSUE-007` (`npm run lint`), `ISSUE-010` (contributor `ROLE_USER` least privilege), `ISSUE-012` (Mailpit wire dispatch, log redaction, & transient `503` recovery — **external real Gmail inbox receipt remains `BLOCKED`**).
- **Still Open Backlog Items:** `ISSUE-005` (**P2 Open**: `AdminService.settingsHolder` in-memory/unenforced), `ISSUE-008` (**P3 Partial**: optional `backend/.dockerignore` missing), `ISSUE-009` (**P3 Open**: `localStorage` tokens vs `/privacy` HttpOnly claim + no auth rate limiter), `ISSUE-011` (**P3 Open**: URL-referenced post media attachments + local `hs_err_pid27608.log` artifact).

---

## 10. Final Verification Summary (Post-All-Edits)

| Suite / Command | Scope | Result |
| :--- | :--- | :---: |
| `mvn test` (`backend`) | 12 integration/unit test classes (`60` tests) | **60/60 PASS** (`0` fail, `0` skip) |
| `mvn -q package -DskipTests` (`backend`) | Spring Boot executable JAR build | **PASS** (`exit 0`) |
| `npm test` (`frontend`) | Node test suite (`src/__tests__/*.test.mjs`) | **7/7 PASS** (`0` fail, `0` skip) |
| `npm run lint` (`frontend`) | `eslint src/` | **PASS** (`exit 0`, `0` warnings/errors) |
| `npx tsc --noEmit` (`frontend`) | TypeScript strict typecheck | **PASS** (`exit 0`) |
| `npm run build` (`frontend`) | Next.js `16.4.6` Turbopack production build (`37` routes) | **PASS** (`exit 0`) |
| `npm run test:e2e:live` (`frontend`) | Live stack (`localhost:3000`) read-only Playwright Chromium suite | **4/4 PASS** (`13.6s`) |
| `npm run test:e2e:isolated` (`frontend`) | Ephemeral stack (`127.0.0.1:13000`/`8082`/Mailpit) mutating Playwright suite | **3/3 PASS** (`19.9s`) |

### Recommended Next Actions Before Public Production
1. Create `application-prod.yml` disabling `show-sql`, `DEBUG` logging, Swagger `/v3/api-docs` / `/swagger-ui/**`, and detailed `ex.getMessage()` reflection in [`GlobalExceptionHandler`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/common/exception/GlobalExceptionHandler.java#L67-L72).
2. Rotate `POSTGRES_PASSWORD`, `JWT_SECRET_KEY`, and live `medinex-admin` password (and align `.env.example` / `frontend/Dockerfile` port defaults with `compose.yaml`).
3. Put HTTPS TLS termination + rate limiting in front of `/api/v1/auth/**`, clean `next.config.ts` CSP directives, and reconcile `/privacy` cookie disclosures vs [`AuthContext`](file:///e:/Project/MediNex/frontend/src/lib/auth-context.tsx#L53-L54).
4. Execute one controlled real-inbox send test against a dedicated test mailbox with readback access to unblock external Gmail verification (`ISSUE-012`), extend `backup`/`restore` scripts to archive `medinex_uploads` without UTF-8 BOM (`ISSUE-005` DB persistence optional based on product need).
