// MediNex Notifications API
import { apiClient } from "./client";
import { PageResponse } from "./follow";

export type NotificationType =
  | "NEW_FOLLOWER"
  | "FOLLOW_REQUEST"
  | "FOLLOW_ACCEPTED"
  | "POST_LIKE"
  | "COMMENT"
  | "COMMENT_REPLY"
  | "ANNOUNCEMENT";

export interface NotificationDto {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  targetType?: string;
  targetId?: string;
  createdAt: string;
  actorUsername?: string;
  actorFullName?: string;
  actorAvatarUrl?: string;
  actorAvatarSmUrl?: string;
}

export async function getNotifications(
  page = 0,
  size = 20
): Promise<PageResponse<NotificationDto>> {
  return apiClient<PageResponse<NotificationDto>>(`/notifications?page=${page}&size=${size}`);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const res = await apiClient<{ unreadCount: number }>("/notifications/unread-count");
  return res.unreadCount;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  return apiClient<void>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  return apiClient<void>("/notifications/read-all", {
    method: "POST",
  });
}
