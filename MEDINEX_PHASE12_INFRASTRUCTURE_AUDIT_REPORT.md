# MediNex — Phase 12 Infrastructure Audit Report

**Project:** MediNex — Healthcare Innovation & Technology Platform  
**Tagline:** *"Connecting Technology, Research & Healthcare Innovation."*  
**Featured Initiative:** ShasthoSetu — Interoperable Digital Health Record & Exchange Platform  
**Phase:** 12 — Production Backend Infrastructure, Managed Hosting Architecture & Secure Deployment Preparation  
**Audit Date:** 2026-11-11  
**Baseline Stack:** Next.js `16.4.6` (React 19, TypeScript) + Spring Boot `3.4.3` (Java 21, Hibernate `6.6.8.Final`, Flyway) + PostgreSQL

---

## 1. Executive Summary

Prior to Phase 12, MediNex had a live Vercel frontend deployment (`https://medinex-bd.vercel.app/` returning HTTP `200`), a working local 4-container Docker Compose stack (`medinex-frontend`, `medinex-backend`, `medinex-postgres`, `medinex-mailpit`), and a verified database state containing `19` users and `6` applied Flyway migrations (`V1` through `V6`). However, browser API calls in production failed because no hosted production Spring Boot backend or managed cloud PostgreSQL instance had been provisioned, causing the compiled frontend bundle to fall back silently to `http://localhost:8080/api/v1`.

During Phase 12, the repository was audited end-to-end and hardened for managed cloud production:

- **Backend Production Profile & Fail-Fast Guards:** Added [`application-prod.yml`](backend/src/main/resources/application-prod.yml) plus strict `prod`-profile runtime checks in [`JwtTokenProvider.java`](backend/src/main/java/com/medinex/common/security/JwtTokenProvider.java), [`DataInitializer.java`](backend/src/main/java/com/medinex/config/DataInitializer.java), [`SecurityConfig.java`](backend/src/main/java/com/medinex/config/SecurityConfig.java), and [`GlobalExceptionHandler.java`](backend/src/main/java/com/medinex/common/exception/GlobalExceptionHandler.java).
- **Frontend Fail-Fast API & Dynamic Security Configuration:** Added centralized resolution in [`env.ts`](frontend/src/lib/env.ts), removed hardcoded localhost fallbacks in [`client.ts`](frontend/src/lib/api/client.ts) and [`media.ts`](frontend/src/lib/media.ts), and updated [`next.config.ts`](frontend/next.config.ts) to enforce `https://` backend URLs on Vercel/HTTPS builds while dynamically building `Content-Security-Policy` (`connect-src`, `img-src`) and `images.remotePatterns`.
- **Single-Port PaaS Container Compatibility:** Updated [`backend/Dockerfile`](backend/Dockerfile) and [`compose.yaml`](compose.yaml) so PaaS providers injecting `$PORT` expose both application traffic and `/actuator/health/**` probes on a single port when `MANAGEMENT_SERVER_PORT` is omitted, while retaining isolated port `8081` for local Docker Compose.
- **Zero-Loss Verification:** Re-verified backend unit/integration tests (`64/64` PASS), built the Spring Boot fat JAR, confirmed missing production env vars fail fast on `prod` startup, verified frontend ESLint (`0`), TypeScript (`0`), unit tests (`12/12` PASS), Vercel build fail-fast guard (`exit 1` when misconfigured), rebuilt Docker app images cleanly without `-v` (`4/4` containers healthy), verified HTTP/CORS/405 runtime probes, passed Playwright `live-smoke.spec.ts` (`4/4` PASS), and preserved all `19` users in `medinex_db`.

External cloud provisioning (hosted backend PaaS, managed PostgreSQL, SMTP secret injection, and Vercel environment variable updates) was intentionally not executed because cloud accounts, billing approvals, DNS ownership, and deployment authorizations are outside autonomous scope.

---

## 2. Current Deployment & Production Gap Analysis

### 2.1 Observed Baseline vs. Production Gaps

