import { apiClient } from "./client";
import { UserDto } from "./auth";

export interface AdminStats {
  totalUsers: number;
  totalTeamFollowers: number;
  totalMemberFollowers: number;
  totalPosts: number;
  pendingReportsCount: number;
  totalAuditLogs: number;
}

export interface PaginatedResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface AdminReport {
  id: string;
  reporter?: {
    id: string;
    username: string;
    fullName: string;
  };
  reportedUser?: {
    id: string;
    username: string;
    fullName: string;
  };
  reportedPostId?: string;
  reportedCommentId?: string;
  reason: string;
  details?: string;
  status: "PENDING" | "REVIEWING" | "RESOLVED" | "DISMISSED";
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actorId?: string;
  actorEmail?: string;
  action: string;
  targetEntity?: string;
  targetId?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface UpdateUserRequest {
  status?: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | "DELETED";
  roles?: string[];
  isTeamMember?: boolean;
}

export interface ResolveReportRequest {
  status: "RESOLVED" | "DISMISSED";
  resolutionNotes?: string;
  action?: "HIDE_POST" | "HIDE_COMMENT" | "SUSPEND_USER" | "NONE";
}

export async function getAdminStats(): Promise<AdminStats> {
  return apiClient<AdminStats>("/admin/stats");
}

export async function getAdminUsers(page = 0, size = 20): Promise<PaginatedResult<UserDto>> {
  return apiClient<PaginatedResult<UserDto>>(`/admin/users?page=${page}&size=${size}`);
}

export async function updateAdminUser(id: string, payload: UpdateUserRequest): Promise<UserDto> {
  return apiClient<UserDto>(`/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getAdminReports(
  status?: string,
  page = 0,
  size = 20
): Promise<PaginatedResult<AdminReport>> {
  const query = status ? `?status=${status}&page=${page}&size=${size}` : `?page=${page}&size=${size}`;
  return apiClient<PaginatedResult<AdminReport>>(`/admin/reports${query}`);
}

export async function resolveReport(id: string, payload: ResolveReportRequest): Promise<void> {
  await apiClient<void>(`/admin/reports/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function moderatePost(id: string, isHidden: boolean, reason?: string): Promise<void> {
  await apiClient<void>(`/admin/posts/${id}/moderate`, {
    method: "PATCH",
    body: JSON.stringify({ isHidden, reason }),
  });
}

export async function moderateComment(id: string, isHidden: boolean, reason?: string): Promise<void> {
  await apiClient<void>(`/admin/comments/${id}/moderate`, {
    method: "PATCH",
    body: JSON.stringify({ isHidden, reason }),
  });
}

export async function getAdminAuditLogs(page = 0, size = 30): Promise<PaginatedResult<AuditLogItem>> {
  return apiClient<PaginatedResult<AuditLogItem>>(`/admin/audit-logs?page=${page}&size=${size}`);
}

export interface AdminPostItem {
  id: string;
  authorUsername: string;
  authorFullName: string;
  content: string;
  visibility: string;
  isHidden: boolean;
  isPinned: boolean;
  isOfficialAnnouncement: boolean;
  likesCount: number;
  commentsCount: number;
  mediaCount: number;
  createdAt: string;
}

export interface AdminCommentItem {
  id: string;
  postId: string;
  authorUsername: string;
  authorFullName: string;
  content: string;
  isHidden: boolean;
  likesCount: number;
  repliesCount: number;
  createdAt: string;
}

export interface AdminMediaItem {
  id: string;
  postId: string;
  authorUsername: string;
  mediaUrl: string;
  mediaType: string;
  fileSizeBytes: number;
  isPostHidden: boolean;
  createdAt: string;
}

export interface AdminAnalytics {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  pendingVerificationUsers: number;
  totalPosts: number;
  hiddenPosts: number;
  totalComments: number;
  hiddenComments: number;
  totalMedia: number;
  pendingReports: number;
  resolvedReports: number;
  dismissedReports: number;
  totalAuditLogs: number;
  totalFollows: number;
}

export interface AdminSettings {
  maintenanceMode: boolean;
  allowUserRegistration: boolean;
  requireEmailVerification: boolean;
  phiWarningBannerEnabled: boolean;
  allowedDomains: string;
  platformNotice: string;
}

export interface AdminTeamMember {
  id: string;
  username: string;
  fullName: string;
  designation: string;
  department?: string;
  university?: string;
  bio?: string;
  skills: string[];
  responsibilities: string[];
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  avatarUrl?: string;
  isLead: boolean;
  isPlaceholder: boolean;
  publicVisibility: boolean;
  verifiedJoinDate?: string;
  displayOrder: number;
}

export async function getAdminPosts(
  page = 0,
  size = 20,
  hidden?: boolean
): Promise<PaginatedResult<AdminPostItem>> {
  const query = hidden !== undefined ? `?hidden=${hidden}&page=${page}&size=${size}` : `?page=${page}&size=${size}`;
  return apiClient<PaginatedResult<AdminPostItem>>(`/admin/posts${query}`);
}

export async function getAdminComments(
  page = 0,
  size = 20,
  hidden?: boolean
): Promise<PaginatedResult<AdminCommentItem>> {
  const query = hidden !== undefined ? `?hidden=${hidden}&page=${page}&size=${size}` : `?page=${page}&size=${size}`;
  return apiClient<PaginatedResult<AdminCommentItem>>(`/admin/comments${query}`);
}

export async function getAdminMedia(
  page = 0,
  size = 20
): Promise<PaginatedResult<AdminMediaItem>> {
  return apiClient<PaginatedResult<AdminMediaItem>>(`/admin/media?page=${page}&size=${size}`);
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  return apiClient<AdminAnalytics>("/admin/analytics");
}

export async function getAdminSettings(): Promise<AdminSettings> {
  return apiClient<AdminSettings>("/admin/settings");
}

export async function updateAdminSettings(payload: AdminSettings): Promise<AdminSettings> {
  return apiClient<AdminSettings>("/admin/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function getAdminTeamMembers(): Promise<AdminTeamMember[]> {
  return apiClient<AdminTeamMember[]>("/admin/team");
}

export async function updateAdminTeamMember(
  username: string,
  payload: Partial<AdminTeamMember>
): Promise<AdminTeamMember> {
  return apiClient<AdminTeamMember>(`/admin/team/${username}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
