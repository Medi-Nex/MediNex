# MediNex — Healthcare Innovation Community Platform

> *"Healthcare Innovation. Connected Communities."*

[![E-Health Hackathon 2026](https://img.shields.io/badge/E--Health%20Hackathon-2026%20Contender-teal)](https://github.com/Medi-Nex)
[![Java 21 LTS](https://img.shields.io/badge/Java-21%20LTS-0D9488?logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot 3.4](https://img.shields.io/badge/Spring%20Boot-3.4.3-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Next.js 15 App Router](https://img.shields.io/badge/Next.js-15%20App%20Router-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker Multi-Stage](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

---

## 1. Project Mission & Hackathon Context

**MediNex** is a production-oriented web platform built for a six-contributor healthcare innovation squad participating in **E-Health Hackathon 2026**.

The platform provides a dual architecture:
1. **The MediNex Public Community Platform:** An open collaboration ecosystem featuring contributor profiles, official team announcements, public project specifications, follower relationships, and discussion feeds.
2. **The ShasthoSetu Project:** An experimental telemedicine connectivity bridge engineered to connect grassroots rural clinics with specialized tele-consultations over low-bandwidth connections.

---

## 2. Non-Negotiable Governance & Data Separation

- **Zero Protected Health Information (PHI):** MediNex does **NOT** accept, index, or store patient medical records, personal health identifiers, prescriptions, or clinical diagnostic scans in public community databases.
- **Strict Data Segregation:** Social community features and ShasthoSetu telemedicine queues reside in separated logical domains. Social tokens cannot access clinical triage streams.
- **Honest Metrics & Transparency:** Contributor profiles and project milestones use verified placeholder records until confirmed by the team. No fake followers, hospital permissions, clinical trial claims, or hackathon awards are fabricated.

---

## 3. Technology Stack

- **Frontend:** Next.js 15 App Router, React 19, TypeScript (Strict Mode), Tailwind CSS, Lucide-React, Framer Motion, React Hook Form, Zod.
- **Backend:** Java 21 LTS, Spring Boot 3.4.3, Spring Security 6, Spring Data JPA, Hibernate, Flyway Migrations, JJWT, Springdoc OpenAPI 3 (Swagger).
- **Database:** PostgreSQL 16 Alpine.
- **DevOps:** Multi-Stage Dockerfiles, Docker Compose, non-root system users (`10001:10001`), persistent named volumes, isolated bridge network.
- **Local Tooling:** Mailpit (local SMTP email testing), Redis (optional cache profile), MinIO (optional S3 storage profile).

---

## 4. Visual Design System (HYBRID)

- **Dark Hero & Footer:** `#071A18` (Dark background), `#063D38` (Deep emerald).
- **Clean Light Content:** `#F7FAF9` (Content background), `#FFFFFF` (Card surfaces), `#12201E` (Primary text), `#64748B` (Muted slate), `#E2E8F0` (Border).
- **Accents:** `#0D9488` (Primary teal), `#5EEAD4` (Accent mint).
- **Typography:** Inter for English, Hind Siliguri for Bangla.

---

## 5. Quick Start Guide

### Option A: Running with Local Developer Tools

#### 1. Backend API (Java 21 & Maven)
```bash
cd backend
mvn test
mvn spring-boot:run
```
- API Gateway: `http://localhost:8080/api/v1`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Health check: `http://localhost:8081/actuator/health`

#### 2. Frontend Web App (Next.js & Node 22+)
```bash
cd frontend
npm install
npm run build
npm run dev
```
- Web Application: `http://localhost:3000`

---

### Option B: Running with Docker Compose

Ensure Docker Engine is running, then execute:

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Build and start core containers
docker compose up --build -d

# 3. Check health status
docker compose ps

# 4. View logs
docker compose logs -f

# 5. Stop services (preserves database volumes)
docker compose down
```

> [!CAUTION]
> Never execute `docker compose down -v` unless you intentionally want to delete persistent PostgreSQL database volumes.

---

## 6. Project Documentation Index

- [Architecture Specification (ARCHITECTURE.md)](ARCHITECTURE.md)
- [Database Schema & ERD (DATABASE_SCHEMA.md)](DATABASE_SCHEMA.md)
- [REST API Documentation (API_DOCUMENTATION.md)](API_DOCUMENTATION.md)
- [Security & Compliance Architecture (SECURITY.md)](SECURITY.md)
- [Deployment & Operations Runbook (DEPLOYMENT.md)](DEPLOYMENT.md)
- [Environment Variables Guide (ENVIRONMENT_VARIABLES.md)](ENVIRONMENT_VARIABLES.md)
- [Quality Assurance & Test Suite (TESTING.md)](TESTING.md)
- [Phase 0 & 1 Implementation Report (IMPLEMENTATION_REPORT.md)](IMPLEMENTATION_REPORT.md)
- [Docker Infrastructure Guide (infrastructure/docker/README.md)](infrastructure/docker/README.md)