| Area | Pre-Phase 12 State | Production Risk / Gap | Phase 12 Disposition |
| :--- | :--- | :--- | :--- |
| **Vercel Frontend** | `https://medinex-bd.vercel.app/` serves HTTP `200` | Silent fallback to `http://localhost:8080/api/v1`; static localhost-centric CSP & `remotePatterns` | Remediated in code (`env.ts`, `next.config.ts`); requires Vercel env var configuration & redeploy |
| **Backend Hosting** | Runs only inside local Docker (`medinex-backend`) | No public HTTPS origin for Vercel browser clients; hardcoded `MANAGEMENT_SERVER_PORT=8081` incompatible with single-port PaaS (`$PORT`) | Container & `prod` profile ready; cloud PaaS provisioning required |
| **Database** | Local Docker PostgreSQL (`medinex_pgdata`, 19 users, Flyway V1–V6) | No managed TLS Postgres; local URL fallback risk; PgBouncer/Flyway split not modeled | `application-prod.yml` supports `SPRING_DATASOURCE_URL` (`-pooler`) + `SPRING_FLYWAY_URL` (direct) with `sslmode=require` |
| **Secrets & Seed Hygiene** | Fallback dev JWT key in `application.yml`; seeded demo contributor passwords | Risk of deploying dev JWT secret or predictable seeded passwords into production | Fail-fast guards block dev/short JWT secrets and default/blank admin password in `prod`; `demo-users-enabled: false` in `prod` |
| **Media Storage (`/uploads`)** | [`AvatarImageService.java`](backend/src/main/java/com/medinex/user/service/AvatarImageService.java) writes 64/256/512px JPEGs to local disk (`UPLOAD_DIR`) | Stateless containers wipe uploaded avatars on every redeploy | Documented persistent volume mount requirement at `/app/uploads` (single instance) + future S3/R2 path |
| **SMTP Email Delivery** | `.env.example` specifies `smtp.gmail.com:587` with empty `MAIL_PASSWORD`; Mailpit local only | Account OTP registration & password reset fail silently or error without SMTP credentials | Documented mandatory transactional SMTP configuration; disabled mail Actuator probe interference |
| **Error Handling** | Spring `HttpRequestMethodNotSupportedException` previously surfaced `500` on wrong HTTP methods | Unclean HTTP semantics (`500` instead of `405`) and risk of raw exception messages in `500` responses | Added `405 Method Not Allowed` handler + sanitized `500` message in `GlobalExceptionHandler.java` |

### 2.2 Unused Optional Local Services

Inspection of [`backend/pom.xml`](backend/pom.xml) confirms the backend **does not include** `spring-boot-starter-data-redis` or any AWS S3 / MinIO SDK. The optional `redis` (`cache` profile) and `minio` (`storage` profile) blocks in [`compose.yaml`](compose.yaml) are unused by application code and **must not** be provisioned as paid dependencies in initial production.

---

## 3. Hosting Platform & Architecture Evaluation

### 3.1 Backend PaaS Evaluation (Spring Boot 3.4.3, Java 21, Persistent `/app/uploads`)

MediNex runs a Java 21 Spring Boot + Hibernate `6.6.8.Final` monolith (`~300–450 MiB` typical steady-state RSS, brief startup/GC peaks above `512 MiB`) and currently persists processed avatar thumbnails (`64px`, `256px`, `512px` JPEGs via TwelveMonkeys `imageio-webp`) on POSIX filesystem paths served via `/uploads/**`.

| Platform | Runtime & Docker Support | Persistent Volume Support | Asia-Pacific / Singapore Region | Free / Starter Tier Reality | Verdict for MediNex |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Railway** | Native multi-stage `Dockerfile`, auto-injected `$PORT`, configurable `/actuator/health` | Built-in Persistent Volumes (`~$0.15/GB-mo`, up to `5 GB` on Hobby) | Yes — `asia-southeast1-eqsg3a` (Metal) | 30-day trial / `$1/mo` Free (`0.5 GB` RAM cap); **Hobby `$5/mo` minimum** incl. `$5` usage credit; pay-per-use RAM/CPU (`~$10/GB-mo`, `~$20/vCPU-mo`) without sleep | **Primary Recommended Backend Host** (zero JVM sleep, flexible RAM above 512 MiB, native volume mount, Singapore proximity) |
| **Render** | Native `Dockerfile`, auto-injected `$PORT`, HTTP health checks | Persistent Disks (`$0.25/GB-mo`, single-instance lock) on paid instances | Yes (`sin` — Singapore) | Free Web (`$0`, `512 MB` RAM, sleeps after `15m` -> `~1m` Java cold start); paid Starter **`$7/mo`** (`512 MB`), **`$25/mo`** (`2 GB`) | **Strong Fixed-Cost Alternative** on paid Starter (`$7/mo`) + Disk (`$0.25/GB-mo`), provided `-Xmx384m` fits safely within `512 MB` |
| **Fly.io** | Dockerfile Machines, fine-grained VM memory/region control | Fly Volumes (`$0.15/GB-mo`, `10 GB` free snapshots) | Yes (`sin` — Singapore) | Usage-based (no permanent free tier; `shared-cpu-2x 512MB ~$4.39/mo`); **Fly Managed Postgres starts at `$38/mo`** | Viable for container experts, but higher operational complexity (`fly.toml`) and costly Managed Postgres |
| **Koyeb** | Dockerfile & Git builds | Limited on starter; external storage preferred | Yes (Singapore) | 1 Free micro instance (`512 MB`, scales to zero); Eco-Small `$5.36/mo` (`1 GB` shared CPU) | Viable budget backup; weaker persistent-disk story than Railway/Render |
| **Google Cloud Run** | Container serverless (`PORT=8080`) | Ephemeral local filesystem only (GCS FUSE caveats for POSIX apps) | Yes (`asia-southeast1`) | Always Free monthly quota (`180k vCPU-s`, `360k GiB-s`), **zero persistent local disk** unless refactored to GCS/S3 | **Not Recommended Yet** (requires S3/GCS refactoring first; JVM cold starts if `min-instances=0`) |
| **DigitalOcean App Platform** | Dockerfile / Git deploy | Ephemeral container disk on App Platform | Yes (`sgp`) | `$5/mo` (`512 MiB`), `$10–$12/mo` (`1 GiB`), **no local persistent disk** on basic App Platform | **Not Recommended Yet** until avatars move to Spaces/S3 |

