# MediNex — Phase 12 Deployment Architecture

**Platform:** MediNex — Healthcare Innovation & Technology Platform  
**Featured Initiative:** ShasthoSetu — Interoperable Digital Health Record & Exchange Platform  
**Target Topology:** Vercel Edge Frontend + Railway Spring Boot Backend (Persistent Volume) + Neon Serverless PostgreSQL + Transactional SMTP

---

## 1. End-to-End Production Topology

```mermaid
flowchart LR
    User["Browser / Client<br/>HTTPS Requests"] -->|HTTPS| Vercel["Vercel Hosting<br/>medinex-bd.vercel.app<br/>Next.js 16.4.6"]
    User -->|HTTPS REST API + Bearer JWT<br/>& /uploads/avatars/*.jpg| Proxy["Railway Edge TLS Proxy<br/>https://api.medinex-domain"]
    Proxy -->|HTTP :$PORT| Backend["Railway Service: medinex-backend<br/>Java 21 + Spring Boot 3.4.3<br/>SPRING_PROFILES_ACTIVE=prod<br/>1 Replica"]
    Backend <-->|POSIX Read/Write<br/>/app/uploads| Volume["Railway Persistent Volume<br/>1-2 GB (64/256/512 JPEGs)"]
    Backend -->|Runtime JPA Pool (HikariCP max 10)<br/>PgBouncer Transaction Mode (-pooler)<br/>sslmode=require| NeonPool["Neon Serverless PostgreSQL<br/>aws-ap-southeast-1 (Pooled Endpoint)"]
    Backend -->|Startup Migrations (Flyway V1-V6)<br/>Direct Session Mode (SPRING_FLYWAY_URL)<br/>sslmode=require| NeonDirect["Neon Serverless PostgreSQL<br/>aws-ap-southeast-1 (Direct Endpoint)"]
    Backend -->|SMTP STARTTLS :587| SMTP["Transactional Email Relay<br/>OTP Verification & Password Reset"]
```

---

## 2. Core Architectural Components & Responsibilities

### 2.1 Frontend Edge (`Vercel — Next.js 16.4.6`)

- Serves SSR/static marketing, project showcase (`/projects/shasthosetu`), community, user profile (`/users/[username]`), team (`/team/[username]`), dashboard, and admin UI routes.
- Build-time environment injection via [`env.ts`](frontend/src/lib/env.ts) and [`next.config.ts`](frontend/next.config.ts):
  - Rejects any Vercel/HTTPS build missing a valid `https://` `NEXT_PUBLIC_API_BASE_URL` or attempting to reference `localhost`/`127.0.0.1`.
  - Dynamically injects the configured API origin (`https://<backend-host>`) into response security headers (`Content-Security-Policy`: `connect-src` and `img-src`) and `images.remotePatterns`, omitting localhost origins completely on Vercel/HTTPS builds.

### 2.2 Backend API Container (`Railway Hobby — medinex-backend`)

- Built from multi-stage [`backend/Dockerfile`](backend/Dockerfile) running Eclipse Temurin Java 21 JRE on Alpine Linux (`appuser:appgroup`).
- Activated cleanly via `SPRING_PROFILES_ACTIVE=prod` using [`application-prod.yml`](backend/src/main/resources/application-prod.yml):
  - Binds HTTP and Actuator management probes together onto `$PORT` (`MANAGEMENT_SERVER_PORT` omitted on PaaS) with `server.forward-headers-strategy: native`.
  - Exposes `/actuator/health`, `/actuator/health/liveness`, and `/actuator/health/readiness` (`show-details: never`, mail healthcheck disabled).
  - Disables SpringDoc / Swagger endpoints by default (`SPRINGDOC_ENABLED=false`).
  - Validates `CORS_ALLOWED_ORIGINS` strictly against explicit HTTPS origins (blocking wildcard `*` with credentials).
  - Runs **`1` container replica** attached to a mounted Railway Persistent Volume at `/app/uploads` so multi-resolution avatars written by [`AvatarImageService.java`](backend/src/main/java/com/medinex/user/service/AvatarImageService.java) survive deploys and restarts.

### 2.3 Managed PostgreSQL (`Neon Serverless PostgreSQL — aws-ap-southeast-1`)

