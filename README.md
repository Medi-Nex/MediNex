# MediNex — Healthcare Innovation & Technology Platform

> *"Connecting Technology, Research & Healthcare Innovation."*

[![Healthcare Technology Platform](https://img.shields.io/badge/MediNex-Health%20Tech%20Platform-0D9488?style=for-the-badge&logo=medscape&logoColor=white)](https://github.com/Medi-Nex)
[![Java 21 LTS](https://img.shields.io/badge/Java-21%20LTS-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot 3.4](https://img.shields.io/badge/Spring%20Boot-3.4.3-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Next.js 16 App Router](https://img.shields.io/badge/Next.js-16%20App%20Router-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker Multi-Stage](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

---

## 1. Platform Identity & Collaborative Mission

**MediNex** is a collaborative healthcare technology platform where developers, researchers, and public health professionals explore ideas, build innovative solutions, and collaborate on technology-driven healthcare initiatives (initially incubated during E-Health Hackathon 2026).

> **Important Positioning Clarification:** MediNex is NOT a telemedicine service provider, doctor consultation marketplace, clinic, or hospital management system.

The platform provides a dual architecture:
1. **The MediNex Public Community Platform:** An open collaboration ecosystem featuring contributor profiles, official announcements, project specifications, follower relationships, and healthcare technology discussion feeds.
2. **The ShasthoSetu Project (Featured Initiative):** An interoperable digital health record and exchange platform prototype exploring standardized health data structures, HL7 FHIR alignment, consent workflows, and RBAC.

---

## 2. Non-Negotiable Project Rules & Governance

- **Zero Protected Health Information (PHI):** MediNex does **NOT** accept, index, or store patient medical records, personal health identifiers, prescriptions, or clinical diagnostic scans in public community databases.
- **Strict Data Segregation:** Community social interactions and ShasthoSetu health-record interoperability prototypes reside in separated logical domains. Social tokens grant zero privilege to clinical record pipelines.
- **Honest Metrics & Transparency:** Implemented capabilities, working prototypes, research concepts, and long-term vision are strictly separated. No fake followers, hospital integrations, regulatory approvals, or clinical trial claims are fabricated.
- **Real Database Persistence:** Powered by PostgreSQL 16 with deterministic Flyway schema migrations (`V1`–`V6`, including privacy, OTP security, and contributor least-privilege enforcement).

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
- `/about` — MediNex mission, vision, values, and initiative background
- `/team` — Core multidisciplinary contributor profiles roster
- `/team/[username]` — Individual dynamic contributor profile with social graph
- `/users/[username]` — Public and privacy-enforced community profile view
- `/projects` — Official projects directory
- `/projects/shasthosetu` — Featured ShasthoSetu interoperable health record & exchange architecture
- `/community` — Public community discourse feed with real-time post creation
- `/community/posts/[id]` — Shareable permalink discussion thread with nested replies
- `/updates` — Official team announcements and technical bulletins
- `/events` — Platform milestones, demonstrations, and technical events
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
| **Backend Integration & Unit** | JUnit 5 / MockMvc / Spring Boot | **60 tests (12 classes)** | ~89s | **100% PASS** |
| **Frontend Unit & Governance** | Node.js Test Runner | **7 tests** | ~142ms | **100% PASS** |
| **Frontend Static Analysis** | ESLint (`npm run lint`) & `tsc --noEmit` | 37 routes | ~6s | **0 Errors, 0 Warnings** |
| **Frontend Production Build** | Next.js 16 App Router | 37 routes | ~11s | **37 Compiled** |

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
