# MediNex — Phase 12 Environment Variables Specification

**Security Policy:** All values marked **Secret** MUST be supplied solely through provider secret stores (Vercel Project Environment Variables, Railway Variables, Render Secret Files/Env, Neon dashboard) and NEVER committed to Git or logged in plaintext. Refer to [`.env.production.example`](.env.production.example) and [`frontend/.env.example`](frontend/.env.example) for sanitized copyable templates.

---

## 1. Frontend Build & Runtime Variables (Vercel / Next.js)

| Variable | Scope | Required | Sensitivity | Example Placeholder / Value | Fail-Fast Guard Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_NAME` | Client + SSR | Optional | Non-secret | `MediNex` | Defaults cleanly if omitted |
| `NEXT_PUBLIC_APP_TAGLINE` | Client + SSR | Optional | Non-secret | `Connecting Technology, Research & Healthcare Innovation.` | Defaults cleanly if omitted |
| `NEXT_PUBLIC_APP_URL` | SSR / SEO / Sitemap | **Yes (Prod)** | Non-secret | `https://medinex-bd.vercel.app` | Signals HTTPS production context when prefixed with `https://` |
| `NEXT_PUBLIC_API_BASE_URL` | Client Build-Time (`next.config.ts`, `env.ts`) | **Yes (Prod)** | Non-secret | `https://<backend-domain>/api/v1` | **Build aborts** on `VERCEL=1` or `https://` app URL if missing, plain `http://`, or `localhost`/`127.0.0.1` |

*Note:* Changing `NEXT_PUBLIC_*` in Vercel requires triggering a **fresh Vercel deployment** because Next.js inlines public client variables and computes CSP/`images.remotePatterns` at build time.

---

## 2. Backend Runtime Variables (Spring Boot `prod` Profile)

### 2.1 Profile, Server & Healthcheck Variables

| Variable | Required | Sensitivity | Default in `application-prod.yml` | Cloud Value / Guidance |
| :--- | :--- | :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | **Yes** | Non-secret | None (`application.yml` defaults `dev`) | **`prod`** — mandatory to activate fail-fast guards & disable Swagger/demo users |
| `PORT` | PaaS-injected | Non-secret | Injected by Railway/Render/Koyeb | Do not hardcode manually unless required by platform; overrides `SERVER_PORT` |
| `SERVER_PORT` | Fallback | Non-secret | `8080` | `8080` (used if platform does not inject `PORT`) |
| `MANAGEMENT_SERVER_PORT` | Optional | Non-secret | Defaults to `${PORT:${SERVER_PORT:8080}}` | **Omit on single-port PaaS** so `/actuator/health` serves on `$PORT`; keep `8081` only in `compose.yaml` |
| `SPRINGDOC_ENABLED` | Optional | Non-secret | `false` | Keep **`false`** in production to disable public `/swagger-ui` and `/v3/api-docs` |

### 2.2 PostgreSQL & Flyway Variables (`application-prod.yml`)

| Variable | Required | Sensitivity | Placeholder / Format | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | **Yes (Fail-Fast)** | Contains host/DB | `jdbc:postgresql://<neon-pooler-host>:5432/neondb?sslmode=require` | Startup aborts immediately if unset in `prod`; use Neon **`-pooler`** host for HikariCP |
| `SPRING_DATASOURCE_USERNAME` | **Yes (Fail-Fast)** | Low / Config | `<db_role_name>` | Dedicated least-privilege PostgreSQL application role |
| `SPRING_DATASOURCE_PASSWORD` | **Yes (Fail-Fast)** | **Secret** | `CHANGE_ME_STRONG_DB_PASSWORD` | Never store in repo |
| `SPRING_FLYWAY_URL` | **Recommended (Neon)** | Contains host/DB | `jdbc:postgresql://<neon-direct-host>:5432/neondb?sslmode=require` | Falls back to `SPRING_DATASOURCE_URL`; **MUST point to Direct non-pooled Neon endpoint** for Flyway locks |
| `SPRING_FLYWAY_USER` | Optional | Low / Config | Falls back to `SPRING_DATASOURCE_USERNAME` | Set only if migrations use a distinct privileged role |
| `SPRING_FLYWAY_PASSWORD` | Optional | **Secret** | Falls back to `SPRING_DATASOURCE_PASSWORD` | Set only if `SPRING_FLYWAY_USER` differs |
| `SPRING_FLYWAY_ENABLED` | Optional | Non-secret | `true` | Keep `true` so container startup fails safely on schema mismatch |
| `SPRING_FLYWAY_BASELINE_ON_MIGRATE` | Optional | Non-secret | `false` | Keep `false` on clean DB; only evaluate on pre-existing un-tracked schema |
| `DB_POOL_MAX` | Optional | Non-secret | `10` | Tune `5–10` for starter Neon / Render tiers |
| `DB_POOL_MIN` | Optional | Non-secret | `2` | Keep low (`1–2`) to reduce idle connection overhead |

