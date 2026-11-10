# MediNex Environment Variables Specification

This document details all configuration parameters defined in [`.env.example`](.env.example).

## Frontend Variables (Next.js)

| Variable | Required | Default in Dev | Purpose |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_NAME` | Yes | `MediNex` | Display brand name in UI headers and metadata |
| `NEXT_PUBLIC_APP_TAGLINE` | Yes | `Healthcare Innovation. Connected Communities.` | Official platform tagline |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` | Canonical origin for OpenGraph and sitemaps |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | `http://localhost:8080/api/v1` | Backend API gateway destination |

---

## Backend Variables (Spring Boot)

| Variable | Required | Default in Dev | Purpose |
| :--- | :--- | :--- | :--- |
| `SERVER_PORT` | Yes | `8080` | Application HTTP listening port |
| `SERVER_SERVLET_CONTEXT_PATH` | Yes | `/api/v1` | Root servlet path prefix |
| `SPRING_PROFILES_ACTIVE` | Yes | `dev` | Active Spring profile (`dev`, `prod`, `test`) |
| `MANAGEMENT_SERVER_PORT` | No | `8081` | Actuator management endpoint port |
| `SPRING_DATASOURCE_URL` | Yes | `jdbc:postgresql://postgres:5432/medinex_db` | JDBC database connection string |
| `SPRING_DATASOURCE_USERNAME` | Yes | `medinex_user` | PostgreSQL connection username |
| `SPRING_DATASOURCE_PASSWORD` | Yes | `medinex_secure_password_dev_only` | PostgreSQL password |
| `SPRING_FLYWAY_ENABLED` | Yes | `true` | Enables automatic schema migration |

---

## Security & Cryptographic Secrets

| Variable | Required | Default in Dev | Purpose |
| :--- | :--- | :--- | :--- |
| `JWT_SECRET_KEY` | **Yes (Prod)** | 256-bit dev key | Signing key for JWT access tokens. Generate with `openssl rand -base64 64` |
| `JWT_ACCESS_TOKEN_EXPIRATION_MS` | Yes | `900000` (15 min) | Access token validity window |
| `JWT_REFRESH_TOKEN_EXPIRATION_MS` | Yes | `604800000` (7 days)| Refresh token validity window |
| `CORS_ALLOWED_ORIGINS` | Yes | `http://localhost:3000` | Comma-separated list of browser origins permitted by CORS |

---

## Local Development Services (Mailpit, Redis, MinIO)

| Variable | Required | Default in Dev | Purpose |
| :--- | :--- | :--- | :--- |
| `MAIL_HOST` | No | `mailpit` | SMTP server address |
| `MAIL_PORT` | No | `1025` | SMTP port (Mailpit web UI on 8025) |
| `REDIS_HOST` | No | `redis` | Redis cache hostname (profile: `cache`) |
| `MINIO_ROOT_USER` | No | `minioadmin` | MinIO root access key (profile: `storage`) |
| `MINIO_ROOT_PASSWORD` | No | `minioadmin` | MinIO secret key (profile: `storage`) |
