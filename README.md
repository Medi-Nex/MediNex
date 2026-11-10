# MediNex — Healthcare Innovation Community Platform

> *"Healthcare Innovation. Connected Communities."*

[![E-Health Hackathon 2026](https://img.shields.io/badge/E--Health%20Hackathon-2026%20Contender-0D9488?style=for-the-badge&logo=medscape&logoColor=white)](https://github.com/Medi-Nex)
[![Java 21 LTS](https://img.shields.io/badge/Java-21%20LTS-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot 3.4](https://img.shields.io/badge/Spring%20Boot-3.4.3-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Next.js 16 App Router](https://img.shields.io/badge/Next.js-16%20App%20Router-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker Multi-Stage](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

---

## 1. Project Mission & Hackathon Context

**MediNex** is a production-grade web platform engineered for an interdisciplinary team of six contributors participating in **E-Health Hackathon 2026**.

The platform provides a dual architecture:
1. **The MediNex Public Community Platform:** An open collaboration ecosystem featuring verified contributor profiles, official team announcements, public project specifications, follower relationships, and discussion feeds.
2. **The ShasthoSetu Project:** An experimental telemedicine connectivity bridge engineered to connect grassroots rural clinics with specialized tele-consultations over low-bandwidth connections.

---

## 2. Non-Negotiable Project Rules & Governance

- **Zero Protected Health Information (PHI):** MediNex does **NOT** accept, index, or store patient medical records, personal health identifiers, prescriptions, or clinical diagnostic scans in public community databases.
- **Strict Data Segregation:** Social community features and ShasthoSetu telemedicine queues reside in separated logical domains. Social tokens cannot access clinical triage streams.
- **Honest Metrics & Transparency:** Contributor profiles and project milestones use verified placeholder records until confirmed by the team. No fake followers, hospital permissions, clinical trial claims, or hackathon awards are fabricated.
- **Real Database Persistence:** Powered by PostgreSQL 16 with Flyway schema migrations (V1 baseline + V2 performance indexes).

---

## 3. Technology Stack

- **Frontend:** Next.js 16 App Router, React 19, TypeScript (Strict Mode), Tailwind CSS, Lucide-React, Framer Motion, React Hook Form, Zod.
- **Backend:** Java 21 LTS, Spring Boot 3.4.3, Spring Security 6, Spring Data JPA, Hibernate, Flyway Migrations, JJWT, Springdoc OpenAPI 3 (Swagger).
- **Database:** PostgreSQL 16 Alpine with custom UUID and pgcrypto extensions.
- **DevOps:** Multi-Stage Dockerfiles, Docker Compose, non-root system users (`10001:10001`), persistent named volumes, isolated bridge network.
- **Local Tooling:** Mailpit (local SMTP email testing), Redis (optional cache profile), MinIO (optional S3 storage profile).

---

## 4. Visual Design System (HYBRID)

- **Dark Hero & Footer:** `#071A18` (Dark background), `#063D38` (Deep emerald).
- **Clean Light Content:** `#F7FAF9` (Content background), `#FFFFFF` (Card surfaces), `#12201E` (Primary text), `#64748B` (Muted slate), `#E2E8F0` (Border).
- **Accents:** `#0D9488` (Primary teal), `#5EEAD4` (Accent mint).
- **Typography:** Inter for English, Hind Siliguri for Bangla.

---

## 5. Route Directory (37 Routes)

### Public Routes:
- `/` — Premium landing page with hero, mission, and live metrics
- `/about` — MediNex mission, vision, values, and E-Health Hackathon story
- `/team` — Official six contributor profiles roster
- `/team/[username]` — Individual dynamic contributor profile with social graph
- `/projects` — Official projects directory
- `/projects/shasthosetu` — Flagship ShasthoSetu telemedicine bridge specification
- `/community` — Public community discourse feed with real-time post creation
- `/community/posts/[id]` — Shareable permalink discussion thread with nested replies
- `/updates` — Official team announcements and technical bulletins
- `/events` — Hackathon demonstration schedule and milestones
- `/contact` — Public inquiry and collaboration form
- `/privacy` — Healthcare governance and privacy policy
- `/terms` — Terms of service and community guidelines
- `/robots.txt` & `/sitemap.xml` — Search engine crawler directives

### Authentication Routes:
- `/login` — User authentication and token issuance
- `/register` — Account registration with email verification dispatch
- `/forgot-password` & `/reset-password` — Password recovery flow
- `/verify-email` — One-time token email verification

### Authenticated User Dashboard:
- `/dashboard` — User activity overview
- `/dashboard/profile` — Profile and skills management
- `/dashboard/following` — Relational follower network
- `/dashboard/notifications` — Notification alerts and badge counts
- `/dashboard/settings` — Privacy controls and blocklist manager

### Protected Admin Console (`/admin/**`):
- `/admin` — Overview with real DB statistics and audit event stream
- `/admin/users` — Paginated user accounts, status switches, and role toggles
- `/admin/team` — Official six contributor governance and display ordering
- `/admin/posts` — Feed moderation and hide/unhide toggling
- `/admin/comments` — Comment moderation
- `/admin/projects` — Project lifecycle governance (Planning to Completed)
- `/admin/media` — Media asset review and size tracking
- `/admin/reports` — Moderation ticket resolution queue
- `/admin/analytics` — Platform growth and safety analytics
- `/admin/audit-logs` — Immutable compliance audit trail
- `/admin/settings` — Runtime maintenance and zero-PHI warning configuration

---

## 6. Quick Start Guide

### Option A: Running with Docker Compose (Recommended)

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Build and start core containers
docker compose up --build -d

# 3. Check health status of all services
docker compose ps

# 4. Stream live container logs
docker compose logs -f

# 5. Stop services (preserves persistent database volumes)
docker compose down
```

> [!CAUTION]
> Never execute `docker compose down -v` in staging or production. The `-v` flag permanently removes named Docker volumes (`medinex_pgdata`), destroying database persistence.

### Option B: Running with Local Developer Tools

#### Backend API (Java 21 & Maven):
```bash
cd backend
mvn test
mvn spring-boot:run
```
- API Gateway: `http://localhost:8080/api/v1`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Actuator Health: `http://localhost:8081/actuator/health`

#### Frontend Web App (Next.js & Node 22+):
```bash
cd frontend
npm install
npm test
npm run build
npm run dev
```
- Web Application: `http://localhost:3000`

---

## 7. Testing & Quality Assurance Summary

| Test Suite | Framework | Count | Execution Time | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Backend Integration & Unit** | JUnit 5 / MockMvc / Spring Boot | **37 tests** | 38s | **100% PASS** |
| **Frontend Unit & Governance** | Node.js Test Runner | **5 tests** | 88ms | **100% PASS** |
| **Frontend Static Analysis** | ESLint Strict | 37 routes | 5s | **0 Errors, 0 Warnings** |
| **Frontend Production Build** | Next.js 16 App Router | 37 routes | 1.2s | **37 Prerendered** |

---

## 8. Required Documentation Index

- [`README.md`](README.md) — Platform overview, tech stack, and quickstart guide.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — System architecture diagrams, component interactions, and data segregation principles.
- [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) — Complete ERD, table definitions, and Flyway V1 & V2 migrations.
- [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md) — Comprehensive OpenAPI / REST documentation with request/response schemas.
- [`SECURITY.md`](SECURITY.md) — DevSecOps policies, Zero-PHI enforcement, RBAC matrix, and security headers.
- [`DEPLOYMENT.md`](DEPLOYMENT.md) — Docker Compose production deployment, backup/restore scripts, and health checks.
- [`ENVIRONMENT_VARIABLES.md`](ENVIRONMENT_VARIABLES.md) — Exhaustive configuration reference for frontend and backend.
- [`TESTING.md`](TESTING.md) — Quality assurance report, test execution commands, and orchestrated E2E user journey.
- [`IMPLEMENTATION_REPORT.md`](IMPLEMENTATION_REPORT.md) — Master implementation report detailing Phases 0 through 7.
