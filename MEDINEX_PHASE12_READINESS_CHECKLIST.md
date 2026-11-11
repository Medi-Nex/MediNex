# MediNex — Phase 12 Production Readiness Checklist

**Project:** MediNex — Healthcare Innovation & Technology Platform  
**Featured Initiative:** ShasthoSetu — Interoperable Digital Health Record & Exchange Platform  
**Phase:** 12 — Production Infrastructure, Managed Hosting Architecture & Secure Deployment Preparation  
**Audit Date:** 2026-11-11  

---

## 1. Classification Legend

- **`PASS`** — Executed or verified directly against live code, build, or container runtime with zero blockers.
- **`WARNING`** — Works in initial single-instance production, with a documented operational limitation or future enhancement needed.
- **`FAIL`** — Active defect blocking direct production operation (currently applies only to unconfigured cloud link on live Vercel).
- **`BLOCKED`** — Requires external cloud account credentials, billing approval, or operator deployment authorization.
- **`NOT TESTED`** — Could not be run against remote cloud infrastructure until cloud services are provisioned.

---

## 2. Phase 12 Execution & Readiness Checklist

### 2.1 Source Code & Build Hardening

| Check Item | Status | Verification Evidence |
| :--- | :--- | :--- |
| Repository, branch & uncommitted baseline audited cleanly with zero data loss | **`PASS`** | Inspected repository config/code; `medinex_db` intact (`19` users), volumes intact |
| Spring Boot `prod` profile (`application-prod.yml`) binds `$PORT` & shared `/actuator/health` | **`PASS`** | Verified [`application-prod.yml`](backend/src/main/resources/application-prod.yml) and [`backend/Dockerfile`](backend/Dockerfile) |
| Missing/weak production secrets fail fast (`SPRING_DATASOURCE_URL`, `JWT_SECRET_KEY`, `SEED_ADMIN_PASSWORD`) | **`PASS`** | Executed `java -jar ... --spring.profiles.active=prod` -> exit `1` (`PlaceholderResolutionException`); `ProductionConfigValidationTest` (`4/4` PASS) |
| Demo contributor accounts (`contributor-01..06`) disabled in `prod` profile | **`PASS`** | Configured `medinex.seed.demo-users-enabled: false` in `application-prod.yml` & guarded in `DataInitializer.java` |
| Swagger / OpenAPI disabled by default in production (`SPRINGDOC_ENABLED=false`) | **`PASS`** | Set in [`application-prod.yml`](backend/src/main/resources/application-prod.yml) |
| Wrong HTTP method maps to `405` and unhandled `500` redacts internal exceptions | **`PASS`** | Verified `GET /api/v1/community/posts` -> HTTP `405`; `GlobalExceptionHandler` tested |
| Frontend centralizes API resolution (`env.ts`) and forbids localhost fallback in cloud HTTPS builds | **`PASS`** | Simulated `VERCEL=1` misconfigured build -> exit `1`; `npm test` `12/12` PASS |
| Frontend dynamic CSP & `images.remotePatterns` omit `localhost` on Vercel/HTTPS builds | **`PASS`** | Verified [`next.config.ts`](frontend/next.config.ts) & Security Headers test in `npm test` |
| Environment templates created without any real secrets (`.env.production.example`, `frontend/.env.example`) | **`PASS`** | Verified strict placeholder-only templates |

### 2.2 Local Build, Container & Integration Verification

| Check Item | Status | Verification Evidence |
| :--- | :--- | :--- |
| Backend Maven test suite & executable JAR build (`mvn test package -DskipTests=false`) | **`PASS`** | **`64/64` PASS** (`0` fail, `0` skipped) across `13` test classes; `BUILD SUCCESS` |
| Frontend static quality (`npm run lint`, `npx tsc --noEmit`) | **`PASS`** | Both exited `0` |
| Frontend local production build (`npm run build`) | **`PASS`** | Exited `0` across all `37/37` App Router routes |
| Docker Compose validation & rebuilt app containers (`docker compose up -d --build backend frontend`) | **`PASS`** | `docker compose config --quiet` exit `0`; `4/4` containers `healthy` |
| Runtime HTTP/Actuator/CORS/RBAC curl probes against local Docker stack | **`PASS`** | `/actuator/health` `200`, feed `200`, unauth admin `401`, invalid method `405`, CORS `200`/`403` |
| Playwright E2E read-only smoke suite (`live-smoke.spec.ts`) against rebuilt stack | **`PASS`** | **`4/4` PASS** (`13.1s`, exit `0`) |
| Persistent DB & Flyway integrity preserved (`medinex_pgdata`, `medinex_uploads`) | **`PASS`** | PostgreSQL `users_count = 19`; Flyway `V1`–`V6` `6/6` `success = t` |

### 2.3 Cloud Infrastructure, Storage, Auth & External Cutover