### 2.3 Security, JWT, CORS & Seed Variables

| Variable | Required | Sensitivity | Placeholder / Format | Fail-Fast & Security Guardrails |
| :--- | :--- | :--- | :--- | :--- |
| `JWT_SECRET_KEY` | **Yes (Fail-Fast)** | **Secret** | Output of `openssl rand -base64 64` | **Startup throws `IllegalStateException`** in `prod` if blank, matches dev key, or `< 32` decoded bytes |
| `JWT_ACCESS_TOKEN_EXPIRATION_MS` | Optional | Non-secret | `900000` (15 minutes) | Access token TTL in milliseconds |
| `JWT_REFRESH_TOKEN_EXPIRATION_MS` | Optional | Non-secret | `604800000` (7 days) | Rotating refresh token TTL in milliseconds |
| `CORS_ALLOWED_ORIGINS` | **Yes (Fail-Fast)** | Non-secret | `https://medinex-bd.vercel.app` | Comma-separated exact HTTPS origins; no trailing slashes; `*` rejected when credentials enabled |
| `MEDINEX_SEED_ENABLED` | Optional | Non-secret | `true` | `DataInitializer` runs `ROLE_*` initialization safely; demo contributors remain `false` in `prod` |
| `SEED_ADMIN_EMAIL` | Recommended | Non-secret | `admin@medinex.health` | Initial bootstrap `SUPER_ADMIN` email (used only if admin does not already exist) |
| `SEED_ADMIN_PASSWORD` | **Required if seeding admin in `prod`** | **Secret** | `CHANGE_ME_STRONG_ADMIN_PASSWORD` | In `prod`, if `medinex-admin` does not yet exist and `SEED_ADMIN_PASSWORD` is empty or matches legacy defaults, startup **aborts fail-fast** |

### 2.4 Media Storage & Transactional SMTP Variables

| Variable | Required | Sensitivity | Placeholder / Format | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `UPLOAD_DIR` | **Yes** | Non-secret | `/app/uploads` | **MUST match Railway/Render Persistent Volume mount path** (`/app/uploads`); otherwise avatars are wiped on redeploy |
| `MAIL_HOST` | **Yes (for OTP/Reset)** | Non-secret | `smtp.resend.com` / `smtp-relay.brevo.com` / `smtp.gmail.com` | Local `localhost` / Mailpit invalid in cloud |
| `MAIL_PORT` | **Yes (for OTP/Reset)** | Non-secret | `587` | TLS STARTTLS port |
| `MAIL_USERNAME` | **Yes (for OTP/Reset)** | Config / Secret | `YOUR_SMTP_USERNAME` | Provider SMTP username (e.g., `resend` or verified address) |
| `MAIL_PASSWORD` | **Yes (for OTP/Reset)** | **Secret** | `CHANGE_ME_SMTP_API_KEY_OR_APP_PASSWORD` | Required in cloud for registration OTP & password reset delivery |
| `MAIL_SMTP_AUTH` | Optional | Non-secret | `true` | Enables SMTP AUTH |
| `MAIL_SMTP_STARTTLS` | Optional | Non-secret | `true` | Enforces STARTTLS encryption |
| `MAIL_FROM_ADDRESS` | Recommended | Non-secret | `noreply@your-verified-domain` | Sender email authorized by SPF/DKIM on SMTP provider |
| `MAIL_FROM_NAME` | Optional | Non-secret | `MediNex Platform` | Display sender name |

---

## 3. Docker Compose Build-Time Arguments (`compose.yaml` Staging / Local)

| Argument / Variable | Usage | Default / Guidance |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` (build-arg in `frontend/Dockerfile`) | Baked into Next.js Docker image during container builds | Defaults to `""` in `frontend/Dockerfile`; explicitly set `http://localhost:8080/api/v1` in `compose.yaml` for local Compose |
| `MANAGEMENT_SERVER_PORT` | Port isolation in local Compose only | Set to `8081` in `compose.yaml` (`backend.environment`); **do not set** in Railway/Render cloud deployments |
