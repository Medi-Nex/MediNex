# MEDINEX — STAGING VERIFICATION & PROMOTION CHECKLIST

**Platform:** MediNex — *"Healthcare Innovation. Connected Communities."*  
**Verified Release Commit:** `142aa7b` (`fix(release): resolve schema drift, project/team authorization, role names, and context path`)  
**Target Phase:** Staging Readiness Gate  
**Last Updated:** November 11, 2026  

---

## GATE 1: MANDATORY REMEDIATION BEFORE STAGING DEPLOYMENT

- [x] **BLK-01 / ISSUE-001 (P0):** Added forward-only migration `V3__align_collection_tables.sql` (renaming `project_tech_stack.tech` -> `technology` and creating `user_profile_skills` / `user_profile_responsibilities` with `TEXT[]` backfill) and `V4__align_role_names.sql` (`roles.name = roles.id`); `hibernate.ddl-auto: validate` passes on live PostgreSQL.
- [x] **SEC-01 / ISSUE-002 (P1):** Restricted `/api/v1/projects/**` public access to `HttpMethod.GET`, added `SUPER_ADMIN`/`ADMIN` checks in `SecurityConfig` and `@PreAuthorize` on `ProjectController.updateProject`, plus `AccessDeniedException` (403) & `AuthenticationException` (401) handlers in `GlobalExceptionHandler`.
- [x] **SEC-02 / ISSUE-003 (P1):** Restricted `/api/v1/team/members/**` mutations in `SecurityConfig` and added `@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")` on `TeamController.updateMember`.
- [x] **Live Route Path Alignment:** Fixed `SERVER_SERVLET_CONTEXT_PATH` default from `/api/v1` to `/` in `application.yml` and `.env.example` so controllers serve cleanly under `/api/v1/...` in Tomcat.

---

## GATE 2: BUILD & CI QUALITY ASSURANCE

- [x] **Frontend Automated Tests (`npm test`):** 5/5 passing (`node --test src/__tests__/*.test.mjs`, `109.2562ms`).
- [x] **Frontend ESLint (`npx eslint src/`):** 0 errors, 0 warnings (`npm run lint` still uses deprecated `next lint` — tracked in `ISSUE-007`).
- [x] **TypeScript Strict Mode (`npx tsc --noEmit`):** 0 errors.
- [x] **Next.js Production Build (`npm run build`):** Next.js 16.4.6 (Turbopack), 37/37 routes built cleanly.
- [x] **Backend Regression Suite (`mvn test -f backend/pom.xml`):** 43/43 tests passing across all 9 test classes (`BUILD SUCCESS`, `48.631 s`), including 6 new authorization tests in `ProjectControllerTest` and `TeamControllerTest`.
- [x] **Docker Stack Full Boot (`docker compose up -d`):** All 4 active services (`medinex-postgres`, `medinex-backend`, `medinex-frontend`, `medinex-mailpit`) report `(healthy)`.

---

## GATE 3: STAGING ENVIRONMENT PROVISIONING (HOST CUTOVER ACTIONS)

- [ ] Provision staging `.env` with unique, newly generated 512-bit `JWT_SECRET_KEY`.
- [ ] Override default `POSTGRES_PASSWORD` and `SEED_ADMIN_PASSWORD`.
- [ ] Configure `CORS_ALLOWED_ORIGINS` strictly to the staging frontend HTTPS URL.
- [ ] Wire `spring.mail.*` in `application.yml` (or env vars `SPRING_MAIL_HOST` / `SPRING_MAIL_PORT`) if real SMTP / Mailpit delivery verification is required in staging (`ISSUE-012`).
- [ ] Confirm TLS 1.3 certificate validity on reverse proxy (`https://staging.medinex.health`).
- [ ] Verify firewall rules block direct external access to PostgreSQL (`5432/5434`), Mailpit (`8026`), and Spring Actuator (`8081/8083`).

---

## GATE 4: LIVE SMOKE & PERSISTENCE VERIFICATION EVIDENCE (COMMIT `142aa7b`)

