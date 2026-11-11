# MediNex — Phase 11 Deployment Checklist

**Baseline Commit:** `3124222` (`main`)  
**Companion Report:** [MEDINEX_PHASE11_DEPLOYMENT_VERIFICATION_REPORT.md](file:///e:/Project/MediNex/MEDINEX_PHASE11_DEPLOYMENT_VERIFICATION_REPORT.md)  
**Readiness Status:** `NOT READY FOR PRODUCTION`  

---

## 1. Completed Tasks (Verified in Phase 11)

- [x] Verified Git repository clean on `main` (`3124222`), synced with `origin/main` (`https://github.com/Medi-Nex/MediNex.git`).
- [x] Audited `.gitignore`, `.dockerignore`, `frontend/.dockerignore`, `.env`, `.env.example`, `compose.yaml`, and `frontend/.env.local` (all secrets excluded from Git and Docker images).
- [x] Executed fresh frontend verification in `e:/Project/MediNex/frontend`:
  - `npm run lint` (`eslint src/` -> exit `0`)
  - `npx tsc --noEmit` (exit `0`)
  - `npm test` (`7/7` passed in `124.78ms`)
  - `npm run build` (`Next.js 16.4.6` Turbopack, `37/37` routes built, exit `0`)
- [x] Executed fresh backend Maven test suite in `e:/Project/MediNex/backend`:
  - `mvn test` on `Java 21.0.9` (`60/60` tests passed across `12` test classes, `0` failures, `0` skipped)
- [x] Verified local Docker stack health (`medinex-frontend`, `medinex-backend`, `medinex-postgres`, `medinex-mailpit`) and named volumes (`medinex_pgdata`, `medinex_uploads`).
- [x] Verified PostgreSQL `medinex_db` preservation (`19` users intact before & after all checks, Flyway migrations `1`–`6` succeeded, contributor roles restricted to `ROLE_USER`).
- [x] Verified local stack Playwright E2E checks:
  - `npm run test:e2e:live` (`4/4` passed in `9.7s`)
  - 14-route Chromium audit at Desktop (`1280x720`) and Mobile (`390x844`) viewports (`0px` overflow, live avatar & community feed rendering verified)
- [x] Verified live Vercel deployment (`https://medinex-bd.vercel.app/`): confirmed commit `3124222` deployed (`sitemap.xml` `lastmod=2026-11-11T05:35:11.534Z`), security headers (`CSP`, `HSTS`, `X-Frame-Options: DENY`), and isolated exact production API blocker (`http://localhost:8080/api/v1` loopback failure).
- [x] Inspected `hs_err_pid27608.log` (`70,721` bytes, OpenJDK `25.0.4.1+1` native malloc OOM) and confirmed zero secrets present.

---

## 2. Blocked Tasks (Infrastructure Access or Owner Authorization Required)

- [ ] **Deploy Hosted Spring Boot Backend & Production PostgreSQL Database**  
  *Blocker:* No public cloud host/URL is currently provisioned for the backend API (`https://medinex-bd.vercel.app/` still calls `http://localhost:8080/api/v1`).
- [ ] **Configure Vercel Environment Variables & Trigger Production Rebuild**  
  *Blocker:* Requires Vercel project access to set `NEXT_PUBLIC_API_BASE_URL` (and `NEXT_PUBLIC_APP_TAGLINE`) to the hosted HTTPS backend URL, followed by a production redeploy so client bundles drop the `http://localhost:8080/api/v1` fallback.
- [ ] **Reconcile Legacy Seeded Project & Team Rows in `medinex_db`**  
  *Blocker:* Preserved untouched per strict DB protection rules; requires explicit owner authorization (and real contributor onboarding mapping before clearing `is_placeholder` / setting `is_verified_contributor = true`).
- [ ] **Delete Diagnostic Crash Log (`hs_err_pid27608.log`)**  
  *Blocker:* Preserved intentionally until owner approves removal.

---

## 3. Pending Remediation Tasks (Prioritized)

### Priority 1 — Critical Production Blockers
- [ ] **Fix [`AdminProjectsPage`](file:///e:/Project/MediNex/frontend/src/app/(admin)/admin/projects/page.tsx) `techStack` Serialization Bug:** Convert `techStack` in the frontend admin modal from `string` to `string[]` (comma-split on submit / array join on edit) to match [`ProjectDto.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/project/dto/ProjectDto.java).
- [ ] **Provision Hosted Backend + PostgreSQL + Persistent Avatar Volume (`/uploads`):** Deploy the backend cleanly over HTTPS and set Vercel `NEXT_PUBLIC_API_BASE_URL=https://<api-domain>/api/v1`.
- [ ] **Update Production `CORS_ALLOWED_ORIGINS` & Frontend CSP (`next.config.ts`):** Add `https://medinex-bd.vercel.app` (and custom domain if added) to backend `CORS_ALLOWED_ORIGINS`, and tighten `next.config.ts` production CSP so `localhost:8080/8082` origins are not embedded in production headers when `NODE_ENV === "production"`.

### Priority 2 — Data & Routing Consistency
- [ ] **Reconcile `projects.shasthosetu` & `teams` DB Records (After Backup + Approval):** Replace legacy `"tele-consultation"` / `"doctor consultation routing"` text and add `"HL7 FHIR (Research)"` in `project_tech_stack`.
- [ ] **Align `team_members` DB Rows & Remove Broken `/team/contributor-04` Avatar Reference:** Either onboard real accounts (`hasnat`, `jihadjp`, `tarek`, `shopnil`, `nabil`, `puja`) or ensure `/team/contributor-*` fallback routes do not reference missing `/images/team/contributor-04.jpg` (`404 Not Found`) or `"Telemedicine & Mobile Integration Lead"`.
- [ ] **Fix Root Canonical Inheritance in [`layout.tsx`](file:///e:/Project/MediNex/frontend/src/app/layout.tsx#L60-L62):** Replace inherited root `alternates: { canonical: "/" }` (or add per-route `alternates.canonical` on `/about`, `/updates`, `/events`, `/privacy`, `/terms`, `/login`, `/users/[username]`).
- [ ] **Standardize Config & Build Args:** Align `NEXT_PUBLIC_APP_TAGLINE` across `.env`, `.env.example`, `compose.yaml`, and [`frontend/Dockerfile`](file:///e:/Project/MediNex/frontend/Dockerfile#L29), harmonize `MANAGEMENT_SERVER_PORT` (`8081` vs `8083`), and reconcile `SEED_ADMIN_EMAIL` (`.env` `admin@medinex.bd` vs `.env.example` & DB `admin@medinex.health`).

### Priority 3 — Security & Reliability Hardening
- [ ] **Disable or Protect Swagger / OpenAPI in Production:** Restrict `/v3/api-docs/**` and `/swagger-ui/**` behind admin auth or a `springdoc.api-docs.enabled=false` production profile flag (`SecurityConfig.java`).
- [ ] **Add HTTP Rate Limiting on Auth Endpoints:** Protect `/api/v1/auth/login`, `/register`, and `/forgot-password` against brute-force/abuse.
- [ ] **Migrate Auth Storage from `localStorage` to `HttpOnly` Cookies (`ISSUE-009`):** Eliminate XSS token exfiltration risk.
- [ ] **Persist Admin Platform Settings (`ISSUE-005`) & Fix 405 Method Handler:** Persist `AdminSettingsDto` in PostgreSQL rather than `AtomicReference`, and return HTTP `405` instead of `500` on `HttpRequestMethodNotSupportedException`.

---

## 4. Required Owner Approvals

Before executing state-changing steps, obtain explicit approval for each item:

1. **Database Reconciliation Approval:** Authorize updating `projects` (`slug='shasthosetu'`) and `teams` (`MediNex Official Team`) in `medinex_db` after taking a verified `pg_dump` backup in `backups/`.
2. **Contributor Identity Mapping Approval:** Confirm exact real email/account usernames for the 6 squad members (`hasnat`, `jihadjp`, `tarek`, `shopnil`, `nabil`, `puja`) vs `contributor-01`..`06` before invoking `TeamController.updateMember` (which sets `is_placeholder = false` and `is_verified_contributor = true`) or cleaning placeholder rows.
3. **Environment & Hosting Access:** Authorize setting `NEXT_PUBLIC_API_BASE_URL`, `CORS_ALLOWED_ORIGINS`, SMTP, and `JWT_SECRET` in Vercel and the production backend host.
4. **Workspace Cleanup Approval:** Approve deleting `e:/Project/MediNex/hs_err_pid27608.log` (`70,721` bytes) after reviewing crash details.

---

## 5. Safe Deployment & Reconciliation Instructions

> **Rule:** Never run `docker compose down -v`, `DROP`, `TRUNCATE`, or `git reset --hard` during deployment or reconciliation.

### Step A — Create Verified PostgreSQL Backup First
```powershell
New-Item -ItemType Directory -Force -Path e:\Project\MediNex\backups | Out-Null
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
docker exec medinex-postgres pg_dump -U medinex_user -d medinex_db -F c -f "/tmp/medinex_pre_reconcile_$ts.dump"
docker cp "medinex-postgres:/tmp/medinex_pre_reconcile_$ts.dump" "e:\Project\MediNex\backups\medinex_pre_reconcile_$ts.dump"
```

### Step B — Safe Project Content Reconciliation (Only After Owner Approval)
- **Important:** Do **NOT** use the `/admin/projects` UI edit modal until the `techStack` `string` vs `string[]` bug in `frontend/src/app/(admin)/admin/projects/page.tsx` is fixed and redeployed.
- Instead, authenticate as `medinex-admin` and invoke `PUT /api/v1/projects/shasthosetu` with a JSON array for `techStack` matching `SHASTHOSETU_PROJECT` in `frontend/src/lib/team-data.ts`:
  - `shortSummary`: `"An interoperable digital health record and exchange platform prototype exploring standardized health data structures, HL7 FHIR alignment, and consent-aware health record interoperability."`
  - `proposedSolution`: `"ShasthoSetu is a featured healthcare technology initiative under MediNex exploring standards-oriented digital health record management and interoperable health data exchange. Its research and prototype architecture investigate HL7 FHIR resource alignment, patient identity mapping concepts, explicit consent workflows, role-based access control (RBAC), secure API communication, access audit logs, and optional QR-based patient identity lookup—while enforcing strict Zero-PHI separation from the public MediNex community."`
  - `techStack`: `["Next.js App Router", "Java 21 Spring Boot", "PostgreSQL", "HL7 FHIR (Research)", "Docker"]`

### Step C — Rebuild Local Containers Cleanly (Zero Volume Loss)
After updating `.env`, `compose.yaml`, and `frontend/Dockerfile` (`NEXT_PUBLIC_APP_TAGLINE`):
```powershell
Set-Location e:\Project\MediNex
docker compose up -d --build frontend backend
```

### Step D — Production Rollout & Verification Sequence
1. Provision hosted PostgreSQL + Java 21 Spring Boot backend with strong generated secrets, persistent `/uploads` storage, and `CORS_ALLOWED_ORIGINS=https://medinex-bd.vercel.app`.
2. Verify hosted backend Actuator (`/actuator/health`) and `GET /api/v1/projects/shasthosetu` return HTTP `200` and clean non-telemedicine copy.
3. Set `NEXT_PUBLIC_API_BASE_URL=https://<api-domain>/api/v1` and `NEXT_PUBLIC_APP_TAGLINE` in Vercel Project Settings, then redeploy `main`.
4. Re-run Phase 11 verification checks against `https://medinex-bd.vercel.app/`:
   - Zero browser console CORS / `ERR_FAILED` errors on `/team`, `/users/[username]`, `/community`, and `/login`
   - Self-canonical URLs on all public routes
   - End-to-end login -> profile load -> feed render -> logout check (non-destructive)
   - Verify DB `users` row count before and after to confirm zero unexpected data modification.