### 3.2 Managed PostgreSQL Evaluation

| Database Provider | Region Proximity | TLS / Security | Pooling & Flyway Compatibility | Backup / PITR | Free / Entry Pricing Reality | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Neon Serverless Postgres** | AWS Singapore (`aws-ap-southeast-1`) | Mandatory `sslmode=require` | Separate **`-pooler` (PgBouncer Transaction Mode)** for JPA runtime + **Direct non-pooled host** for Flyway (`SPRING_FLYWAY_URL`) | Free: **6-hour** PITR window; Launch: **7 days**; Scale: **30 days** | **Non-expiring Free plan** (`0.5–1 GB` storage, `100 CU-hrs/mo`, scales to zero after `5m` idle); Launch `$0.106/CU-hr` + `$0.35/GB-mo` | **Primary Recommended Managed PostgreSQL** |
| **Railway Postgres** | Singapore (same Metal cluster as Railway Backend) | Private internal networking + optional public TCP TLS | Direct PostgreSQL connection (no external pooler needed inside small service) | Volume snapshots on Pro (`$20/mo`); logical `pg_dump` on Hobby | Usage-based inside Hobby (`$5/mo` floor); typically `$2–$5/mo` extra for small DB | **Convenient Same-Platform Option** if consolidating billing onto Railway Hobby (`~$7–$12/mo` total) |
| **Render Managed Postgres** | Singapore (`sin`) | TLS supported | Direct Postgres connection | Daily automated backups on paid plans | **Free tier expires & deletes after 30 days** (+14d grace); paid starts **`~$6/mo`** (`1 GB` storage) | **Avoid Free Tier**; use paid Starter (`$6+/mo`) only if consolidating strictly on Render |
| **Supabase Postgres** | Singapore (`ap-southeast-1`) | TLS enforced | Direct + Supavisor pooler | Daily backups on Pro | Free (`500 MB`) **pauses after 1 week of inactivity**; Pro **`$25/mo`** | Overkill (`Auth`/`Storage`/`PostgREST` unused by Spring Boot) and higher Pro jump |
| **Fly Managed Postgres** | Singapore (`sin`) | Private WireGuard / TLS | PgBouncer included | HA + automated backups | Starts at **`$38/mo`** (`2` HA nodes) | Too expensive for current stage |

---

## 4. Recommended Production Architecture

### 4.1 Primary Recommended Stack

1. **Frontend Edge & SSR:** **Vercel** (`https://medinex-bd.vercel.app`) running Next.js `16.4.6`, compiled with `NEXT_PUBLIC_API_BASE_URL=https://<backend-domain>/api/v1`.
2. **Backend API & Media Host:** **Railway Hobby** (`asia-southeast1-eqsg3a` Singapore Metal region), single always-on container built from [`backend/Dockerfile`](backend/Dockerfile) with `SPRING_PROFILES_ACTIVE=prod` and a **`1–2 GB` Railway Persistent Volume** mounted at `/app/uploads`.
3. **Managed PostgreSQL:** **Neon Serverless PostgreSQL** (`aws-ap-southeast-1` Singapore), Free tier (`$0`) for initial controlled staging/launch -> **Launch plan** (`7-day` PITR) for ongoing production continuity. Spring runtime uses Neon's `-pooler` JDBC URL (`sslmode=require`, `DB_POOL_MAX=10`), while Flyway connects directly via `SPRING_FLYWAY_URL`.
4. **Transactional Email (SMTP):** Dedicated verified SMTP relay (e.g., Resend SMTP, Brevo SMTP, Mailgun SMTP, or temporary Gmail App Password with low volume) via `MAIL_HOST` / `MAIL_PORT=587` / `MAIL_USERNAME` / `MAIL_PASSWORD`.