### A. Infrastructure & Persistence
- [x] `docker ps --filter "name=medinex"` reported `(healthy)` for `medinex-postgres`, `medinex-backend` (`/actuator/health` -> `{"status":"UP"}`), `medinex-frontend` (`HTTP/1.1 200 OK`), and `medinex-mailpit` (`/api/v1/messages` -> `200`).
- [x] `flyway_schema_history` verified `success = t` for ranks 1–4 (`V1`, `V2`, `V3`, `V4`).
- [x] **Persistence Test Passed:** Registered `smoke_1794355075`, created post `381f4e30-c390-4c4a-9f89-86da976a3720`, liked & commented, ran `docker compose restart postgres backend`, waited for `(healthy)`, and verified HTTP `200` on `GET /api/v1/community/posts/381f4e30-c390-4c4a-9f89-86da976a3720` (`likesCount: 1`, `commentsCount: 1`) plus `users_cnt = 9` / `posts_cnt = 2` in PostgreSQL.

### B. Security & Authorization Smoke Tests
- [x] Security response headers verified via `curl.exe -sI http://localhost:3002`: `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`.
- [x] Anonymous `PUT /api/v1/projects/shasthosetu` -> **HTTP 401**.
- [x] Anonymous `PUT /api/v1/team/members/contributor-01` -> **HTTP 401**.
- [x] Anonymous `GET /api/v1/admin/stats` -> **HTTP 401**.
- [x] Authenticated `ROLE_USER` `PUT /api/v1/projects/shasthosetu` -> **HTTP 403**.
- [x] Authenticated `ROLE_USER` `PUT /api/v1/team/members/contributor-01` -> **HTTP 403**.
- [x] Authenticated `ROLE_USER` `GET /api/v1/admin/stats` -> **HTTP 403**.
- [x] `POST /api/v1/community/posts` with `"Patient MRN: 99887766 diagnosed yesterday"` -> **HTTP 400** (`Zero-PHI Policy Violation`).

### C. Core Workflows & Admin Mutations
- [x] Registration (`POST /api/v1/auth/register` -> `201`), login (`200`), `/auth/me` (`200`), token rotation (`POST /api/v1/auth/refresh` -> `200`), logout (`200`), revoked token rejection (`401`). *(Email delivery simulated by `EmailService` log fallback in container; end-to-end SMTP verification pending `ISSUE-012`.)*
- [x] Public read routes verified on both API (`GET /projects/shasthosetu`, `GET /team/members` = 6, `GET /community/feed`) and Next.js SSR (`/` `/team` `/projects/shasthosetu` `/community` `/login` `/admin` -> HTTP `200`).
- [x] Team follow (`POST /api/v1/team/follow` -> `200`), post creation (`200`), like (`200`), comment (`200`).
- [x] Admin login (`admin@medinex.health`), `GET /api/v1/admin/stats` (`200`), `PUT /api/v1/projects/shasthosetu` (`200` + restored), `PUT /api/v1/team/members/contributor-06` (`200` + restored).

### D. Disaster Recovery Verification (Staging Server Cutover)
- [ ] Run `./infrastructure/scripts/backup.sh` (or `backup.ps1`) on target staging host upon deployment to verify `.dump` + `.sha256` generation against live staging volume.

---

## RELEASE MANAGER SIGN-OFF

| Role | Name / Placeholder | Gate Verification Date | Sign-off Status |
| :--- | :--- | :--- | :--- |
| **Senior Software Architect** | *MediNex Audit Authority* | November 11, 2026 | Verified (`142aa7b`) |
| **DevSecOps & Security Lead** | *MediNex Audit Authority* | November 11, 2026 | Verified (`142aa7b`) |
| **QA Lead** | *MediNex Audit Authority* | November 11, 2026 | Verified (`43/43` BE, `5/5` FE, Live Docker Smoke PASS) |
| **Release Manager** | *MediNex Audit Authority* | November 11, 2026 | **APPROVED — READY FOR STAGING** |
