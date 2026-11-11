# MediNex Environment Variables Specification

This document provides an exhaustive, authoritative reference for all configuration parameters across the frontend, backend, database, and infrastructure containers.

> [!WARNING]
> **Production Security Invariants:**
> - Never commit `.env` files or hardcoded credentials to version control.
> - Variables prefixed with `NEXT_PUBLIC_` are bundled directly into client-side JavaScript. Never place backend database credentials, private API secrets, or master encryption keys into `NEXT_PUBLIC_` variables.
> - In production environments, generate cryptographic secrets using `openssl rand -hex 64`.

---

## 1. Frontend Client Variables (Next.js 16 App Router)

| Variable Name | Required | Default in Local Dev | Production Example | Description |
| :--- | :---: | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_NAME` | Yes | `MediNex` | `MediNex` | Platform name displayed across browser tabs and headers |
| `NEXT_PUBLIC_APP_TAGLINE` | Yes | `Connecting Technology, Research & Healthcare Innovation.` | `Connecting Technology, Research & Healthcare Innovation.` | Official platform tagline |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3002` | `https://medinex-bd.vercel.app` | Canonical URL base for OpenGraph, Twitter Cards, and sitemaps |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | `http://localhost:8082/api/v1` | `https://api.medinex.health/api/v1` | Backend API gateway destination used by Axios / Fetch clients |

---

## 2. Backend Application Variables (Spring Boot 3.4)

| Variable Name | Required | Default in Local Dev | Production Example | Description |
| :--- | :---: | :--- | :--- | :--- |
| `SERVER_PORT` | Yes | `8080` (mapped to `8082`) | `8080` | Internal container port for Spring Boot HTTP server |
| `MANAGEMENT_SERVER_PORT` | No | `8081` (mapped to `8083`) | `8081` | Dedicated Actuator health check and metric port |
| `SPRING_PROFILES_ACTIVE` | Yes | `dev` | `prod` | Active Spring profile (`dev`, `prod`, `test`) |
| `SPRING_DATASOURCE_URL` | Yes | `jdbc:postgresql://postgres:5432/medinex_db` | `jdbc:postgresql://db.internal:5432/medinex_db` | JDBC connection string |
| `SPRING_DATASOURCE_USERNAME` | Yes | `medinex_user` | `medinex_prod_user` | Database authentication username |
| `SPRING_DATASOURCE_PASSWORD` | Yes | `medinex_secure_password_dev_only` | `[SECURE_DB_PASSWORD]` | Database authentication password |
| `SPRING_FLYWAY_ENABLED` | Yes | `true` | `true` | Enables deterministic database schema migrations |
| `SPRING_FLYWAY_BASELINE_ON_MIGRATE` | Yes | `true` | `true` | Automatically baselines existing databases if present |

---

## 3. Cryptographic & Security Tokens

| Variable Name | Required | Default in Local Dev | Production Example | Description |
| :--- | :---: | :--- | :--- | :--- |
| `JWT_SECRET_KEY` | **Yes** | 256-bit development key | `[64-byte random hex string]` | HMAC-SHA256 signing key for access tokens |
| `JWT_ACCESS_TOKEN_EXPIRATION_MS` | Yes | `900000` (15 minutes) | `900000` | Expiration window for stateless access tokens |
| `JWT_REFRESH_TOKEN_EXPIRATION_MS` | Yes | `604800000` (7 days) | `604800000` | Expiration window for rotating refresh tokens |
| `CORS_ALLOWED_ORIGINS` | Yes | `http://localhost:3000,http://localhost:3002` | `https://medinex.health` | Comma-separated allowlist of permitted browser origins |

---

## 4. Email & Notifications Configuration

| Variable Name | Required | Default in Local Dev | Production Example | Description |
| :--- | :---: | :--- | :--- | :--- |
| `MAIL_HOST` | Yes | `mailpit` (or `smtp.gmail.com` via `.env`) | `smtp.sendgrid.net` | Outgoing SMTP server address |
| `MAIL_PORT` | Yes | `1025` (or `587` via `.env`) | `587` | SMTP communication port |
| `MAIL_USERNAME` | Prod | *None (Mailpit)* / Gmail sender | `apikey` | SMTP service username |
| `MAIL_PASSWORD` | Prod | *None (Mailpit)* / Gmail App Password | `[SENDGRID_API_KEY]` | SMTP service password (never commit or log) |
| `MAIL_SMTP_AUTH` | Yes | `true` (`false` for unauthenticated Mailpit) | `true` | Enables SMTP authentication (`spring.mail.properties.mail.smtp.auth`) |
| `MAIL_SMTP_STARTTLS` | Yes | `true` (`false` for plain Mailpit) | `true` | Enables/requires SMTP STARTTLS (`mail.smtp.starttls.*`) |
| `MAIL_FROM_ADDRESS` | Yes | `medinexbd.noreply@gmail.com` | `noreply@medinex.health` | Verified sender address for OTP and password reset dispatches |
| `MAIL_FROM_NAME` | No | `MediNex Platform` | `MediNex Platform` | Display name used in formatted `From` header |
| `SERVER_SERVLET_CONTEXT_PATH` | Yes | `/` | `/` | Root servlet context path (controllers map `/api/v1/**` explicitly) |

---

## 5. Infrastructure & Optional Service Profiles

| Variable Name | Profile | Default in Local Dev | Description |
| :--- | :---: | :--- | :--- |
| `POSTGRES_DB` | Core | `medinex_db` | PostgreSQL initial database name |
| `POSTGRES_USER` | Core | `medinex_user` | PostgreSQL administrator username |
| `POSTGRES_PASSWORD` | Core | `medinex_secure_password_dev_only` | PostgreSQL administrator password |
| `POSTGRES_PORT` | Core | `5434` (mapped from `5432`) | Exposed host port for local database tools |
| `MAILPIT_WEB_PORT` | Core | `8026` (mapped from `8025`) | Web dashboard port for inspecting simulated emails |
| `MAILPIT_SMTP_PORT` | Core | `1026` (mapped from `1025`) | SMTP reception port for Mailpit |
| `REDIS_HOST` | `cache` | `redis` | Redis service hostname |
| `REDIS_PORT` | `cache` | `6379` | Redis listening port |
| `MINIO_ROOT_USER` | `storage` | `minioadmin` | MinIO S3 root access key |
| `MINIO_ROOT_PASSWORD` | `storage` | `minioadmin` | MinIO S3 root secret key |
