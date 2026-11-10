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

## Follow & Network Endpoints

### 1. Follow User
- **Endpoint:** `POST /api/v1/users/{username}/follow`
- **Access:** Authenticated (`BearerAuth`)
- **Behavior:**
  - Public profile: Direct follow relationship created; `NEW_FOLLOWER` notification dispatched to target.
  - Private profile (`isPublicVisible = false`): `FollowRequest` created with status `PENDING`; `FOLLOW_REQUEST` notification dispatched.
  - Self-follow: Rejected with `400 Bad Request`.
  - Mutual block: Interaction rejected with `400 Bad Request`.

### 2. Unfollow User
- **Endpoint:** `DELETE /api/v1/users/{username}/follow`
- **Access:** Authenticated (`BearerAuth`)
- **Behavior:** Removes follow relationship and purges any pending follow requests.

### 3. Get User Follow Stats
- **Endpoint:** `GET /api/v1/users/{username}/follow-stats`
- **Access:** Public (context-aware if authenticated)
- **Response:**
  ```json
  {
    "followerCount": 14,
    "followingCount": 5,
    "isFollowing": true,
    "hasPendingRequest": false,
    "isBlocked": false,
    "isSelf": false
  }
  ```

### 4. Get User Followers & Following
- **Endpoint:** `GET /api/v1/users/{username}/followers`
- **Endpoint:** `GET /api/v1/users/{username}/following`
- **Access:** Public
- **Query Params:** `page` (default: 0), `size` (default: 20)

### 5. Follow Official MediNex Team
- **Endpoint:** `POST /api/v1/team/follow`
- **Access:** Authenticated (`BearerAuth`)
- **Behavior:** Inserts record into `team_follows`.

### 6. Unfollow Official MediNex Team
- **Endpoint:** `DELETE /api/v1/team/follow`
- **Access:** Authenticated (`BearerAuth`)

### 7. Get Official Team Follow Stats & Followers
- **Endpoint:** `GET /api/v1/team/follow-stats`
- **Endpoint:** `GET /api/v1/team/followers`
- **Access:** Public

### 8. User Blocking & Unblocking
- **Endpoint:** `POST /api/v1/users/{username}/block`
- **Endpoint:** `DELETE /api/v1/users/{username}/block`
- **Access:** Authenticated (`BearerAuth`)
- **Behavior:** Mutual block enforcement. Blocking severs all existing follow relationships in both directions and cancels any pending requests.

### 9. Private Account Follow Requests
- **Endpoint:** `GET /api/v1/users/follow-requests` (List incoming requests)
- **Endpoint:** `POST /api/v1/users/follow-requests/{id}/accept`
- **Endpoint:** `POST /api/v1/users/follow-requests/{id}/reject`
- **Access:** Authenticated (`BearerAuth`)

---

## Community Feed & Social Platform (`/api/v1/community`)

### 1. Public Community Feed
- **Endpoint:** `GET /api/v1/community/feed`
- **Access:** Public (context-aware if authenticated)
- **Query Params:** `page` (default: 0), `size` (default: 15)
- **Behavior:**
  - Anonymous viewers receive posts with `visibility = PUBLIC`.
  - Authenticated viewers receive `PUBLIC` and `MEMBERS_ONLY` posts.
  - Automatically excludes hidden, soft-deleted, and mutually blocked accounts.
  - Pinned/official announcements are returned first.

### 2. Get Post by ID
- **Endpoint:** `GET /api/v1/community/posts/{id}`
- **Access:** Public (context-aware if authenticated)

### 3. Get User Posts
- **Endpoint:** `GET /api/v1/community/users/{username}/posts`
- **Access:** Public (context-aware if authenticated)
- **Query Params:** `page` (default: 0), `size` (default: 15)

### 4. Create Post
- **Endpoint:** `POST /api/v1/community/posts`
- **Access:** Authenticated (`BearerAuth`)
- **Payload:**
  ```json
  {
    "content": "Exploring rural health triage bridge architectures.",
    "visibility": "PUBLIC",
    "mediaUrls": ["https://example.org/images/triage.png"],
    "isOfficialAnnouncement": false
  }
  ```

### 5. Update Post
- **Endpoint:** `PUT /api/v1/community/posts/{id}`
- **Access:** Post Owner or Admin (`BearerAuth`)

### 6. Delete Post
- **Endpoint:** `DELETE /api/v1/community/posts/{id}`
- **Access:** Post Owner or Admin (`BearerAuth`)
- **Behavior:** Soft delete (`deleted_at = CURRENT_TIMESTAMP`).

### 7. Toggle Post Like
- **Endpoint:** `POST /api/v1/community/posts/{id}/like`
- **Access:** Authenticated (`BearerAuth`)
- **Behavior:** Idempotent toggle. Automatically dispatches `POST_LIKE` notification to the post author.
- **Response:** `{ "isLiked": true, "likesCount": 6 }`

### 8. Get Post Comments
- **Endpoint:** `GET /api/v1/community/posts/{id}/comments`
- **Access:** Public (context-aware if authenticated)
- **Query Params:** `page` (default: 0), `size` (default: 20)
- **Response:** Paginated top-level comments with eager nested replies.

### 9. Add Comment / Reply
- **Endpoint:** `POST /api/v1/community/posts/{id}/comments`
- **Access:** Authenticated (`BearerAuth`)
- **Payload:**
  ```json
  {
    "content": "Have you evaluated bandwidth consumption under 2G edge conditions?",
    "parentCommentId": null
  }
  ```
