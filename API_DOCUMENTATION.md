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
- **Response:** HTTP `201 Created` with `UserDto` (initial status: `PENDING_VERIFICATION`, exclusively assigned `ROLE_USER` — privileged roles cannot be self-assigned).
- **Side Effect:** Automatically creates a one-time expiring 6-digit numeric OTP in `email_verification_tokens` and dispatches email via configured SMTP (`EmailService`, raw OTP redacted from logs).

### 1a. Resend Verification OTP
- **Endpoint:** `POST /api/v1/auth/resend-verification`
- **Access:** Public
- **Request Body (`ResendVerificationRequest`):**
  ```json
  {
    "email": "sarah@medinex.health"
  }
  ```
- **Response:** HTTP `200 OK`. Enforces a 120-second cooldown (`429 Too Many Requests`) after successful dispatch; if transient SMTP delivery fails, returns `503 Service Unavailable` and rolls back the pending token/timestamp so the user can retry without being trapped in a cooldown.

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
- **Request Body (`VerifyEmailRequest`):**
  ```json
  {
    "email": "sarah@medinex.health",
    "otp": "849201"
  }
  ```
- **Notes:** Accepts 6-digit numeric `otp` (with `token` supported via `@JsonAlias("token")`). Locks the verification token after 5 invalid attempts and clears previous verification state on success, transitioning account status to `ACTIVE` and `emailVerified = true`.

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
- **Access:** Authenticated (`Bearer <token>`); anonymous requests return `401 Unauthorized`.
- **Response:** Current authenticated `UserDto`.

### 9. Change Password
- **Endpoint:** `POST /api/v1/auth/change-password`
- **Access:** Authenticated (`Bearer <token>`)
- **Request Body:**
  ```json
  {
    "currentPassword": "CurrentPassword123!",
    "newPassword": "BrandNewSecurePassword2026!"
  }
  ```
- **Response:** HTTP `200 OK`. Re-hashes password with BCrypt, revokes all active refresh tokens for session security, and emits `PASSWORD_CHANGED` audit log.

---

## User & Profile Endpoints (`/api/v1/users`)

