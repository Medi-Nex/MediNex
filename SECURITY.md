# MediNex Security Architecture & Hardening Guide

## 1. Zero Medical Data Storage Policy

MediNex enforces an absolute security boundary:
- **No Protected Health Information (PHI):** No electronic medical records (EMR), hospital admission slips, physician diagnostic notes, patient names, national IDs, or laboratory values are ever accepted, stored, or transmitted via the public community platform database.
- **Physical & Logical Boundary:** The public social modules (`users`, `posts`, `comments`, `follows`) are decoupled from experimental telemedicine prototypes like ShasthoSetu.
- **Data Retention & Purging:** User account deletion triggers cascade purges of personal profile identifiers and cryptographic tokens.

---

## 2. Authentication & Credential Architecture

- **Password Hashing:** Passwords are never stored in plaintext. They are salted and hashed using **BCrypt** with an adaptive work factor of 12 (or Argon2id).
- **Stateless Access Tokens (JWT):** Short-lived access tokens (15-minute expiration window) signed with HMAC-SHA256 (256-bit or 512-bit secure secret key).
- **Rotating Refresh Tokens:** Long-lived tokens (7-day duration) stored as cryptographic hashes in the `refresh_tokens` table. Used tokens are immediately invalidated to detect replay attacks.
- **Cookie Security Flags:** Where cookie delivery is utilized, cookies are marked `HttpOnly`, `Secure`, and `SameSite=Strict`.

---

## 3. Defense Against OWASP Top 10

| Attack Vector | Defense Mechanism in MediNex |
| :--- | :--- |
| **A01: Broken Access Control** | Declarative Spring Method Security (`@PreAuthorize`), user ID ownership validation on posts and comments, role-based filters on `/api/v1/admin/**`. |
| **A02: Cryptographic Failures** | TLS 1.3 in transit, BCrypt password hashing, SHA-256 token hashing, strict `.env` secret management. |
| **A03: Injection (SQL / Command)** | 100% Parameterized queries via Hibernate / Spring Data JPA. Zero raw dynamic SQL concatenation. |
| **A04: Insecure Design** | Strict segregation between social community features and healthcare workflows. Verified placeholder states preventing unauthorized claims. |
| **A05: Security Misconfiguration** | Spring Boot Actuator endpoints restricted to management port (`8081`). Flyway versioned migrations prevent schema drift. |
| **A06: Vulnerable Components** | Pinned dependency versions in `pom.xml` and `package.json`. Regular `npm audit` and Dependabot scanning. |
| **A07: Identification & Auth** | Rate-limiting on auth routes, email verification requirement before posting, expiring password reset tokens. |
| **A08: Software & Data Integrity** | Multi-stage Docker builds without baking secrets, Flyway checksum validation, non-root user execution. |
| **A09: Security Logging & Monitoring** | Immutable `audit_logs` table tracking user logins, role modifications, and admin moderation events. |
| **A10: Server-Side Request Forgery** | External URL fetching strictly disallowed on backend endpoints without domain allowlisting. |

---

## 4. Container & Operating System Hardening

- Application containers run as unprivileged users:
  - Frontend: `nextjs:10001`
  - Backend: `appuser:10001`
- Minimal base images: `eclipse-temurin:21-jre-alpine` and `node:22-alpine`.
- PostgreSQL is restricted to the internal Docker bridge network (`medinex-network`) and is not exposed to public network interfaces in production.
