# MEDINEX — KNOWN ISSUES & TECHNICAL DEBT REGISTER

**Project:** MediNex — *"Healthcare Innovation. Connected Communities."*  
**Baseline Audited Commit:** `0074b01`  
**Remediation Commit:** `142aa7b` (`fix(release): resolve schema drift, project/team authorization, role names, and context path`)  
**Audit Date:** November 11, 2026  
**Maintained By:** QA Lead, DevSecOps & Release Manager  

---

## SUMMARY BY SEVERITY

| Severity | Open | Resolved (`142aa7b`) | Notes |
| :--- | :---: | :---: | :--- |
| **P0 — Blocker** | **0** | **1** | `ISSUE-001` resolved via forward-only Flyway migration `V3` (plus `V4` & root context path alignment discovered during live Docker testing). |
| **P1 — Critical / High** | **0** | **2** | `ISSUE-002` and `ISSUE-003` resolved via RBAC enforcement, `GlobalExceptionHandler`, and live/unit regression suites. |
| **P2 — Medium** | **5** | **0** | Non-blocking operational/SMTP/feed/moderation/tooling items tracked below (`ISSUE-004`–`ISSUE-007`, `ISSUE-012`). |
| **P3 — Low / Debt** | **4** | **0** | Production hardening & build-context optimizations (`ISSUE-008`–`ISSUE-011`). |

---

## RESOLVED P0 & P1 RELEASE BLOCKERS (COMMIT `142aa7b`)