### 1. Get Profile by Username (Privacy-Enforced)
- **Endpoint:** `GET /api/v1/users/{username}`
- **Access:** Context-aware (`Public` when `profile.isPublicVisible = true`; otherwise `Bearer <token>` of profile owner or an accepted follower). Case-insensitive username lookup (`findByUsernameIgnoreCase`).
- **Response:** HTTP `200 OK` with public `UserDto` (`email` omitted). Returns HTTP `403 Forbidden` when the target profile is private (`isPublicVisible = false`) and the viewer is anonymous, pending, or not an accepted follower, or when a mutual block exists.

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
    "bio": "Researching HL7 FHIR healthcare interoperability schemas...",
    "skills": ["FHIR", "Java", "Next.js", "PostgreSQL"],
    "portfolioUrl": "https://sarahkhan.org",
    "githubUrl": "https://github.com/sarahkhan",
    "linkedinUrl": "https://linkedin.com/in/sarahkhan",
    "isPublicVisible": true
  }
  ```
- **Response:** Updated profile record.

### 3. Upload / Delete Multi-Resolution Profile Avatar
- **Upload Endpoint:** `POST /api/v1/users/profile/avatar` (`multipart/form-data`, field `"file"`)
- **Delete Endpoint:** `DELETE /api/v1/users/profile/avatar`
- **Access:** Authenticated (`Bearer <token>`)
- **Behavior:** Validates file size (<= 5 MB), decodes JPEG, PNG, or WebP (`imageio-webp`) bytes safely in pure Java, center-crops and strips metadata, and persists 64px (`-sm.jpg`), 256px (`-md.jpg`), and 512px (`-lg.jpg`) variants under `/app/uploads/avatars/{userId}/` (`medinex_uploads` persistent Docker volume). Deletes prior variants cleanly.

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
- **Access:** Privacy-enforced (`Public` if `isPublicVisible = true`; otherwise owner or accepted follower only; returns `403 Forbidden` when private or mutually blocked).
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
- **Endpoint:** `GET /api/v1/users/blocks` (List blocked users for authenticated user)
- **Access:** Authenticated (`BearerAuth`)
- **Behavior:** Mutual block enforcement. Blocking severs all existing follow relationships in both directions and cancels any pending requests.

### 9. Private Account Follow Requests
- **Endpoint:** `GET /api/v1/users/follow-requests` (List incoming requests; requester payloads use `UserDto.fromPublicEntity`, redacting email)
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
  - Anonymous viewers receive `PUBLIC` posts from public (`isPublicVisible = true`) authors.
  - Authenticated viewers receive `PUBLIC` and `MEMBERS_ONLY` posts (plus their own `PRIVATE` posts), while excluding mutually blocked accounts and private (`isPublicVisible = false`) authors whom the viewer is not accepted to follow (`PostRepository.findFeedPosts`).
  - Automatically excludes hidden and soft-deleted posts.
  - Pinned/official announcements are returned first.

### 2. Get Post by ID
- **Endpoint:** `GET /api/v1/community/posts/{id}`
- **Access:** Context-aware (`401 Unauthorized` for `MEMBERS_ONLY` anonymously; `403 Forbidden` for `PRIVATE` non-owner, private-profile non-follower, or mutually blocked viewer).

### 3. Get User Posts
- **Endpoint:** `GET /api/v1/community/users/{username}/posts`
- **Access:** Context-aware (case-insensitive username; `403 Forbidden` when target profile is private or mutually blocked and viewer is not owner/accepted follower).
- **Query Params:** `page` (default: 0), `size` (default: 15)

### 4. Create Post
- **Endpoint:** `POST /api/v1/community/posts`
- **Access:** Authenticated (`BearerAuth`)
- **Payload:**
  ```json
  {
    "content": "Exploring HL7 FHIR digital health record exchange architectures.",
    "visibility": "PUBLIC",
    "mediaUrls": ["https://example.org/images/fhir-architecture.png"],
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

## Administration, Moderation & Audit Console Endpoints (`/api/v1/admin`)
Administrative endpoints require `ROLE_ADMIN` or `ROLE_SUPER_ADMIN`. Content moderation endpoints (`/reports/**`, `/posts/**`, `/comments/**`, `/media/**`) also permit `ROLE_MODERATOR`. All mutations write append-only audit entries.

### 1. Real Dashboard Metrics
- **Endpoint:** `GET /api/v1/admin/stats`
- **Access:** Admin (`ROLE_ADMIN`, `ROLE_SUPER_ADMIN`; `ROLE_MODERATOR` denied with `403`)
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
- **Access:** Admin (`ROLE_ADMIN`, `ROLE_SUPER_ADMIN`)
- **Query Params:** `page`, `size`
- **Response:** Paginated list of registered users with full profile, roles, and status.

### 3. Update User Status & Security Roles
- **Endpoint:** `PUT /api/v1/admin/users/{id}`
- **Access:** Admin (`ROLE_SUPER_ADMIN` required to assign `ROLE_SUPER_ADMIN` or modify any `ROLE_SUPER_ADMIN` account; non-`SUPER_ADMIN` cannot alter own roles or self-suspend)
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
- **Access:** Moderation & Admin (`ROLE_MODERATOR`, `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`)
- **Query Params:** `status` (`PENDING`, `RESOLVED`, `DISMISSED`), `page`, `size`
- **Response:** Paginated array of `ReportDto` with target post/comment/user details.

### 5. Resolve Moderation Ticket
- **Endpoint:** `POST /api/v1/admin/reports/{id}/resolve`
- **Access:** Moderation & Admin (`ROLE_MODERATOR` permitted for `HIDE_POST`, `HIDE_COMMENT`, `NONE`; `SUSPEND_USER` strictly restricted to `ROLE_ADMIN` / `ROLE_SUPER_ADMIN` and returns `403 Forbidden` for moderators or non-`SUPER_ADMIN` targeting `SUPER_ADMIN`)
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
- **Access:** Moderation & Admin (`ROLE_MODERATOR`, `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`)
- **Request Body (`ModerateContentRequest`):**
  ```json
  {
    "isHidden": true,
    "reason": "Violates safety policy"
  }
  ```

### 7. Moderate Comment
- **Endpoint:** `PATCH /api/v1/admin/comments/{id}/moderate`
- **Access:** Moderation & Admin (`ROLE_MODERATOR`, `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`)
- **Request Body (`ModerateContentRequest`):**
  ```json
  {
    "isHidden": true,
    "reason": "Spam content"
  }
  ```

### 8. Immutable System Audit Logs
- **Endpoint:** `GET /api/v1/admin/audit-logs`
- **Access:** Admin (`ROLE_ADMIN`, `ROLE_SUPER_ADMIN`)
- **Query Params:** `page`, `size`
- **Response:** Paginated append-only list of security and administrative operations with UTC timestamp, actor email, action, target entity, target UUID, and IP address.

### 9. Paginated Posts for Moderation
- **Endpoint:** `GET /api/v1/admin/posts`
- **Access:** Moderation & Admin (`ROLE_MODERATOR`, `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`)
- **Query Params:** `page`, `size`, `hidden` (optional boolean)
- **Response:** Full post inventory with hidden and visible states.

### 10. Paginated Comments for Moderation
- **Endpoint:** `GET /api/v1/admin/comments`
- **Access:** Moderation & Admin (`ROLE_MODERATOR`, `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`)
- **Query Params:** `page`, `size`, `hidden` (optional boolean)
- **Response:** Paginated comment threads for content moderation.

### 11. Media Assets Review
- **Endpoint:** `GET /api/v1/admin/media`
- **Access:** Moderation & Admin (`ROLE_MODERATOR`, `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`)
- **Query Params:** `page`, `size`
- **Response:** Paginated list of uploaded image attachments for PHI review.

### 12. Platform Analytics Breakdown
- **Endpoint:** `GET /api/v1/admin/analytics`
- **Access:** Admin (`ROLE_ADMIN`, `ROLE_SUPER_ADMIN`)
- **Response:** Comprehensive database statistics detailing user accounts (active, suspended, pending), posts, comments, media, reports, and audit logs.

### 13. Platform Site Settings
- **Endpoint:** `GET /api/v1/admin/settings`
- **Endpoint:** `PUT /api/v1/admin/settings`
- **Access:** Admin (`ROLE_ADMIN`, `ROLE_SUPER_ADMIN`)
- **Payload:** Runtime maintenance mode, public registration toggle, mandatory email verification flag, PHI warning banner toggle, permitted team domains, and broadcast platform notice.
- **Side Effect:** Automatically writes `SITE_SETTINGS_UPDATED` immutable audit entry.

### 14. Official Team Contributor Administration
- **Endpoint:** `GET /api/v1/admin/team`
- **Endpoint:** `PUT /api/v1/admin/team/{username}`
- **Access:** Admin (`ROLE_ADMIN`, `ROLE_SUPER_ADMIN`)
- **Payload:** Verified official designation, department, university, display order sequence, bio, and responsibilities.
- **Side Effect:** Automatically clears placeholder status and writes `TEAM_MEMBER_UPDATED` audit entry.

---

## Security Headers & Zero-PHI Compliance

### 1. Mandatory HTTP Response Headers
All API responses emitted by the Spring Boot gateway include the following hardened headers:
- `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing attacks.
- `X-Frame-Options: DENY`: Blocks clickjacking and iframe embedding.
- `X-XSS-Protection: 0`: Modern standard delegating to CSP.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`: Enforces encrypted transport across all endpoints.
- `Cache-Control: no-cache, no-store, max-age=0, must-revalidate`: Enforced across all authenticated and sensitive endpoints.

### 2. Zero-PHI Enforcement Policy
In compliance with MediNex healthcare data governance standards, the public platform maintains strict data isolation from clinical record workflows:
- **Interception Engine:** `PhiGuardService` scans all post and comment submissions for Medical Record Numbers (`MRN`), clinic/hospital identifiers, clinical prescription dosages (`Rx`), diagnostic admission summaries (`Chief Complaint`, `Discharge Summary`, `ICD-10`), and patient demographic pairings.
- **Violation Response:** If a submission contains Protected Health Information, the API immediately halts processing and responds with `400 Bad Request`:
  ```json
  {
    "success": false,
    "message": "Zero-PHI Policy Violation: Detected potential Protected Health Information (PHI) or clinical diagnostic records (\"MRN: BD-77491-X\"). In accordance with MediNex healthcare data governance rules, posting patient medical records, clinical identifiers, or personal diagnostic data in the public community is strictly prohibited.",
    "data": null,
    "timestamp": "2026-02-10T12:00:00Z"
  }
  ```

---

## Status and Error Codes

| HTTP Status | Meaning | Scenario |
| :--- | :--- | :--- |
| `200 OK` | Success | Successful read or update operation |
| `201 Created` | Created | Resource successfully persisted |
| `400 Bad Request` | Validation Error | Field validation failure or malformed payload |
| `401 Unauthorized` | Unauthenticated | Missing, expired, or invalid JWT access token (including `/auth/me` or `MEMBERS_ONLY` post reads anonymously) |
| `403 Forbidden` | Access Denied | User lacks role authority (`ROLE_ADMIN`/`ROLE_MODERATOR`), or profile/post is restricted by `isPublicVisible = false` / `PRIVATE` / mutual block |
| `404 Not Found` | Not Found | Contributor, user, or project identifier does not exist |
| `409 Conflict` | Conflict | Duplicate username or email address |
| `429 Too Many Requests` | Rate / Cooldown Limited | Resend verification attempted inside active 120-second cooldown window |
| `500 Server Error` | Internal Failure | Unhandled server exception with tracked UUID |
| `503 Service Unavailable` | Upstream SMTP Failure | Transient email dispatch failure on verification resend (rolls back cooldown state for safe retry) |
