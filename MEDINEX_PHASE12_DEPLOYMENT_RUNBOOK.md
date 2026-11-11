# MediNex — Phase 12 Deployment Runbook

**Target Stack:** Vercel (`medinex-bd.vercel.app`) + Railway Hobby (`medinex-backend` + Volume) + Neon Serverless PostgreSQL (`aws-ap-southeast-1`) + Transactional SMTP  
**Fixed-Cost Alternative Included:** Render Web Service Starter + Render Persistent Disk (documented in Section 6)

> **Safety Rule:** Never run `docker compose down -v`, `DROP DATABASE`, `TRUNCATE`, or `flyway clean` against an existing active environment. Always take a `pg_dump` snapshot or Neon branch before schema changes.

---

## 1. Prerequisites & Tooling Check

1. Cloud accounts controlled by project owner: **GitHub**, **Neon**, **Railway** (or **Render**), **Vercel**, and a transactional **SMTP provider** (Resend, Brevo, Mailgun, or Gmail App Password for initial low-volume pilot).
2. Local CLI tools (optional verification): `openssl`, `curl`, PostgreSQL client (`psql` / `pg_dump`).
3. Generate cryptographically strong production secrets locally (never store them in Git):
   ```bash
   # Minimum 256-bit base64 secret for JWT signing
   openssl rand -base64 64
   ```

---

## 2. Provision Managed PostgreSQL (Neon — Singapore `aws-ap-southeast-1`)

1. Sign in to Neon and create project **`medinex-prod`** in region **`Asia Pacific (Singapore) — aws-ap-southeast-1`**, PostgreSQL **16**.
2. Create application database **`neondb`** (or **`medinex_db`**) and record **two** connection hosts from Neon Console -> *Connection Details*:
   - **Pooled Endpoint** (contains `-pooler` in hostname, PgBouncer transaction mode):
     `jdbc:postgresql://<endpoint>-pooler.<region>.aws.neon.tech:5432/neondb?sslmode=require`
   - **Direct Endpoint** (without `-pooler`, used strictly for Flyway):
     `jdbc:postgresql://<endpoint>.<region>.aws.neon.tech:5432/neondb?sslmode=require`
3. Record database username (`SPRING_DATASOURCE_USERNAME`) and generated password (`SPRING_DATASOURCE_PASSWORD`).
4. **Optional Data Migration Choice (Only If Preserving Local Users Instead of Clean Launch):**
   - Clean Launch *(Recommended for Public Production)*: Leave database empty so Flyway runs `V1`–`V6` fresh and `DataInitializer` bootstraps only the new `SUPER_ADMIN` from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (no `contributor-01..06` test accounts).
   - Staging Mirror / Migration: Dump local DB via `./infrastructure/scripts/backup.ps1` (excluding dev accounts if unwanted) and restore cleanly to Neon's **Direct** endpoint using `pg_restore` / `psql` *before* booting the backend.

---

## 3. Deploy Backend API & Persistent Volume (Railway — Singapore Metal)

1. In Railway, create project **`medinex-backend-prod`** from the repository, setting:
   - **Service Root Directory:** `backend`
   - **Builder:** `Dockerfile` (`backend/Dockerfile`)
   - **Region:** `asia-southeast1-eqsg3a` (Singapore)
   - **Replicas:** **Strictly `1`** (mandatory while `/app/uploads` uses POSIX volume storage)
2. Attach a **Persistent Volume** to the backend service:
   - **Mount Path:** `/app/uploads`
   - **Initial Size:** `2 GB` (Hobby allows up to `5 GB`; adjust upward before approaching 80%)
   - Confirm container runs with matching user permissions (`backend/Dockerfile` creates and chowns `/app/uploads` for `appuser`, or set `RAILWAY_RUN_UID=0` temporarily only if provider volume mount initializes root-owned permissions).
3. Configure **Healthcheck**:
   - **Healthcheck Path:** `/actuator/health`
   - **Startup / Timeout:** `60–120s` (allows Flyway `V1`–`V6` execution on cold initial boot)
   - *Important:* Leave `MANAGEMENT_SERVER_PORT` **unset** so Actuator binds onto `$PORT` alongside the API.
4. Set all **Service Environment Variables** via Railway Variables dashboard (refer to [MEDINEX_PHASE12_ENVIRONMENT_VARIABLES.md](MEDINEX_PHASE12_ENVIRONMENT_VARIABLES.md)):
   - `SPRING_PROFILES_ACTIVE=prod`
   - `SPRING_DATASOURCE_URL` (`-pooler` Neon URL with `?sslmode=require`)
   - `SPRING_FLYWAY_URL` (Direct Neon URL without `-pooler`, `?sslmode=require`)
   - `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`
   - `JWT_SECRET_KEY`, `CORS_ALLOWED_ORIGINS=https://medinex-bd.vercel.app`
   - `UPLOAD_DIR=/app/uploads`
   - `SPRINGDOC_ENABLED=false`
   - `MAIL_HOST`, `MAIL_PORT=587`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`
   - `MEDINEX_SEED_ENABLED=true`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` *(rotate/clear after initial admin bootstrap if desired)*
5. Generate Railway public HTTPS domain (or bind custom domain `https://api.<your-domain>`), deploy, and inspect Railway logs for:
   - Flyway applying `6` migrations cleanly (`V1` through `V6`)
   - Hibernate `ddl-auto: validate` passing cleanly
   - Tomcat starting on `$PORT` without `PlaceholderResolutionException` or `IllegalStateException`