- **Behavior:** Increments post `comments_count`. If `parentCommentId` is supplied, dispatches `COMMENT_REPLY` notification; otherwise dispatches `COMMENT` notification.

### 10. Delete Comment
- **Endpoint:** `DELETE /api/v1/community/comments/{commentId}`
- **Access:** Comment Owner or Admin (`BearerAuth`)
- **Behavior:** Soft delete and decrements post `comments_count`.

### 11. Toggle Comment Like
- **Endpoint:** `POST /api/v1/community/comments/{commentId}/like`
- **Access:** Authenticated (`BearerAuth`)

---

## Notifications Endpoints (`/api/v1/notifications`)

### 1. List Notifications
- **Endpoint:** `GET /api/v1/notifications`
- **Access:** Authenticated (`BearerAuth`)
- **Query Params:** `page` (default: 0), `size` (default: 20)
- **Response:** Paginated array of notifications sorted newest-first.

### 2. Unread Notification Count
- **Endpoint:** `GET /api/v1/notifications/unread-count`
- **Access:** Authenticated (`BearerAuth`)
- **Response:** `{ "unreadCount": 3 }`

### 3. Mark Notification as Read
- **Endpoint:** `PATCH /api/v1/notifications/{id}/read`
- **Access:** Authenticated (`BearerAuth`)

### 4. Mark All Notifications as Read
- **Endpoint:** `POST /api/v1/notifications/read-all`
- **Access:** Authenticated (`BearerAuth`)

---

## Moderation & Safety Endpoints

### 1. Report User / Profile
- **Endpoint:** `POST /api/v1/users/{username}/report`
- **Access:** Authenticated (`BearerAuth`)
- **Payload:**
  ```json
  {
    "reason": "HARASSMENT",
    "details": "User behavior violates community safety guidelines",
    "reportedPostId": null,
    "reportedCommentId": null
  }
  ```

---

## Administration & Audit Console Endpoints (`/api/v1/admin`)
Access restricted to users with `ROLE_ADMIN` or `ROLE_SUPER_ADMIN`. All mutations automatically generate append-only audit entries.

### 1. Real Dashboard Metrics
- **Endpoint:** `GET /api/v1/admin/stats`
- **Access:** Admin (`ROLE_ADMIN`, `ROLE_SUPER_ADMIN`)
- **Response:**
  ```json
  {
    "success": true,
    "message": "Admin dashboard statistics retrieved",
    "data": {
      "totalUsers": 14,
      "totalTeamFollowers": 8,
      "totalMemberFollowers": 22,
      "totalPosts": 31,
      "pendingReportsCount": 2,
      "totalAuditLogs": 67
    }
  }
  ```

### 2. Paginated User Management
- **Endpoint:** `GET /api/v1/admin/users`
- **Access:** Admin
- **Query Params:** `page`, `size`
- **Response:** Paginated list of registered users with full profile, roles, and status.

### 3. Update User Status & Security Roles
- **Endpoint:** `PUT /api/v1/admin/users/{id}`
- **Access:** Admin (SUPER_ADMIN required to modify another SUPER_ADMIN)
- **Request Body (`AdminUserUpdateDto`):**
  ```json
  {
    "status": "ACTIVE",
    "roles": ["ROLE_USER", "ROLE_MODERATOR"],
    "isTeamMember": true
  }
  ```
- **Response:** Updated `UserDto`.
- **Side Effect:** Emits `ADMIN_USER_UPDATED` immutable audit log.

### 4. Moderation Reports Queue
- **Endpoint:** `GET /api/v1/admin/reports`
- **Access:** Admin
- **Query Params:** `status` (`PENDING`, `RESOLVED`, `DISMISSED`), `page`, `size`
- **Response:** Paginated array of `ReportDto` with target post/comment/user details.

### 5. Resolve Moderation Ticket
- **Endpoint:** `POST /api/v1/admin/reports/{id}/resolve`
- **Access:** Admin
- **Request Body (`AdminReportResolutionRequest`):**
  ```json
  {
    "status": "RESOLVED",
    "resolutionNotes": "Verified guideline infringement. Post hidden and user issued formal warning.",
    "action": "HIDE_POST"
  }
  ```
- **Supported Actions:** `HIDE_POST`, `HIDE_COMMENT`, `SUSPEND_USER`, `NONE`.
- **Side Effect:** Automatically sets post/comment `hidden = true` or user status `SUSPENDED`, and writes `REPORT_RESOLVED` audit log.

### 6. Moderate Post
- **Endpoint:** `PATCH /api/v1/admin/posts/{id}/moderate`
- **Access:** Admin
- **Request Body (`ModerateContentRequest`):**
  ```json
  {
    "isHidden": true,
    "reason": "Violates safety policy"
  }
  ```

### 7. Moderate Comment
- **Endpoint:** `PATCH /api/v1/admin/comments/{id}/moderate`
- **Access:** Admin
- **Request Body (`ModerateContentRequest`):**
  ```json
  {
    "isHidden": true,
    "reason": "Spam content"
  }
  ```

### 8. Immutable System Audit Logs
- **Endpoint:** `GET /api/v1/admin/audit-logs`
- **Access:** Admin
- **Query Params:** `page`, `size`
- **Response:** Paginated append-only list of security and administrative operations with UTC timestamp, actor email, action, target entity, target UUID, and IP address.

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