*Architecture Rationale:* Keeping media on `/app/uploads` mounted to a single-instance persistent volume eliminates immediate code rewrites, avoids S3 billing/IAM overhead, preserves all multi-resolution avatar behavior tested in Phase 9–11, and requires **zero container sleep** for Spring Boot.

---

## 5. Backend Production Readiness Assessment

- **Dedicated `prod` Profile ([`application-prod.yml`](backend/src/main/resources/application-prod.yml)):**
  - Server binds to `${PORT:${SERVER_PORT:8080}}` with `server.forward-headers-strategy: native` so TLS reverse proxies pass accurate scheme/host headers.
  - Management port binds to `${MANAGEMENT_SERVER_PORT:${PORT:${SERVER_PORT:8080}}}`, making single-port PaaS healthchecks work out of the box while keeping [`compose.yaml`](compose.yaml) isolated on port `8081`.
  - No fallback values for `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET_KEY`, or `CORS_ALLOWED_ORIGINS` — missing any variable aborts Spring Boot startup immediately.
  - `springdoc.api-docs.enabled` and `springdoc.swagger-ui.enabled` default to `false` (`SPRINGDOC_ENABLED:false`) so OpenAPI schemas are not exposed publicly in production.
- **Security Hardening Verified:**
  - [`JwtTokenProvider.java`](backend/src/main/java/com/medinex/common/security/JwtTokenProvider.java) rejects blank keys, the repository dev fallback key, and keys shorter than `32` decoded bytes when `prod` profile is active.
  - [`DataInitializer.java`](backend/src/main/java/com/medinex/config/DataInitializer.java) sets `demo-users-enabled: false` in `prod` (preventing creation of `contributor-01`..`contributor-06` with default passwords) and requires a non-default explicit `SEED_ADMIN_PASSWORD` when initializing an admin in `prod`.
  - [`SecurityConfig.java`](backend/src/main/java/com/medinex/config/SecurityConfig.java) permits `/actuator/health/**` (enabling Kubernetes/PaaS `/health/liveness` & `/health/readiness`), trims/filters blank `CORS_ALLOWED_ORIGINS` entries, and blocks `*` origin wildcards when `allowCredentials=true`.

---

## 6. Database & Flyway Migration Readiness

- **Schema Governance:** `spring.jpa.hibernate.ddl-auto=validate` and `spring.jpa.open-in-view=false` are enforced across both [`application.yml`](backend/src/main/resources/application.yml) and [`application-prod.yml`](backend/src/main/resources/application-prod.yml).
- **Migration Chain (`V1`–`V6`):** All six SQL migrations in `backend/src/main/resources/db/migration/` are currently applied cleanly (`flyway_schema_history`: `6` rows, all `success = t`) and are forward-only/PostgreSQL-standard (`V1__init_schema.sql` through `V6__restrict_contributor_roles.sql`).
- **PgBouncer / Neon Dual-URL Support:** Added `spring.flyway.url=${SPRING_FLYWAY_URL:${SPRING_DATASOURCE_URL}}` in [`application-prod.yml`](backend/src/main/resources/application-prod.yml) because Flyway advisory locks require session-level guarantees on a direct non-pooled PostgreSQL endpoint rather than transaction-mode `-pooler` connections.
- **HikariCP Production Pool Sizing:** Bounded to `maximum-pool-size: ${DB_POOL_MAX:10}`, `minimum-idle: ${DB_POOL_MIN:2}`, `max-lifetime: 900000` (`15m`), `keepalive-time: 120000`, `connection-test-query: SELECT 1` — safe for Neon scale-to-zero wakeups and Starter DB connection limits.
- **Local Data Preservation:** Local PostgreSQL database `medinex_db` inside volume `medinex_pgdata` remains completely intact with `19` verified users (`admin`, seeded contributors, and verified integration users).

---

## 7. Storage, Email & Background Service Readiness

