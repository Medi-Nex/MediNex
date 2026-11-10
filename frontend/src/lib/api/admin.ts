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