- Uses a **dual-endpoint JDBC configuration** built into [`application-prod.yml`](backend/src/main/resources/application-prod.yml):
  - **Runtime (`SPRING_DATASOURCE_URL`):** Points to Neon's **`-pooler`** hostname with `?sslmode=require`, paired with HikariCP bounds (`DB_POOL_MAX=10`, `DB_POOL_MIN=2`, `max-lifetime=900000`, `keepalive-time=120000`, `connection-test-query=SELECT 1`) and `open-in-view=false`.
  - **Migrations (`SPRING_FLYWAY_URL`):** Points to Neon's **direct non-pooled** hostname with `?sslmode=require` so Flyway advisory locks execute reliably without PgBouncer transaction-pooling conflicts.
- `spring.jpa.hibernate.ddl-auto=validate` guarantees Hibernate never alters schemas outside tracked Flyway migrations (`V1`–`V6`).

### 2.4 Services Intentionally Excluded from Production

- **Mailpit (`medinex-mailpit`):** Local development SMTP catcher only; production uses an authenticated external SMTP relay over TLS (`587`).
- **Redis & MinIO (`compose.yaml` optional profiles):** Unused by application code or [`backend/pom.xml`](backend/pom.xml); omitted completely to eliminate unnecessary attack surface and hosting cost.

---

## 3. Environment Separation Model

| Concern | Local Docker Compose | Production Cloud |
| :--- | :--- | :--- |
| **Spring Profile** | `dev` | `prod` |
| **Ports** | Backend `8080`, Actuator `8081` (isolated), Frontend `3000` | Backend & `/actuator/health` shared on PaaS `$PORT`; Frontend HTTPS `443` (Vercel) |
| **PostgreSQL** | Local `medinex-postgres` (`medinex_pgdata`, no SSL) | Managed Neon (`aws-ap-southeast-1`, `sslmode=require`, `-pooler` + Direct Flyway URL) |
| **JWT Signing Key** | Local dev/env secret (`compose.yaml` / `.env`) | Cryptographically random >=256-bit `JWT_SECRET_KEY` (fail-fast if default/short/empty) |
| **Seed Users** | Optional demo accounts (`contributor-01`..`06`, `medinex-admin`) | `demo-users-enabled: false`; requires explicit `SEED_ADMIN_PASSWORD` if `MEDINEX_SEED_ENABLED=true` |
| **Swagger / OpenAPI** | Available locally when enabled | `SPRINGDOC_ENABLED=false` (disabled by default) |
| **Email Transport** | Local `medinex-mailpit:1025` | Verified external SMTP relay (`smtp.gmail.com` / Resend / Brevo) on TLS `587` |
| **Uploads Storage** | Docker volume `medinex_uploads` (`/app/uploads`) | Railway Persistent Volume mounted at `/app/uploads` (single instance) |

---

## 4. Authentication, Security Boundaries & CORS/CSP Flow

1. **TLS Termination:** Both Vercel (`medinex-bd.vercel.app`) and the backend edge proxy terminate TLS 1.2/1.3 before requests reach Next.js or Spring Boot.
2. **Cross-Origin Requests:**
   - Browser calls from `https://medinex-bd.vercel.app` target `https://<backend-domain>/api/v1/**` with `Authorization: Bearer <accessToken>` headers and explicit `CORS_ALLOWED_ORIGINS=https://medinex-bd.vercel.app`.
   - Pre-flight `OPTIONS` requests succeed only for allowlisted origins; unapproved origins return `403` and unauthenticated protected routes return `401`.
3. **Current Auth Session Architecture (Documented Limitation):**
   - Authentication returns short-lived JWT access tokens (`900000 ms` / 15m) and rotating refresh tokens (`604800000 ms` / 7d) in JSON bodies stored in browser `localStorage` (`auth-context.tsx`), with `SessionCreationPolicy.STATELESS` and CSRF disabled in Spring Security.
   - Strong response security headers (`X-Frame-Options: DENY`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, and narrowed `Content-Security-Policy`) protect against clickjacking, MIME sniffing, and unauthorized origins while cookie-based (`HttpOnly`) session hardening remains a future post-launch enhancement.
4. **Input & PHI Boundaries:** Frontend client guardrails, Spring `@Valid` request validation, RBAC role guards (`ROLE_SUPER_ADMIN`, `ROLE_ADMIN`, `ROLE_MODERATOR`, `ROLE_USER`), privacy enforcement on `isPublicVisible`, `405 Method Not Allowed` mapping, and redacted `500` error responses enforce strict security boundaries across all tiers.
