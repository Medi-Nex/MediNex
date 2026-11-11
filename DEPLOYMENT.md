# MediNex Production Deployment & DevOps Runbook

## 1. System Requirements & Prerequisites

- **Host OS:** Linux (Ubuntu 22.04 LTS recommended), macOS, or Windows Server with WSL2.
- **Docker Engine:** Version 24.0+ (Tested on Docker Engine v27.0+).
- **Docker Compose:** Version 2.20+ (Plugin or Standalone CLI).
- **Network Ports:**
  - `3002`: Frontend Next.js Public Web App (Production mapped)
  - `8082`: Backend Spring Boot API Gateway (Production mapped)
  - `8083`: Spring Boot Actuator Management Port
  - `5434`: PostgreSQL database (Development only; omitted in production)
  - `8026` / `1026`: Mailpit Web Dashboard & SMTP port (Development)
  - `6379`: Redis (Optional, `--profile cache`)
  - `9000` / `9001`: MinIO Object Store API & Console (Optional, `--profile storage`)

---

## 2. Docker Compose Deployment Commands

### Step 1: Initialize Environment File
```bash
# Clone production configuration template
cp .env.example .env

# Generate a cryptographically secure 256-bit or 512-bit JWT secret:
openssl rand -hex 64
```
Ensure `.env` contains strong production passwords and the generated `JWT_SECRET_KEY`.

### Step 2: Build and Launch Containers
```bash
# Build multi-stage production images and launch services in background
docker compose up --build -d
```

### Step 3: Verify Container Health & Status
```bash
docker compose ps
```
Expected output:
```
NAME               IMAGE                     COMMAND                  SERVICE    STATUS
medinex-postgres   postgres:16.4-alpine      "docker-entrypoint.s…"   postgres   Up (healthy)
medinex-backend    medinex-backend           "java org.springfram…"   backend    Up (healthy)
medinex-frontend   medinex-frontend          "node server.js"         frontend   Up (healthy)
medinex-mailpit    axllent/mailpit:v1.20     "/mailpit"               mailpit    Up
```

### Step 4: Stream Live Application Logs
```bash
docker compose logs -f
```
To tail logs for a specific service:
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Step 5: Graceful Shutdown (Preserves Persistent Named Volumes)
```bash
docker compose down
```

> [!CAUTION]
> **CRITICAL VOLUME WARNING:**
> **NEVER run `docker compose down -v`** in staging or production environments.
> The `-v` flag permanently deletes both `medinex_pgdata` (database state) and `medinex_uploads` (uploaded avatars and media variants), destroying persistent data.

### Uploaded Media Volume (`medinex_uploads`) Persistence, Backup & Restore
`medinex-backend` mounts the persistent named Docker volume `medinex_uploads` at `/app/uploads` (owned by `appuser:10001`). Local host `uploads/` and `backend/uploads/` directories are git-ignored, and pure-Java WebP/JPEG/PNG avatar decoding (`imageio-webp:3.13.1`) runs safely inside the Alpine JRE container.

```bash
# Backup medinex_uploads to a compressed tar archive
docker run --rm -v medinex_uploads:/source:ro -v "$(pwd)/backups:/backup" alpine \
  tar czf /backup/medinex_uploads_backup.tar.gz -C /source .

# Verify archive contents cleanly before restore
tar -tzf ./backups/medinex_uploads_backup.tar.gz

# Restore medinex_uploads non-destructively into the volume
docker run --rm -v medinex_uploads:/restore -v "$(pwd)/backups:/backup:ro" alpine \
  tar xzf /backup/medinex_uploads_backup.tar.gz -C /restore
```

---

## 3. Optional Service Profiles

MediNex uses Docker Compose profiles for resource-conscious deployments:

### Launching with Redis Caching
```bash
docker compose --profile cache up --build -d
```

### Launching with MinIO S3 Object Storage
```bash
docker compose --profile storage up --build -d
```

### Launching All Available Services
```bash
docker compose --profile cache --profile storage up --build -d
```

---

## 4. Automated Database Backup & Recovery Procedures

Automated cross-platform backup and restore scripts reside in `infrastructure/scripts/`:

### Automated Backup Execution

#### Linux / macOS:
```bash
chmod +x infrastructure/scripts/backup.sh
./infrastructure/scripts/backup.sh
```

#### Windows PowerShell:
```powershell
.\infrastructure\scripts\backup.ps1
```

The script executes a non-blocking `pg_dump`, compresses the output into `backups/medinex_backup_<TIMESTAMP>.sql.gz`, and automatically applies a 14-day backup retention policy.

### Automated Restore Execution

#### Linux / macOS:
```bash
chmod +x infrastructure/scripts/restore.sh
./infrastructure/scripts/restore.sh ./backups/medinex_backup_20261111_030000.sql.gz
```

#### Windows PowerShell:
```powershell
.\infrastructure\scripts\restore.ps1 -BackupFile ".\backups\medinex_backup_20261111_030000.sql"
```

---

## 5. DevSecOps & Container Hardening Guarantees

1. **Multi-Stage Builds:**
   - Backend: Maven builder caches dependencies before extracting Spring Boot layertools layers into minimal Eclipse Temurin JRE Alpine runtime.
   - Frontend: Node.js alpine builder caches dependencies, builds standalone output traces, and isolates the production runner.
2. **Unprivileged Non-Root Users:**
   - Backend runs as `appuser:10001` (`addgroup -g 10001 -S appgroup && adduser -u 10001 -S appuser`).
   - Frontend runs as `nextjs:10001` (`addgroup --system --gid 10001 nodejs && adduser --system --uid 10001 nextjs`).
3. **Network Boundary Isolation:**
   - PostgreSQL and internal services communicate via the bridge network `medinex-network`.
   - In production, remove the `ports:` mapping for `postgres` in `compose.yaml` to ensure zero public exposure.
4. **Health Checks & Startup Ordering:**
   - PostgreSQL runs `pg_isready -U medinex_user -d medinex_db`.
   - Backend waits for database health before starting (`depends_on: postgres: condition: service_healthy`).
   - Backend health probe monitors Actuator (`http://127.0.0.1:8081/actuator/health`).
   - Frontend health probe monitors Next.js server (`http://127.0.0.1:3000/`).
5. **Database Migration Consistency:**
   - Flyway runs automatically on backend boot (`spring.flyway.enabled=true`).
   - Checksum verification prevents untracked SQL alterations.

---

## 6. Rollback & Disaster Recovery Strategy

1. **Application Rollback:** Revert git commit and redeploy:
   ```bash
   git checkout <PREVIOUS_STABLE_COMMIT>
   docker compose up --build -d
   ```
2. **Database Rollback:**
   - Restore database from the most recent verified backup file using `infrastructure/scripts/restore.sh`.
   - Verify table integrity:
     ```bash
     docker exec medinex-postgres psql -U medinex_user -d medinex_db -c "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM posts;"
     ```