| Check Item | Status | Notes / Action Required |
| :--- | :--- | :--- |
| Existing live Vercel frontend (`https://medinex-bd.vercel.app/`) connectivity to hosted backend | **`FAIL`** *(Current Cloud State)* | Vercel homepage returns `200`, but no hosted backend URL is currently configured in Vercel project environment variables |
| Provision Neon Serverless PostgreSQL (`aws-ap-southeast-1`, SSL, pooled + direct URLs) | **`BLOCKED`** | Awaits cloud account access & operator provisioning |
| Provision Railway Hobby Backend + Persistent Volume at `/app/uploads` (single replica) | **`BLOCKED`** | Awaits Railway account / billing authorization (`~$5–$12/mo`) |
| Configure transactional SMTP relay (`MAIL_HOST`, `MAIL_USERNAME`, `MAIL_PASSWORD`, verified sender) | **`BLOCKED`** | Awaits SMTP credentials / sending domain DNS verification |
| Update Vercel environment variables (`NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_APP_URL`) & redeploy | **`BLOCKED`** | Awaits hosted backend URL & Vercel deployment authorization |
| Remote cloud smoke tests (TLS, CORS from `medinex-bd.vercel.app`, SMTP OTP delivery, avatar persistence across restart) | **`NOT TESTED`** | Execute immediately post-cutover using Runbook Section 5 |
| Avatar local filesystem scaling limit (`1` backend replica only) | **`WARNING`** | Volume-backed `/app/uploads` works cleanly on 1 instance; migrate to S3/R2 before horizontal scaling |
| Auth JWT storage (`ISSUE-009`: `localStorage` Bearer tokens vs `HttpOnly` cookie session) | **`WARNING`** | Mitigated partially by strong CSP headers; `HttpOnly` cookie refactor queued for post-launch hardening |

---

## 3. Required Operator Approvals & Actions Before Production Launch

1. **Hosting & Billing Approval:** Approve target provider plan — Recommended **Railway Hobby (`$5/mo` minimum + Persistent Volume) + Neon Serverless Postgres (`Free $0` starter -> `Launch` PITR)**, or fixed-price **Render Starter (`$7/mo` + Disk)**.
2. **Database Launch Mode Decision:** Confirm whether production Neon Postgres starts cleanly via Flyway `V1`–`V6` + fresh `SUPER_ADMIN` (`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`), or requires sanitized data migration from local `19`-user snapshot.
3. **Transactional Email Provider & Domain Verification:** Authorize SMTP service (Resend / Brevo / Mailgun / Gmail App Password) and authorize sender domain DNS (SPF/DKIM) for reliable OTP & password reset delivery.
4. **Secret Provisioning & Vercel Cutover:** Authorize setting `JWT_SECRET_KEY`, `SPRING_DATASOURCE_*`, `MAIL_PASSWORD`, `SEED_ADMIN_PASSWORD` in backend secret store, and `NEXT_PUBLIC_API_BASE_URL` in Vercel Production env vars, followed by Vercel production redeploy.
5. **Security Sign-Off on Known Warning:** Acknowledge initial launch uses stateless Bearer JWT in `localStorage` (`ISSUE-009`) and `1`-replica POSIX `/app/uploads` volume storage until post-launch S3/R2 + cookie upgrades.

---

## 4. Final Decision Matrix (Separated by Readiness Dimension)

| Readiness Dimension | Final Classification | Summary |
| :--- | :--- | :--- |
| **1. SOURCE CODE READINESS** | **`READY FOR STAGING DEPLOYMENT`** | All backend (`64/64`) and frontend (`12/12`, `37/37` routes, lint, TS) checks pass cleanly |
| **2. BACKEND READINESS** | **`READY AFTER CONFIGURATION`** | `prod` profile, single-port container/Actuator setup, and fail-fast secret checks verified; awaiting cloud host & secrets |
| **3. DATABASE READINESS** | **`READY AFTER CONFIGURATION`** | Flyway `V1`–`V6`, Neon `-pooler`/direct URL support, SSL enforcement, and backup scripts ready; awaiting managed Postgres provisioning |
| **4. FRONTEND INTEGRATION READINESS** | **`READY AFTER CONFIGURATION`** | Build-time HTTPS/CSP enforcement works (`VERCEL=1` guard tested); awaiting `NEXT_PUBLIC_API_BASE_URL` in Vercel & redeploy |
| **5. CLOUD INFRASTRUCTURE READINESS** | **`BLOCKED — CLOUD ACCOUNT OR AUTHORIZATION REQUIRED`** | No cloud accounts provisioned or billing/DNS actions authorized in Phase 12 |
| **6. PRODUCTION DEPLOYMENT READINESS** | **`READY AFTER CONFIGURATION`** *(Externally **`BLOCKED`** pending Step 3 approvals & cutover)* | Codebase & Docker artifacts are deployment-ready; live traffic cutover awaits external cloud provisioning, secrets, and Vercel redeploy |
