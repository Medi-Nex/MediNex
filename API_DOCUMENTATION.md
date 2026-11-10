# MediNex REST API Documentation

## Base Information

- **Base URL:** `/api/v1`
- **Swagger / OpenAPI UI:** `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON Spec:** `http://localhost:8080/v3/api-docs`
- **Response Format:** Standard JSON envelope `com.medinex.common.api.ApiResponse<T>`

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "errors": null,
  "timestamp": "2026-02-10T12:00:00Z"
}
```

---

## Authentication & Identity Endpoints (`/api/v1/auth`)

### 1. Register Community Member
- **Endpoint:** `POST /api/v1/auth/register`
- **Access:** Public
- **Request Body (`RegisterRequest`):**
  ```json
  {
    "fullName": "Dr. Sarah Khan",
    "username": "sarahkhan",
    "email": "sarah@medinex.health",
    "password": "SecurePassword2026!",
    "agreeTerms": true
  }
  ```
- **Response:** HTTP `201 Created` with `UserDto` (initial status: `PENDING_VERIFICATION`).
- **Side Effect:** Automatically creates one-time `EmailVerificationToken` and dispatches email via Mailpit.

### 2. Login & Token Issuance
- **Endpoint:** `POST /api/v1/auth/login`
- **Access:** Public
- **Request Body (`LoginRequest`):**
  ```json
  {
    "emailOrUsername": "admin@medinex.health",
    "password": "Admin@SecurePass2026!"
  }
  ```
- **Response:** HTTP `200 OK` with `AuthResponse`:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
      "refreshToken": "g8k3Hj9F4...",
      "tokenType": "Bearer",
      "expiresIn": 900,
      "user": {
        "id": "7b3b4f62-3788-4e89-8d69-c2901dbd5671",
        "username": "medinex-admin",
        "email": "admin@medinex.health",
        "fullName": "MediNex Lead Administrator",
        "status": "ACTIVE",
        "emailVerified": true,
        "isTeamMember": true,
        "roles": ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_USER"]
      }
    }
  }
  ```

### 3. Rotate Refresh Token
- **Endpoint:** `POST /api/v1/auth/refresh`
- **Access:** Public (Requires valid unrevoked Refresh Token)
- **Request Body:**
  ```json
  {
    "refreshToken": "g8k3Hj9F4..."
  }
  ```
- **Response:** Revokes existing refresh token and issues a new access token paired with a newly rotated refresh token.

### 4. Logout & Token Revocation
- **Endpoint:** `POST /api/v1/auth/logout`
- **Access:** Public / Authenticated
- **Request Body:**
  ```json
  {
    "refreshToken": "g8k3Hj9F4..."
  }
  ```
- **Response:** HTTP `200 OK`. Immediately marks the refresh token `revoked = true` in PostgreSQL.

### 5. Email Verification
- **Endpoint:** `POST /api/v1/auth/verify-email`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "token": "849201a4b9c1d2e3"
  }
  ```
- **Response:** Updates account status to `ACTIVE` and sets `email_verified = true`.

### 6. Forgot Password
- **Endpoint:** `POST /api/v1/auth/forgot-password`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "user@domain.org"
  }
  ```
- **Response:** Dispatches 1-hour expiring reset token via email.

### 7. Reset Password
- **Endpoint:** `POST /api/v1/auth/reset-password`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "token": "token_string_here",
    "newPassword": "NewStrongPassword2026!"
  }
  ```
- **Response:** Re-hashes password with BCrypt, invalidates reset token, and revokes all active refresh sessions.

### 8. Get Authenticated User (`/me`)
- **Endpoint:** `GET /api/v1/auth/me`
- **Access:** Authenticated (`Bearer <token>`)
- **Response:** Current authenticated `UserDto`.

---

## User & Profile Endpoints (`/api/v1/users`)

### 1. Get Public Profile by Username
- **Endpoint:** `GET /api/v1/users/{username}`
- **Access:** Public
- **Response:** `UserDto` containing public profile data.

### 2. Update Profile Details
- **Endpoint:** `PUT /api/v1/users/profile`
- **Access:** Authenticated (`Bearer <token>`)
- **Request Body:**
  ```json
  {
    "fullName": "Sarah Khan, M.Sc.",
    "headline": "Health Informatics Specialist",
    "designation": "Researcher",
    "department": "Biomedical Engineering",
    "university": "Faculty of Engineering",
    "bio": "Researching rural telemedicine interoperability...",
    "skills": ["FHIR", "Java", "Next.js", "PostgreSQL"],
    "portfolioUrl": "https://sarahkhan.org",
    "githubUrl": "https://github.com/sarahkhan",
    "linkedinUrl": "https://linkedin.com/in/sarahkhan"
  }
  ```
- **Response:** Updated profile record.

---

## Public Team Endpoints (`/api/v1/team`)

### 1. Get All Six Team Contributor Profiles
- **Endpoint:** `GET /api/v1/team/members`
- **Access:** Public
- **Response:** Array of six `TeamMemberDto` objects ordered by `displayOrder` ascending.

### 2. Get Contributor Profile by Username
- **Endpoint:** `GET /api/v1/team/members/{username}`
- **Access:** Public
- **Path Variable:** `username` (e.g. `contributor-01`)
- **Response:** Single `TeamMemberDto`.

### 3. Update Contributor Profile
- **Endpoint:** `PUT /api/v1/team/members/{username}`
- **Access:** Authorized Team Admin
- **Description:** Replaces placeholder information with real, verified credentials.

---

## Projects Endpoints (`/api/v1/projects`)

### 1. List Projects
- **Endpoint:** `GET /api/v1/projects`
- **Access:** Public
- **Response:** List of official initiatives (including `ShasthoSetu`).

### 2. Get Project by Slug
- **Endpoint:** `GET /api/v1/projects/{slug}`
- **Access:** Public
- **Path Variable:** `slug` (e.g. `shasthosetu`)
- **Response:** Project specifications, stage (`DEVELOPMENT`), problem statement, proposed solution, and feature breakdown.

### 3. Update Project
- **Endpoint:** `PUT /api/v1/projects/{slug}`
- **Access:** Authorized Project Lead / Admin
- **Payload:** Updated project summary, features, or stage.

---

## Status and Error Codes

| HTTP Status | Meaning | Scenario |
| :--- | :--- | :--- |
| `200 OK` | Success | Successful read or update operation |
| `201 Created` | Created | Resource successfully persisted |
| `400 Bad Request` | Validation Error | Field validation failure or malformed payload |
| `401 Unauthorized` | Unauthenticated | Missing, expired, or invalid JWT access token |
| `403 Forbidden` | Access Denied | User lacks role authority (e.g. non-admin attempting admin update) |
| `404 Not Found` | Not Found | Contributor or project identifier does not exist |
| `409 Conflict` | Conflict | Duplicate username or email address |
| `500 Server Error` | Internal Failure | Unhandled server exception with tracked UUID |