### ISSUE-001 [RESOLVED — P0]: Hibernate Schema Validation vs. Flyway PostgreSQL Drift
- **Status:** **RESOLVED & VERIFIED IN DOCKER** (Commit `142aa7b`)
- **Affected Files:**
  - [`backend/src/main/resources/db/migration/V3__align_collection_tables.sql`](file:///e:/Project/MediNex/backend/src/main/resources/db/migration/V3__align_collection_tables.sql)
  - [`backend/src/main/resources/db/migration/V4__align_role_names.sql`](file:///e:/Project/MediNex/backend/src/main/resources/db/migration/V4__align_role_names.sql)
  - [`backend/src/main/resources/application.yml`](file:///e:/Project/MediNex/backend/src/main/resources/application.yml#L1-L5)
  - [`.env.example`](file:///e:/Project/MediNex/.env.example#L18)
- **Root Cause:**
  1. `Project.java` maps `techStack` with `@Column(name = "technology")`, whereas `V1__init_schema.sql` created `project_tech_stack` with column `tech`.
  2. `UserProfile.java` maps `skills` and `responsibilities` via `@CollectionTable` (`user_profile_skills`, `user_profile_responsibilities`), whereas `V1__init_schema.sql` defined `TEXT[]` columns on `user_profiles`. H2 tests (`flyway.enabled: false`, `ddl-auto: create-drop`) masked the discrepancy.
  3. **Live Docker Discoveries Fixed Alongside Schema Alignment:**
     - `V1__init_schema.sql` seeded `roles.name` as display strings (`Super Administrator`, `Administrator`, `Moderator`, `Community User`) rather than `ROLE_*` authorities expected by `UserPrincipal`, `@PreAuthorize`, `AdminService`, and the frontend — fixed via forward-only migration `V4__align_role_names.sql`.
     - `application.yml` defaulted `server.servlet.context-path` to `/api/v1` while controllers use `@RequestMapping("/api/v1/...")`, causing Tomcat in Docker to serve routes under `/api/v1/api/v1/...` (masked by MockMvc) — fixed to `/` in `application.yml` and `.env.example`.
- **Verification Evidence:**
  - `flyway_schema_history`: Ranks `1` (`V1`), `2` (`V2`), `3` (`V3`), `4` (`V4`) all `success = t`.
  - `hibernate.ddl-auto: validate` remains enabled and passes on live PostgreSQL startup (`medinex-backend` status `healthy`, `/actuator/health` -> `{"status":"UP"}`).

### ISSUE-002 [RESOLVED — P1]: Unauthenticated Official Project Modification Vulnerability
- **Status:** **RESOLVED & VERIFIED** (Commit `142aa7b`)
- **Affected Files:**
  - [`backend/src/main/java/com/medinex/config/SecurityConfig.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/config/SecurityConfig.java#L85-L86)
  - [`backend/src/main/java/com/medinex/project/controller/ProjectController.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/project/controller/ProjectController.java#L45-L63)
  - [`backend/src/main/java/com/medinex/common/exception/GlobalExceptionHandler.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/common/exception/GlobalExceptionHandler.java#L26-L38)
- **Fix Applied:** Restricted `/api/v1/projects/**` `permitAll()` to `HttpMethod.GET`, required `SUPER_ADMIN`/`ADMIN` on mutations in `SecurityConfig`, added `@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")` to `ProjectController.updateProject`, and added `AccessDeniedException` (`403`) and `AuthenticationException` (`401`) handlers to `GlobalExceptionHandler`.
- **Verification Evidence:**
  - Unit/Integration (`ProjectControllerTest`, `4/4` passing): `shouldRejectAnonymousProjectMutationWith401`, `shouldRejectOrdinaryUserProjectMutationWith403`, `shouldAllowAdminToUpdateProject`.
  - Live Docker HTTP: Anon `PUT /api/v1/projects/shasthosetu` -> `401`; `ROLE_USER` `PUT` -> `403`; `SUPER_ADMIN` `PUT` -> `200`.

### ISSUE-003 [RESOLVED — P1]: Contributor Profile IDOR on `PUT /api/v1/team/members/{username}`
- **Status:** **RESOLVED & VERIFIED** (Commit `142aa7b`)
- **Affected Files:**
  - [`backend/src/main/java/com/medinex/config/SecurityConfig.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/config/SecurityConfig.java#L90-L91)
  - [`backend/src/main/java/com/medinex/team/controller/TeamController.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/team/controller/TeamController.java#L48-L81)
- **Fix Applied:** Restricted `GET /api/v1/team/**` to public reads, restricted `/api/v1/team/members/**` writes to `SUPER_ADMIN`/`ADMIN` in `SecurityConfig`, and annotated `TeamController.updateMember` with `@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")`.
- **Verification Evidence:**
  - Unit/Integration (`TeamControllerTest`, `6/6` passing): `shouldRejectAnonymousContributorUpdateWith401`, `shouldRejectOrdinaryUserContributorIdorWith403`, `shouldAllowAdminToUpdateContributorProfile`.
  - Live Docker HTTP: Anon `PUT /api/v1/team/members/contributor-01` -> `401`; `ROLE_USER` `PUT` -> `403`; `SUPER_ADMIN` `PUT /team/members/contributor-06` -> `200`.

---

## OPEN P2 — MEDIUM DEFECTS & OPERATIONAL DEBT (NON-BLOCKING FOR STAGING)

### ISSUE-004: Mutual Block Exclusion Incomplete in Community Main Feed
- **Severity:** **P2 — MEDIUM**
- **Affected Files:** [`backend/src/main/java/com/medinex/community/service/CommunityService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/community/service/CommunityService.java)
- **Root Cause:** `getCommunityFeed` initializes `blockedAuthorIds` as an empty `HashSet<>()` instead of querying `BlockRepository` for mutual block IDs (profile post tabs do check mutual blocks).
- **Recommended Fix:** Populate mutually blocked user IDs from `BlockRepository` in `getCommunityFeed` and `getPostById` before production launch.

### ISSUE-005: Platform Site Settings Stored In-Memory (`AtomicReference`)
- **Severity:** **P2 — MEDIUM**
- **Affected Files:** [`backend/src/main/java/com/medinex/admin/service/AdminService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/admin/service/AdminService.java)
- **Root Cause:** `settingsHolder` stores `AdminSettingsDto` in JVM memory rather than PostgreSQL.
- **Recommended Fix:** Add a `site_settings` table via Flyway migration and persist updates in PostgreSQL.

### ISSUE-006: `ROLE_MODERATOR` Lacks Access to Moderation Endpoints
- **Severity:** **P2 — MEDIUM**
- **Affected Files:** [`SecurityConfig.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/config/SecurityConfig.java#L98), [`AdminController.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/admin/controller/AdminController.java#L30)
- **Root Cause:** `/api/v1/admin/**` restricts all routes strictly to `SUPER_ADMIN` and `ADMIN`.
- **Recommended Fix:** Permit `MODERATOR` on `/api/v1/admin/reports/**`, `/api/v1/admin/posts/**`, and `/api/v1/admin/comments/**`.

### ISSUE-007: `npm run lint` Script Compatibility with Next.js 16.4.6
- **Severity:** **P2 — MEDIUM (Tooling)**
- **Affected Files:** [`frontend/package.json`](file:///e:/Project/MediNex/frontend/package.json#L9)
- **Evidence:** `npm run lint` invokes `next lint`, which Next.js 16 treats as a directory path (`frontend\lint`), whereas `npx eslint src/` exits 0 cleanly.
- **Recommended Fix:** Change `"lint": "next lint"` to `"lint": "eslint src/"` in `frontend/package.json`.

### ISSUE-012: `EmailService` SMTP Transport Property Binding Missing for Live Mailpit/SMTP
- **Severity:** **P2 — MEDIUM**
- **Affected Files:** [`backend/src/main/resources/application.yml`](file:///e:/Project/MediNex/backend/src/main/resources/application.yml), [`EmailService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/common/email/EmailService.java)
- **Root Cause:** `compose.yaml` injects `MAIL_HOST` / `MAIL_PORT`, while `application.yml` does not map `spring.mail.host: ${MAIL_HOST:...}` / `spring.mail.port: ${MAIL_PORT:...}`. Consequently, Spring Boot does not instantiate `JavaMailSender` in Docker and `EmailService` falls back cleanly to simulated console logging (`Mailpit` stays healthy, but does not receive SMTP messages).
- **Recommended Fix:** Add `spring.mail.*` mappings bound to `${MAIL_HOST}` / `${MAIL_PORT}` before enabling live email verification workflows in staging/production.

---

## OPEN P3 — LOW ISSUES & HARDENING RECOMMENDATIONS

### ISSUE-008: Missing `frontend/.dockerignore` Increases Build Context Size
- **Severity:** **P3 — LOW**
- **Root Cause:** `compose.yaml` builds `./frontend`, while `.dockerignore` only resides at the repository root, increasing Docker build context transfer size.
- **Recommended Fix:** Copy `.dockerignore` into `frontend/.dockerignore` and `backend/.dockerignore`.

### ISSUE-009: Auth Rate Limiting & Token Cookie Hardening
- **Severity:** **P3 — LOW**
- **Root Cause:** JWT tokens are currently stored in browser `localStorage`, and no application-layer rate-limiting filter (`Bucket4j` / Redis throttling) is active on `/api/v1/auth/login` or `/forgot-password`.
- **Recommended Fix:** Add `HttpOnly` refresh cookies and reverse-proxy / Bucket4j throttling before public launch.

### ISSUE-010: Contributor Seed Accounts Defaulting to `ROLE_ADMIN`
- **Severity:** **P3 — LOW**
- **Affected Files:** [`backend/src/main/java/com/medinex/config/DataInitializer.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/config/DataInitializer.java#L171-L181)
- **Root Cause:** Seeded placeholder contributors receive `ROLE_ADMIN` in addition to `ROLE_USER`.
- **Recommended Fix:** Restrict non-administrator contributor accounts to `ROLE_USER` (and `ROLE_MODERATOR` if needed) in production.

### ISSUE-011: Binary Media Upload Endpoint & Local Crash Log Artifact
- **Severity:** **P3 — LOW**
- **Root Cause:** Media attachments use URL references rather than multipart MinIO upload streaming; `hs_err_pid27608.log` (git-ignored) exists in the local workspace root and can be deleted locally.