- **Media & Avatar Storage:** [`AvatarImageService.java`](backend/src/main/java/com/medinex/user/service/AvatarImageService.java) validates uploads up to `5 MB` (`jpeg`, `jpg`, `png`, `gif`, `bmp`, `webp`, dimension bounds `16px–4096px`), strips metadata, center-crops, and saves `sm` (`64px`), `md` (`256px`), and `lg` (`512px`) JPEGs under `${UPLOAD_DIR}/avatars/{userId}/`.
  - **Architectural Constraint:** Requires single-replica container deployment + persistent disk mounted at `/app/uploads`. Horizontal auto-scaling (`>1` backend replica) MUST wait until storage is migrated to Cloudflare R2 / AWS S3.
  - **Post Media Note:** Community post media URLs accept string URLs (`mediaUrls`), whereas only profile avatars use local multipart file upload today.
- **Email Service:** Registration OTP (`verify-email`) and password resets depend on SMTP (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`). Mailpit (`medinex-mailpit`) must never run in production. Leaving `MAIL_PASSWORD` unset in production would break user registration OTP verification.
- **Background Jobs / Cache:** No separate worker queue, Cron runner, or Redis cache client exists in `backend/pom.xml`. Only standard Spring Boot Tomcat request threads run inside `medinex-backend`.

---

## 8. Security & Secrets Readiness

| Security Control | Status | Details & Known Limitations |
| :--- | :--- | :--- |
| **Fail-Fast Production Secrets** | **PASS (Verified)** | Unset `SPRING_DATASOURCE_URL` aborts JAR startup (`PlaceholderResolutionException`); weak/dev `JWT_SECRET_KEY` and weak/empty `SEED_ADMIN_PASSWORD` rejected by code & JUnit tests |
| **CSP & HTTPS Origin Locking** | **PASS (Verified)** | Cloud/HTTPS builds (`VERCEL=1` or `https://` `NEXT_PUBLIC_APP_URL`) strip `localhost` origins from [`next.config.ts`](frontend/next.config.ts) CSP and inject only the HTTPS API origin |
| **CORS Origin Hygiene** | **PASS (Verified)** | Empty entries filtered; `*` blocked with credentials; local Compose verified returning `200` for `http://localhost:3000` preflight and `403` for unconfigured origins |
| **Credential Redaction in Logs & Repo** | **PASS** | Phase 9 removed plaintext OTP/reset logging (`(OTP redacted)`); Phase 12 templates (`.env.production.example`, `frontend/.env.example`) contain placeholders only |
| **Auth Token Storage (`ISSUE-009` Known Limitation)** | **WARNING (Deferred)** | Access and refresh JWTs are still returned in JSON responses and stored in browser `localStorage` (`auth-context.tsx`), paired with stateless Bearer auth and CSRF disabled. Strong CSP (`script-src 'self' 'unsafe-inline'`) partially mitigates XSS risk, but migrating refresh/session state to `HttpOnly; Secure; SameSite` cookies remains recommended for a post-launch security phase |
| **Scale-Up Restriction** | **WARNING** | Local filesystem avatar storage restricts production backend scaling to **1 replica** until migrated to S3/R2 object storage |

---

## 9. Frontend-Backend Connectivity Plan

1. **Build-Time API Resolution (`NEXT_PUBLIC_API_BASE_URL`):** All browser calls route through [`env.ts`](frontend/src/lib/env.ts) -> `getApiBaseUrl()` / `getApiOrigin()` used by [`client.ts`](frontend/src/lib/api/client.ts) and [`media.ts`](frontend/src/lib/media.ts).
2. **Vercel Build Guard:** During Vercel deployment (`VERCEL=1`), Next.js immediately rejects missing, `http://`, or `localhost`/`127.0.0.1` API URLs at `next.config.ts` evaluation time, preventing broken production deployments from ever shipping.
3. **CORS & Headers Synchronization:** Backend `CORS_ALLOWED_ORIGINS` must match the exact canonical frontend origin (`https://medinex-bd.vercel.app`, plus any custom domain comma-separated without trailing slash).
4. **Remote Image Rendering:** Avatar URLs returned as `/uploads/avatars/...` resolve against `getApiOrigin()` and are allowed cleanly by [`next.config.ts`](frontend/next.config.ts) `images.remotePatterns` and CSP `img-src`.

---

## 10. Observability, Healthchecks & Error Handling

- **Health Endpoint Exposure:** `application-prod.yml` exposes **only** `health` (`/actuator/health`, `/actuator/health/liveness`, `/actuator/health/readiness`) with `show-details: never` and `management.health.mail.enabled: false` (preventing transient SMTP timeouts from marking the entire web service down and triggering container restarts).
- **Single-Port Probe Compatibility:** Updated [`backend/Dockerfile`](backend/Dockerfile) `HEALTHCHECK` (`http://localhost:${MANAGEMENT_SERVER_PORT:-${PORT:-${SERVER_PORT:-8080}}}/actuator/health`) works uniformly on Railway/Render (`$PORT`) and local Docker Compose (`MANAGEMENT_SERVER_PORT=8081`).
- **Exception Handling:** [`GlobalExceptionHandler.java`](backend/src/main/java/com/medinex/common/exception/GlobalExceptionHandler.java) now maps unsupported HTTP verbs to HTTP `405` (`HttpRequestMethodNotSupportedException`) instead of HTTP `500`, and returns a generic message (`"An unexpected internal error occurred"`) on unhandled exceptions without exposing stack traces or SQL/bean details.
- **Structured Logging:** Production logging sets `root: INFO`, `com.medinex: INFO`, `org.springframework.security: WARN`, `org.hibernate.SQL: WARN` (never logging SQL parameter values or credentials).

---

## 11. Backup & Disaster Recovery Strategy

- **Existing Repository Backup Tooling:** [`infrastructure/scripts/backup.ps1`](infrastructure/scripts/backup.ps1) and [`infrastructure/scripts/backup.sh`](infrastructure/scripts/backup.sh) execute `pg_dump --clean --if-exists` locally against `medinex-postgres`.
- **Cloud PostgreSQL Strategy:**
  - **Neon PITR:** Free plan preserves a `6-hour` instant restore history window; upgrade to **Neon Launch** for **`7-day` PITR** once public user signups begin.
  - **Scheduled External `pg_dump`:** Run automated encrypted nightly `pg_dump -Fc` against Neon's direct non-pooled endpoint into private off-platform storage (GitHub Actions artifact/encrypted bucket or operator storage) using `PGSSLMODE=require`.
- **Avatar Media Volume Backup (`/app/uploads`):** Perform scheduled `tar -czf` snapshots of `/app/uploads` (or Railway volume backups once enabled) so profile avatars survive accidental file deletion or provider migration.
- **Database Migration Safety:** Flyway migrations `V1`–`V6` are forward-only; never edit already-applied checksums. Always take a `pg_dump` snapshot or Neon branch before applying any future `V7+` migration in production.

---

## 12. Cost & Free/Starter Tier Analysis

| Architecture Tier | Components | Monthly Cost (USD) | Operational Characteristics & Tradeoffs |
| :--- | :--- | :--- | :--- |
| **Strictly `$0` Evaluation** | Vercel Hobby (`$0`) + Koyeb Free Micro (`$0`, `512 MB`, scales to zero) + Neon Free (`$0`, `0.5–1 GB`, `100 CU-hrs/mo`, 5m idle sleep) + Gmail SMTP (`$0`) | **`$0/mo`** | **Caveats:** JVM cold starts (`30–60s`) on scale-to-zero, tight `512 MB` RAM risk on Free micro VMs, lack of reliable persistent volume for `/uploads` on Koyeb Free, `6h` Neon PITR limit |
| **Recommended Low-Cost Starter (Best Reliability/Cost)** | Vercel Hobby (`$0`) + **Railway Hobby (`$5/mo` incl. `$5` credit + `1–2 GB` Volume)** + **Neon Free -> Launch (`$0` -> `~$2–$6/mo` usage)** + Resend/Brevo Free SMTP (`$0`, ~100–300 emails/day free) | **`$5 – $12/mo`** | Zero cold starts, `asia-southeast1` Singapore region, handles Java RAM spikes >`512 MB` without OOM crashes, durable `/app/uploads` volume, non-expiring Neon DB with PITR |
| **Fixed-Price Alternative** | Vercel Hobby (`$0`) + **Render Starter (`$7/mo`, `512 MB` + `$0.25–$1/mo` Disk)** + Render Starter Postgres (**`$6+/mo`**) or Neon (`$0+`) | **`$7.50 – $14/mo`** | Predictable flat billing in Singapore (`sin`), zero DB expiry risk (avoid Render Free Postgres which deletes after `30` days), requires `-Xmx360m` tuning if staying on `$7` `512 MB` plan |

---

## 13. Verification Results (Executed in Phase 12)

All checks below were directly executed against the repository and local Docker Compose stack after final edits, with zero database resets and zero volume deletions:

| Verification Check | Scope & Command / Probe | Outcome | Observed Result |
| :--- | :--- | :--- | :--- |
| **Backend Test Suite & Packaging** | `cd backend && mvn test package -DskipTests=false` | **PASS** | **`64/64` tests PASS**, `0` failures, `0` errors, `0` skipped across `13` test classes (`ProductionConfigValidationTest` 4/4, `AuthIntegrationTest` 13/13, `CommunityIntegrationTest` 7/7, `AdminIntegrationTest` 6/6, `FollowIntegrationTest` 6/6, `TeamControllerTest` 6/6, `SecurityHardeningAndPhiTest` 5/5, `AvatarUploadIntegrationTest` 5/5, `PrivacyAndRbacIntegrationTest` 4/4, `ProjectControllerTest` 4/4, `EmailServiceTest` 2/2, `MediNexApplicationTests` 1/1, `FullUserJourneyE2EIntegrationTest` 1/1); fat JAR built (`BUILD SUCCESS`) |
| **Production Profile Fail-Fast Probe** | `java -jar backend/target/medinex-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod --server.port=0` (unset env) | **PASS** | Exit code `1`; startup aborted immediately with `PlaceholderResolutionException: Could not resolve placeholder 'SPRING_DATASOURCE_URL'` |
| **Frontend Static Checks** | `npm run lint` (`eslint src/`), `npx tsc --noEmit` | **PASS** | Both exited `0` cleanly |
| **Frontend Unit Tests** | `npm test` (`node --test src/__tests__/*.test.mjs`) | **PASS** | **`12/12` PASS**, `0` failures, `0` skipped (includes `5` API env/localhost guard tests in `production-config.test.mjs`) |
| **Vercel Misconfiguration Guard** | `VERCEL=1 VERCEL_ENV=production NEXT_PUBLIC_APP_URL=https://medinex-bd.vercel.app npx next build` | **PASS** | Exit code `1`; blocked build with `Error: Invalid or missing NEXT_PUBLIC_API_BASE_URL (http://localhost:8080/api/v1) for HTTPS/Vercel production build. Cannot fall back to localhost.` |
| **Local Production Next.js Build** | `npm run build` (`frontend/`) | **PASS** | Exit code `0`; compiled all `37/37` routes cleanly |
| **Docker Compose Validation & App Rebuild** | `docker compose config --quiet && docker compose up -d --build backend frontend` | **PASS** | Config exit `0`; `medinex-backend` & `medinex-frontend` rebuilt and started; all `4/4` containers `Up ... (healthy)` (`medinex-postgres` untouched) |
| **HTTP, Actuator, CORS & Error Probes** | `curl.exe` against `127.0.0.1:8080`, `8081`, `3000` | **PASS** | `/actuator/health` -> `200 {"status":"UP"}`; `/api/v1/community/feed` -> `200`; `/api/v1/admin/overview` (unauth) -> `401`; `GET /api/v1/community/posts` -> **`405`**; `OPTIONS` (`localhost:3000`) -> `200`; `OPTIONS` (`https://medinex-bd.vercel.app` against dev CORS) -> `403`; frontend `/` -> `200` |
| **Playwright E2E Live Smoke** | `E2E_BASE_URL=http://localhost:3000 npm run test:e2e:live -- --reporter=list` | **PASS** | **`4/4` PASS** (`13.1s`), exit code `0` (public routes, mixed-case profiles, auth redirects, contributor RBAC denial, admin overview/settings) |
| **Data & Migration Integrity** | `psql` queries inside `medinex-postgres` + `docker volume ls` | **PASS** | `users_count = 19`; `flyway_schema_history` shows `6` rows (`V1`–`V6`), all `success = t`; `medinex_pgdata` & `medinex_uploads` preserved |
| **Existing Live Vercel Probe** | Read-only `curl.exe` to `https://medinex-bd.vercel.app/` | **INFO** | HTTP `200` (existing pre-Phase-12 Vercel deployment remains up; still awaits new env vars & redeploy once backend URL exists) |

---

## 14. Issues Found & Remediations Applied / Remaining Recommendations

### 14.1 Remediations Applied in Phase 12

1. **Created [`application-prod.yml`](backend/src/main/resources/application-prod.yml):** Dedicated fail-fast production profile with `$PORT` binding, shared single-port Actuator health probes (`show-details: never`, mail check off), Neon `-pooler` + `SPRING_FLYWAY_URL` separation, disabled Swagger/SpringDoc by default, and disabled demo users.
2. **Hardened [`JwtTokenProvider.java`](backend/src/main/java/com/medinex/common/security/JwtTokenProvider.java) & [`DataInitializer.java`](backend/src/main/java/com/medinex/config/DataInitializer.java):** Enforces cryptographic JWT secrets and explicit admin seed passwords under `prod`, disabling default contributor demo seeding in production.
3. **Hardened [`SecurityConfig.java`](backend/src/main/java/com/medinex/config/SecurityConfig.java) & [`GlobalExceptionHandler.java`](backend/src/main/java/com/medinex/common/exception/GlobalExceptionHandler.java):** Permitted `/actuator/health/**`, guarded CORS wildcard/empty origins, added HTTP `405` handler, and sanitized unhandled `500` error bodies.
4. **Centralized & Guarded Frontend URLs ([`env.ts`](frontend/src/lib/env.ts), [`client.ts`](frontend/src/lib/api/client.ts), [`media.ts`](frontend/src/lib/media.ts), [`next.config.ts`](frontend/next.config.ts)):** Removed silent localhost fallbacks, enforced HTTPS API URL on Vercel/HTTPS builds, and dynamically derived CSP & `images.remotePatterns`.
5. **Fixed Docker/Compose Alignment ([`backend/Dockerfile`](backend/Dockerfile), [`frontend/Dockerfile`](frontend/Dockerfile), [`compose.yaml`](compose.yaml)):** Removed hardcoded `MANAGEMENT_SERVER_PORT=8081` from the backend image `ENV` (moving it to `compose.yaml` service env) and synced updated MediNex tagline strings.
6. **Added Production Templates & Regression Tests:** Created [`.env.production.example`](.env.production.example), [`frontend/.env.example`](frontend/.env.example), [`production-config.test.mjs`](frontend/src/__tests__/production-config.test.mjs), and [`ProductionConfigValidationTest.java`](backend/src/test/java/com/medinex/config/ProductionConfigValidationTest.java).

### 14.2 Remaining Pre-Production & Post-Launch Recommendations

1. **Mandatory Before Production Cutover:** Provision Railway Hobby + Volume (`/app/uploads`) + Neon Serverless PostgreSQL (`aws-ap-southeast-1`), provision transactional SMTP credentials, set Vercel `NEXT_PUBLIC_API_BASE_URL` & `NEXT_PUBLIC_APP_URL`, and trigger a fresh Vercel production deployment.
2. **Post-Launch Architectural Improvements:**
   - Migrate avatar storage from local `/app/uploads` to S3-compatible object storage (Cloudflare R2 or AWS S3) before scaling backend replicas >`1`.
   - Upgrade JWT refresh/session handling from `localStorage` (`ISSUE-009`) to `HttpOnly; Secure; SameSite` cookies if security compliance requirements tighten.

---

## 15. Final Production Deployment Decision

### Overall Classification: **`READY AFTER CONFIGURATION`** *(Backend/Source/DB Ready for Staging; Cloud Deployment `BLOCKED — CLOUD ACCOUNT OR AUTHORIZATION REQUIRED`)*

| Dimension | Classification | Justification |
| :--- | :--- | :--- |
| **1. SOURCE CODE READINESS** | **`READY FOR STAGING DEPLOYMENT`** | All Phase 12 security guards, `prod` Spring profile, Next.js build-time HTTPS enforcement, `64/64` Maven tests, `12/12` frontend tests, and `37/37` Next.js build routes pass cleanly |
| **2. BACKEND READINESS** | **`READY AFTER CONFIGURATION`** | Multi-stage `backend/Dockerfile`, fat JAR, `/actuator/health` single-port binding, and fail-fast secret checks pass; requires cloud PaaS instance, persistent disk at `/app/uploads`, and live production secrets (`JWT_SECRET_KEY`, `SPRING_DATASOURCE_URL`, SMTP, `SEED_ADMIN_PASSWORD`) |
| **3. DATABASE READINESS** | **`READY AFTER CONFIGURATION`** | Flyway `V1`–`V6` migrations are clean and Hibernate `validate` passes; local `medinex_db` (`19` users) intact; requires provisioning Neon Serverless Postgres (`aws-ap-southeast-1`) and deciding clean production seed vs controlled data dump restore |
| **4. FRONTEND INTEGRATION READINESS** | **`READY AFTER CONFIGURATION`** | Frontend dynamically validates and wires `NEXT_PUBLIC_API_BASE_URL` into `client.ts`, `media.ts`, CSP, and `remotePatterns`; requires updating Vercel project env vars and triggering Vercel production redeploy |
| **5. CLOUD INFRASTRUCTURE READINESS** | **`BLOCKED — CLOUD ACCOUNT OR AUTHORIZATION REQUIRED`** | External cloud accounts (Railway/Render, Neon, transactional SMTP provider) and Vercel project modifications have not been provisioned or authorized yet |
| **6. PRODUCTION DEPLOYMENT READINESS** | **`NOT READY` (Blocked on External Configuration & Provisioning)** | Live production traffic cannot connect until the backend PaaS, managed Postgres, SMTP relay, and Vercel environment variables are provisioned and verified in cloud |
