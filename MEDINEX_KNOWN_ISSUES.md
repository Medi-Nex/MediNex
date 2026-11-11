# MEDINEX — KNOWN ISSUES & TECHNICAL DEBT REGISTER

**Project:** MediNex — *"Connecting Technology, Research & Healthcare Innovation."*  
**Baseline Audited Commit:** `0074b01`  
**Remediation Commit:** `142aa7b` (`fix(release): resolve schema drift, project/team authorization, role names, and context path`)  
**Audit Date:** November 11, 2026  
**Maintained By:** QA Lead, DevSecOps & Release Manager  

---

## SUMMARY BY SEVERITY

| Severity | Open | Resolved (`142aa7b` + Phase 9) | Notes |
| :--- | :---: | :---: | :--- |
| **P0 — Blocker** | **0** | **1** | `ISSUE-001` resolved via forward-only Flyway migration `V3` (plus `V4` & root context path alignment discovered during live Docker testing). |
| **P1 — Critical / High** | **0** | **2** | `ISSUE-002` and `ISSUE-003` resolved via RBAC enforcement, `GlobalExceptionHandler`, and live/unit regression suites. |
| **P2 — Medium** | **1** | **4** | `ISSUE-004`, `ISSUE-006`, `ISSUE-007`, and `ISSUE-012` (local Mailpit wire dispatch) resolved in Phase 9; `ISSUE-005` (`settingsHolder` DB persistence) remains open. |
| **P3 — Low / Debt** | **3** | **1** | `ISSUE-010` resolved via `DataInitializer` + `V6__restrict_contributor_roles.sql`; `ISSUE-008`, `ISSUE-009`, `ISSUE-011` tracked below. |

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

## P2 DEFECTS & OPERATIONAL ITEMS (UPDATED PHASE 9)

### ISSUE-004 [RESOLVED — P2]: Mutual Block & Private Profile Exclusion in Community Main Feed
- **Status:** **RESOLVED & VERIFIED** (Phase 9)
- **Affected Files:** [`PostRepository.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/community/repository/PostRepository.java), [`CommunityService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/community/service/CommunityService.java), [`ProfileAccessGuard.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/user/service/ProfileAccessGuard.java)
- **Resolution:** Upgraded `PostRepository.findFeedPosts` JPQL query and `CommunityService` / `FollowService` / `UserService` with centralized `ProfileAccessGuard` rules excluding mutually blocked accounts and restricting `isPublicVisible = false` authors to owners and accepted followers.

### ISSUE-005 [OPEN — P2]: Platform Site Settings Stored In-Memory (`AtomicReference`)
- **Severity:** **P2 — MEDIUM**
- **Affected Files:** [`backend/src/main/java/com/medinex/admin/service/AdminService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/admin/service/AdminService.java)
- **Root Cause:** `settingsHolder` stores `AdminSettingsDto` in JVM memory rather than PostgreSQL.
- **Recommended Fix:** Add a `site_settings` table via Flyway migration and persist updates in PostgreSQL.

### ISSUE-006 [RESOLVED — P2]: `ROLE_MODERATOR` Access & Boundary Enforcement
- **Status:** **RESOLVED & VERIFIED** (Phase 9)
- **Affected Files:** [`SecurityConfig.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/config/SecurityConfig.java), [`AdminController.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/admin/controller/AdminController.java), [`AdminService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/admin/service/AdminService.java)
- **Resolution:** Permitted `ROLE_MODERATOR` on `/api/v1/admin/reports/**`, `/api/v1/admin/posts/**`, `/api/v1/admin/comments/**`, and `/api/v1/admin/media/**`, while denying `/stats`, `/users/**`, `/audit-logs`, `/analytics`, `/settings`, `/team`, and `SUSPEND_USER` report actions with HTTP `403`.

### ISSUE-007 [RESOLVED — P2]: `npm run lint` Script Compatibility with Next.js 16.4.6
- **Status:** **RESOLVED & VERIFIED** (Phase 9)
- **Affected Files:** [`frontend/package.json`](file:///e:/Project/MediNex/frontend/package.json#L9)
- **Resolution:** Updated `"lint": "next lint"` to `"lint": "eslint src/"`; verified clean execution (`0` errors, `0` warnings).

### ISSUE-012 [RESOLVED (MAILPIT) — P2]: `EmailService` SMTP Property Binding & Delivery Error Handling
- **Status:** **RESOLVED FOR MAILPIT WIRE DELIVERY; EXTERNAL GMAIL INBOX NOT INDEPENDENTLY VERIFIED** (Phase 9)
- **Affected Files:** [`application.yml`](file:///e:/Project/MediNex/backend/src/main/resources/application.yml), [`EmailService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/common/email/EmailService.java), [`AuthService.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/auth/service/AuthService.java)
- **Resolution:** Removed plaintext OTP/reset-token logging, wired `spring.mail.*` properties and delivery boolean return, prevented `120s` resend cooldown trap on transient SMTP failures (`503`), and verified MIME dispatch through Mailpit (`localhost:1026` / `8026`) plus STARTTLS reachability (`250`/`220`) to `smtp.gmail.com:587`. End-to-end external inbox receipt was not independently run because no controlled external recipient mailbox with readback access is provisioned.

---

## OPEN P3 — LOW ISSUES & HARDENING RECOMMENDATIONS

### ISSUE-008 [PARTIALLY RESOLVED]: Frontend `.dockerignore` Added; Optional `backend/.dockerignore`
- **Severity:** **P3 — LOW**
- **Root Cause:** `compose.yaml` builds `./frontend`, while `.dockerignore` previously resided only at the repository root.
- **Status:** Added [`frontend/.dockerignore`](file:///e:/Project/MediNex/frontend/.dockerignore) (reducing Docker frontend build context transfer to `141.17kB` during rebuild); `backend/.dockerignore` remains an optional minor cleanup (`backend` context is `15.18kB`).

### ISSUE-009: Auth Rate Limiting & Token Cookie Hardening
- **Severity:** **P3 — LOW**
- **Root Cause:** JWT tokens are currently stored in browser `localStorage`, and no application-layer rate-limiting filter (`Bucket4j` / Redis throttling) is active on `/api/v1/auth/login` or `/forgot-password`.
- **Recommended Fix:** Add `HttpOnly` refresh cookies and reverse-proxy / Bucket4j throttling before public launch.

### ISSUE-010 [RESOLVED — P3]: Contributor Seed Accounts Restricted to `ROLE_USER`
- **Status:** **RESOLVED & VERIFIED** (Phase 9)
- **Affected Files:** [`DataInitializer.java`](file:///e:/Project/MediNex/backend/src/main/java/com/medinex/config/DataInitializer.java), [`V6__restrict_contributor_roles.sql`](file:///e:/Project/MediNex/backend/src/main/resources/db/migration/V6__restrict_contributor_roles.sql)
- **Resolution:** Removed default `ROLE_ADMIN` grant from seeded contributors in `DataInitializer` and applied forward-only Flyway migration `V6` against live PostgreSQL (`contributor-01..06` verified holding `{ROLE_USER}` only).

### ISSUE-011: Binary Media Upload Endpoint & Local Crash Log Artifact
- **Severity:** **P3 — LOW**
- **Root Cause:** Media attachments use URL references rather than multipart MinIO upload streaming; `hs_err_pid27608.log` (git-ignored) exists in the local workspace root and can be deleted locally.
