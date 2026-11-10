// MediNex Community Feed & Interactions API
import { apiClient } from "./client";
import { PageResponse } from "./follow";

export interface PostMediaDto {
  id: string;
  mediaUrl: string;
  mediaType: string;
  fileSizeBytes: number;
  displayOrder: number;
}

export interface PostDto {
  id: string;
  authorId: string;
  authorUsername: string;
  authorFullName: string;
  authorAvatarUrl?: string;
  authorDesignation?: string;
  isAuthorVerified: boolean;
  content: string;
  visibility: "PUBLIC" | "MEMBERS_ONLY" | "PRIVATE";
  isPinned: boolean;
  isHidden: boolean;
  isOfficialAnnouncement: boolean;
  likesCount: number;
  commentsCount: number;
  media: PostMediaDto[];
  isLiked: boolean;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentDto {
  id: string;
  postId: string;
  parentCommentId?: string;
  authorId: string;
  authorUsername: string;
  authorFullName: string;
  authorAvatarUrl?: string;
  isAuthorVerified: boolean;
  content: string;
  likesCount: number;
  repliesCount: number;
  isLiked: boolean;
  isOwner: boolean;
  replies: CommentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface LikeResponse {
  isLiked: boolean;
  likesCount: number;
}

export async function getCommunityFeed(
  page = 0,
  size = 15
): Promise<PageResponse<PostDto>> {
  return apiClient<PageResponse<PostDto>>(`/community/feed?page=${page}&size=${size}`);
}

export async function getPostById(id: string): Promise<PostDto> {
  return apiClient<PostDto>(`/community/posts/${id}`);
}

export async function getUserPosts(
  username: string,
  page = 0,
  size = 15
): Promise<PageResponse<PostDto>> {
  return apiClient<PageResponse<PostDto>>(
    `/community/users/${encodeURIComponent(username)}/posts?page=${page}&size=${size}`
  );
}

export async function createPost(data: {
  content: string;
  visibility?: "PUBLIC" | "MEMBERS_ONLY" | "PRIVATE";
  mediaUrls?: string[];
  isOfficialAnnouncement?: boolean;
}): Promise<PostDto> {
  return apiClient<PostDto>("/community/posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePost(
  id: string,
  data: { content: string; visibility?: "PUBLIC" | "MEMBERS_ONLY" | "PRIVATE" }
): Promise<PostDto> {
  return apiClient<PostDto>(`/community/posts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePost(id: string): Promise<void> {
  return apiClient<void>(`/community/posts/${id}`, {
    method: "DELETE",
  });
}

export async function togglePostLike(id: string): Promise<LikeResponse> {
  return apiClient<LikeResponse>(`/community/posts/${id}/like`, {
    method: "POST",
  });
}

export async function getPostComments(
  id: string,
  page = 0,
  size = 20
): Promise<PageResponse<CommentDto>> {
  return apiClient<PageResponse<CommentDto>>(
    `/community/posts/${id}/comments?page=${page}&size=${size}`
  );
}

export async function addComment(
  id: string,
  data: { content: string; parentCommentId?: string }
): Promise<CommentDto> {
  return apiClient<CommentDto>(`/community/posts/${id}/comments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteComment(commentId: string): Promise<void> {
  return apiClient<void>(`/community/comments/${commentId}`, {
    method: "DELETE",
  });
}

export async function toggleCommentLike(commentId: string): Promise<LikeResponse> {
  return apiClient<LikeResponse>(`/community/comments/${commentId}/like`, {
    method: "POST",
  });
}
