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

## Public Team Endpoints

### 1. Get All Six Team Contributor Profiles
- **Endpoint:** `GET /api/v1/team/members`
- **Access:** Public (No authorization required)
- **Response:** Array of six `TeamMemberDto` objects ordered by `displayOrder` ascending.

#### Sample Response:
```json
{
  "success": true,
  "message": "Fetched 6 team contributor profiles",
  "data": [
    {
      "id": "mem-01",
      "username": "contributor-01",
      "fullName": "Contributor 01 [Placeholder]",
      "designation": "Team Lead & Systems Architect",
      "department": "Computer Science & Engineering",
      "university": "University Engineering Department [Pending Verification]",
      "bio": "Placeholder profile for Team Contributor 1...",
      "skills": ["Distributed Systems", "Java Spring Boot", "PostgreSQL"],
      "responsibilities": ["Platform architecture", "Data isolation oversight"],
      "githubUrl": "https://github.com",
      "linkedinUrl": "https://linkedin.com",
      "isLead": true,
      "isPlaceholder": true,
      "publicVisibility": true,
      "verifiedJoinDate": "2026-01-15",
      "displayOrder": 1
    }
  ]
}
```

### 2. Get Contributor Profile by Username
- **Endpoint:** `GET /api/v1/team/members/{username}`
- **Access:** Public
- **Path Variable:** `username` (e.g. `contributor-01`)
- **Response:** Single `TeamMemberDto`

### 3. Update Contributor Profile
- **Endpoint:** `PUT /api/v1/team/members/{username}`
- **Access:** Authenticated / Team Admin
- **Description:** Replaces placeholder information with real, verified credentials.

---

## Projects Endpoints

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
| `401 Unauthorized` | Unauthenticated | Missing or expired JWT access token |
| `403 Forbidden` | Access Denied | User lacks role authority (e.g. non-admin attempting admin update) |
| `404 Not Found` | Not Found | Contributor or project identifier does not exist |
| `500 Server Error` | Internal Failure | Unhandled server exception with tracked UUID |
