# MediNex Docker & DevOps Infrastructure Guide

This directory contains the containerization scripts, base configurations, and initialization steps for MediNex.

## Services Architecture

The multi-container orchestration is defined in [`compose.yaml`](../../compose.yaml) with the following services:

1. **`postgres`** (PostgreSQL 16 Alpine)
   - Autoruns initialization SQL from `infrastructure/docker/postgres/`
   - Persistent volume: `medinex_pgdata`
   - Healthcheck: `pg_isready -U medinex_user -d medinex_db`
   - Dedicated internal network: `medinex-network`
   - **Never delete production volumes with `docker compose down -v`!**

2. **`backend`** (Spring Boot 3.4 on Eclipse Temurin Java 21)
   - Multi-stage Dockerfile (`backend/Dockerfile`)
   - Runs as non-root user (`appuser:10001`)
   - Depends on healthy `postgres` service
   - Connects to PostgreSQL using internal service host `postgres:5432`
   - Actuator health check at `http://localhost:8080/actuator/health`

3. **`frontend`** (Next.js 15 App Router on Node 22 Alpine)
   - Multi-stage Dockerfile (`frontend/Dockerfile`)
   - Standalone Next.js production server
   - Runs as non-root user (`nextjs:10001`)
   - Exposes port 3000

4. **`mailpit`** (Development Mail Server)
   - Web UI on port 8025 (`http://localhost:8025`)
   - SMTP server on port 1025 for local email delivery testing (verification emails, password resets)

5. **`redis`** *(Optional profile: `cache`)*
   - Redis 7.2 Alpine for session/distributed cache acceleration

6. **`minio`** *(Optional profile: `storage`)*
   - S3-compatible local object storage for media files
   - Console on port 9001 (`http://localhost:9001`), S3 API on 9000

---

## Quick Reference Commands

### Start Core Services (Frontend, Backend, PostgreSQL, Mailpit)
```bash
docker compose up --build -d
```

### Start with Optional Profiles (Redis & MinIO Storage)
```bash
docker compose --profile cache --profile storage up --build -d
```

### Check Running Containers & Health Status
```bash
docker compose ps
```

### Tail Live Container Logs
```bash
docker compose logs -f
# Or for a specific service:
docker compose logs -f backend
```

### Stop Services Gracefully (Preserving Volume Data)
```bash
docker compose down
```

> [!CAUTION]
> **DO NOT** run `docker compose down -v` unless you explicitly want to completely wipe the local PostgreSQL database and all uploaded media.
