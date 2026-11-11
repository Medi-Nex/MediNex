"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Bell, 
  CheckCheck, 
  UserPlus, 
  Heart, 
  MessageSquare, 
  Megaphone, 
  Clock, 
  Loader2 
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { getUserProfileHref } from "@/lib/media";
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  NotificationDto 
} from "@/lib/api/notifications";

export default function DashboardNotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const page = await getNotifications(0, 30);
      setNotifications(page.content);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadNotifications();
    }
  }, [authLoading, user, loadNotifications]);

  const handleMarkRead = async (id: string, isAlreadyRead: boolean) => {
    if (isAlreadyRead) return;
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "NEW_FOLLOWER":
        return <UserPlus className="w-4 h-4 text-teal-600" />;
      case "FOLLOW_REQUEST":
        return <Clock className="w-4 h-4 text-amber-600" />;
      case "FOLLOW_ACCEPTED":
        return <UserPlus className="w-4 h-4 text-emerald-600" />;
      case "POST_LIKE":
        return <Heart className="w-4 h-4 text-rose-500" />;
      case "COMMENT":
      case "COMMENT_REPLY":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "ANNOUNCEMENT":
        return <Megaphone className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (authLoading || (loading && notifications.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
        <p className="text-sm text-slate-500">Retrieving notification feed...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-medinex-light pb-24 md:pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12201E] tracking-tight">
            Notifications
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Stay informed on follower activity, project interactions, and official announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-all self-start sm:self-auto disabled:opacity-50 shadow-xs"
          >
            {markingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5 text-teal-600" />
            )}
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#12201E]">No notifications yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              When other healthcare innovators follow you, interact with your posts, or the team posts updates, you&apos;ll see them here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleMarkRead(item.id, item.isRead)}
                className={`p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer ${
                  item.isRead ? "bg-white hover:bg-slate-50/70" : "bg-teal-50/30 hover:bg-teal-50/50"
                }`}
              >
                {item.actorUsername ? (
                  <UserAvatar
                    src={item.actorAvatarUrl}
                    smSrc={item.actorAvatarSmUrl}
                    fullName={item.actorFullName || item.actorUsername}
                    username={item.actorUsername}
                    size="sm"
                    clickable
                    className="w-9 h-9 mt-0.5"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200/60">
                    {getIcon(item.type)}
                  </div>
                )}

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex shrink-0">{getIcon(item.type)}</span>
                      <p className={`text-sm ${item.isRead ? "text-slate-700" : "font-semibold text-slate-900"}`}>
                        {item.message}
                      </p>
                    </div>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#0D9488] shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                    {item.actorUsername && (
                      <>
                        <span>&bull;</span>
                        <Link
                          href={getUserProfileHref(item.actorUsername)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#0D9488] hover:underline font-medium font-mono"
                        >
                          @{item.actorUsername}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
