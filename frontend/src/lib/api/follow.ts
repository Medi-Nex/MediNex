// MediNex Follow & Relationships API
import { apiClient } from "./client";

export interface FollowStatsDto {
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  hasPendingRequest: boolean;
  isBlocked: boolean;
  isSelf: boolean;
}

export interface TeamFollowStatsDto {
  followerCount: number;
  isFollowing: boolean;
}

export interface FollowUserDto {
  id: string;
  username: string;
  fullName: string;
  headline?: string;
  designation?: string;
  avatarUrl?: string;
  avatarSmUrl?: string;
  avatarLgUrl?: string;
  isVerifiedContributor: boolean;
  isFollowing: boolean;
  followedAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface FollowRequestDto {
  id: string;
  requester: {
    id: string;
    username: string;
    fullName: string;
    email?: string;
    avatarUrl?: string;
    avatarSmUrl?: string;
    avatarLgUrl?: string;
    designation?: string;
  };
  status: string;
  createdAt: string;
}

export async function followUser(username: string): Promise<FollowStatsDto> {
  return apiClient<FollowStatsDto>(`/users/${encodeURIComponent(username)}/follow`, {
    method: "POST",
  });
}

export async function unfollowUser(username: string): Promise<FollowStatsDto> {
  return apiClient<FollowStatsDto>(`/users/${encodeURIComponent(username)}/follow`, {
    method: "DELETE",
  });
}

export async function getUserFollowStats(username: string): Promise<FollowStatsDto> {
  return apiClient<FollowStatsDto>(`/users/${encodeURIComponent(username)}/follow-stats`);
}

export async function getUserFollowers(
  username: string,
  page = 0,
  size = 20
): Promise<PageResponse<FollowUserDto>> {
  return apiClient<PageResponse<FollowUserDto>>(
    `/users/${encodeURIComponent(username)}/followers?page=${page}&size=${size}`
  );
}

export async function getUserFollowing(
  username: string,
  page = 0,
  size = 20
): Promise<PageResponse<FollowUserDto>> {
  return apiClient<PageResponse<FollowUserDto>>(
    `/users/${encodeURIComponent(username)}/following?page=${page}&size=${size}`
  );
}

export async function followTeam(): Promise<TeamFollowStatsDto> {
  return apiClient<TeamFollowStatsDto>("/team/follow", {
    method: "POST",
  });
}

export async function unfollowTeam(): Promise<TeamFollowStatsDto> {
  return apiClient<TeamFollowStatsDto>("/team/follow", {
    method: "DELETE",
  });
}

export async function getTeamFollowStats(): Promise<TeamFollowStatsDto> {
  return apiClient<TeamFollowStatsDto>("/team/follow-stats");
}

export async function getTeamFollowers(page = 0, size = 20): Promise<PageResponse<FollowUserDto>> {
  return apiClient<PageResponse<FollowUserDto>>(`/team/followers?page=${page}&size=${size}`);
}

export async function blockUser(username: string, reason?: string): Promise<void> {
  return apiClient<void>(`/users/${encodeURIComponent(username)}/block`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function unblockUser(username: string): Promise<void> {
  return apiClient<void>(`/users/${encodeURIComponent(username)}/block`, {
    method: "DELETE",
  });
}

export async function getPendingFollowRequests(
  page = 0,
  size = 20
): Promise<PageResponse<FollowRequestDto>> {
  return apiClient<PageResponse<FollowRequestDto>>(
    `/users/follow-requests?page=${page}&size=${size}`
  );
}

export async function acceptFollowRequest(requestId: string): Promise<void> {
  return apiClient<void>(`/users/follow-requests/${requestId}/accept`, {
    method: "POST",
  });
}

export async function rejectFollowRequest(requestId: string): Promise<void> {
  return apiClient<void>(`/users/follow-requests/${requestId}/reject`, {
    method: "POST",
  });
}

export async function reportUser(
  username: string,
  reason: string,
  details?: string,
  reportedPostId?: string,
  reportedCommentId?: string
): Promise<void> {
  return apiClient<void>(`/users/${encodeURIComponent(username)}/report`, {
    method: "POST",
    body: JSON.stringify({ reason, details, reportedPostId, reportedCommentId }),
  });
}

export interface BlockedUserDto {
  id: string;
  blockedUserId: string;
  username: string;
  fullName: string;
  reason?: string;
  blockedAt: string;
}

export async function getBlockedUsers(): Promise<BlockedUserDto[]> {
  return apiClient<BlockedUserDto[]>("/users/blocks");
}