---

## 4. Configure & Redeploy Frontend (Vercel)

1. Open Vercel Dashboard -> Project (`medinex-bd`) -> **Settings -> Environment Variables** (`Production` scope).
2. Add or update:
   - `NEXT_PUBLIC_APP_NAME` = `MediNex`
   - `NEXT_PUBLIC_APP_TAGLINE` = `Connecting Technology, Research & Healthcare Innovation.`
   - `NEXT_PUBLIC_APP_URL` = `https://medinex-bd.vercel.app`
   - `NEXT_PUBLIC_API_BASE_URL` = `https://<your-railway-backend-domain>/api/v1` *(exact HTTPS URL, no trailing slash)*
3. Trigger a fresh **Production Redeploy** cleanly so Next.js `16.4.6`:
   - Passes [`next.config.ts`](frontend/next.config.ts) HTTPS/non-localhost validation,
   - Compiles dynamic CSP (`connect-src` and `img-src`) allowing only `https://<your-railway-backend-domain>`,
   - Compiles dynamic `images.remotePatterns` for avatar thumbnails.

---

## 5. Post-Deploy Cutover Verification Checklist

Run these non-destructive live verification commands after Vercel & Railway report ready:

```bash
# 1. Backend Health Probe (must return {"status":"UP"} HTTP 200; probes/details stay hidden)
curl -fsS https://<backend-domain>/actuator/health

# 2. Swagger Disabled Verification (must return 401/403/404, NEVER 200 API docs)
curl -o /dev/null -s -w "%{http_code}\n" https://<backend-domain>/swagger-ui/index.html

# 3. CORS Preflight Check from Production Origin (must return HTTP 200 + Allow-Origin header)
curl -i -X OPTIONS \
  -H "Origin: https://medinex-bd.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  https://<backend-domain>/api/v1/community/feed

# 4. Unauthorized CORS Origin Rejection (must return 403)
curl -o /dev/null -s -w "%{http_code}\n" -X OPTIONS \
  -H "Origin: https://untrusted-site.example" \
  -H "Access-Control-Request-Method: GET" \
  https://<backend-domain>/api/v1/community/feed

# 5. HTTP 405 Method Safety Check (must return 405, NEVER 500)
curl -s -w "\nHTTP:%{http_code}\n" https://<backend-domain>/api/v1/community/posts
```

Then validate cleanly in browser on `https://medinex-bd.vercel.app`:
- Public Community feed renders without CORS or CSP browser console errors.
- Sign in using bootstrapped `SUPER_ADMIN` (`SEED_ADMIN_EMAIL`) -> verify `/admin` works -> upload avatar in `/dashboard/settings` -> confirm avatar URL loads over HTTPS (`https://<backend-domain>/uploads/avatars/...`) -> trigger service restart in Railway and verify uploaded avatar still loads cleanly (`Volume` persistence verified!).
- Register a real test email -> confirm OTP email arrives via SMTP (no PII/OTP printed in backend logs) -> verify OTP -> reset password test.

---

## 6. Fixed-Cost Alternative Deployment (Render)

If fixed monthly pricing is preferred over Railway's metered Hobby tier:
1. Provision **Render Web Service (Starter `$7/mo`, Docker, `512 MB` RAM)** in **Singapore (`sin`)**.
2. Set `JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=70.0 -XX:+UseSerialGC` (prevents Java heap OOM on `512 MB` RAM limit).
3. Attach **Render Persistent Disk (`1–2 GB`, `$0.25/GB-mo`)** mounted at `/app/uploads` (Render auto-locks scaling to `1` instance).
4. Set **Health Check Path** to `/actuator/health` (omit `MANAGEMENT_SERVER_PORT`).
5. Pair with **Neon Serverless PostgreSQL** (never Render Free Postgres which deletes after `30` days) or **Render Starter Postgres (`$6+/mo`)**.

---

## 7. Backup, Recovery & Rollback Procedures

### 7.1 Routine Backups
- **Database:** Rely on Neon PITR (upgrade Free `6h` -> Launch `7d` PITR for active traffic) PLUS scheduled encrypted logical `pg_dump` backups via Direct endpoint:
  ```bash
  PGSSLMODE=require pg_dump -Fc -h <neon-direct-host> -U <db_user> -d neondb -f medinex_backup_$(date +%F).dump
  ```
- **Media Volume:** Snapshot `/app/uploads` regularly before upgrades or host migrations.

### 7.2 Fast Rollback Plan
1. **Frontend Rollback (Vercel):** Instant 1-click *Promote Previous Deployment* in Vercel Deployments history.
2. **Backend Rollback (Railway/Render):** Redeploy previous healthy Docker image/commit SHA from Railway Deployments tab.
3. **Database Schema Rollback:** Never roll back Flyway via destructive DDL in place. Instead:
   - Stop backend writes,
   - Use **Neon Instant Point-in-Time Restore / Branch** to restore immediately prior to failed migration timestamp, OR restore latest `pg_dump` dump via:
     ```bash
     PGSSLMODE=require pg_restore --clean --if-exists -h <neon-direct-host> -U <db_user> -d neondb medinex_backup_<date>.dump
     ```
4. **Incident Secret Rotation:** Immediately rotate `JWT_SECRET_KEY`, `SPRING_DATASOURCE_PASSWORD`, and `MAIL_PASSWORD` in Railway/Neon/SMTP provider dashboards if compromise is suspected (`JWT_SECRET_KEY` rotation invalidates all outstanding sessions).
