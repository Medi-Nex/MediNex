# MediNex Deployment & DevOps Runbook

## 1. Prerequisites

- **Docker Engine:** Version 24.0+ (Tested with 29.9+)
- **Docker Compose:** Version 2.20+ (Tested with v5.7+)
- **Ports Required:**
  - `3000`: Frontend (Next.js)
  - `8080`: Backend API Gateway (Spring Boot)
  - `8081`: Backend Management / Actuator
  - `5432`: PostgreSQL database
  - `8025` / `1025`: Mailpit Web UI & SMTP (Development)
  - `6379`: Redis (Optional, cache profile)
  - `9000` / `9001`: MinIO Object Store (Optional, storage profile)

---

## 2. Docker Compose Deployment Commands

### Initialize Environment File
```bash
cp .env.example .env
# Edit .env with your production secrets (JWT keys, strong database passwords)
```

### Build and Launch Core Platform
```bash
docker compose up --build -d
```

### Inspect Container Health & Status
```bash
docker compose ps
```

### Tail Live Container Logs
```bash
docker compose logs -f
```

### Graceful Shutdown (Preserves Volumes & Database Data)
```bash
docker compose down
```

> [!CAUTION]
> **NEVER run `docker compose down -v`** in staging or production.
> The `-v` flag permanently removes named Docker volumes (`medinex_pgdata`), destroying database persistence.

---

## 3. Production Hardening Checklist

1. [x] Multi-stage Docker builds reducing image attack surfaces.
2. [x] Non-root execution (`10001:10001`) in both frontend and backend containers.
3. [x] Internal bridge network (`medinex-network`) preventing direct public exposure of PostgreSQL.
4. [x] Spring Boot Actuator separated to management port 8081.
5. [x] Health checks configured with retries and grace periods (`pg_isready`, `actuator/health`, `wget`).
6. [x] Graceful shutdown lifecycle hooks (20s grace period).
7. [x] Pinned image versions (`postgres:16.4-alpine`, `node:22-alpine`, `eclipse-temurin:21-jre-alpine`).

---

## 4. Database Backup and Restore Procedures

### Database Backup
```bash
docker compose exec postgres pg_dump -U medinex_user -d medinex_db -F c -b -v -f /var/lib/postgresql/data/medinex_backup_$(date +%Y%m%d_%H%M%S).dump
```

### Database Restore
```bash
docker compose exec postgres pg_restore -U medinex_user -d medinex_db -v /var/lib/postgresql/data/<backup_file>.dump
```
