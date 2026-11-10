"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Eye,
  EyeOff,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getAdminPosts,
  moderatePost,
  AdminPostItem,
  PaginatedResult,
} from "@/lib/api/admin";

export default function AdminPostsPage() {
  const [postsPage, setPostsPage] = useState<PaginatedResult<AdminPostItem>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 15,
    number: 0,
    first: true,
    last: true,
  });
  const [page, setPage] = useState<number>(0);
  const [hiddenFilter, setHiddenFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const fetchPosts = async (p = 0) => {
    setLoading(true);
    setError(null);
    try {
      const hidden = hiddenFilter === "HIDDEN" ? true : hiddenFilter === "VISIBLE" ? false : undefined;
      const data = await getAdminPosts(p, 15, hidden);
      setPostsPage(data);
      setPage(data.number);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load posts";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hiddenFilter]);

  const handleToggleHide = (post: AdminPostItem) => {
    setActioningId(post.id);
    startTransition(async () => {
      try {
        await moderatePost(post.id, !post.isHidden, "Admin content moderation");
        setPostsPage((prev) => ({
          ...prev,
          content: prev.content.map((p) =>
            p.id === post.id ? { ...p, isHidden: !p.isHidden } : p
          ),
        }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to toggle post visibility";
        setError(msg);
      } finally {
        setActioningId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-medinex-text tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-medinex-teal" />
            <span>Community Post Moderation</span>
          </h1>
          <p className="text-xs text-medinex-muted mt-1">
            Audit published discussions, enforce zero-PHI guidelines, and hide non-compliant posts.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={hiddenFilter}
            onChange={(e) => {
              setHiddenFilter(e.target.value);
              setPage(0);
            }}
            className="text-xs px-3 py-1.5 rounded-lg border border-medinex-border bg-white text-slate-700 focus:outline-none focus:border-medinex-teal"
          >
            <option value="ALL">All Posts</option>
            <option value="VISIBLE">Visible Only</option>
            <option value="HIDDEN">Hidden by Moderation</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPosts(page)}
            disabled={loading}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Posts Table */}
      <Card className="border border-medinex-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-medinex-border text-medinex-muted font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Author</th>
                <th className="py-3.5 px-4">Content Excerpt</th>
                <th className="py-3.5 px-4">Visibility</th>
                <th className="py-3.5 px-4">Engagements</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && postsPage.content.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-medinex-muted">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-medinex-teal" />
                    <span>Loading community posts...</span>
                  </td>
                </tr>
              ) : postsPage.content.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-medinex-muted">
                    No community posts found matching current filters.
                  </td>
                </tr>
              ) : (
                postsPage.content.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-medinex-text block">
                          {post.authorFullName || post.authorUsername}
                        </span>
                        <span className="text-[11px] font-mono text-medinex-teal">
                          @{post.authorUsername}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="line-clamp-2 text-slate-800 leading-relaxed">
                        {post.content}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="teal" className="text-[10px]">
                        {post.visibility}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-medinex-muted text-[11px]">
                      <span>{post.likesCount} likes</span> &bull;{" "}
                      <span>{post.commentsCount} comments</span>
                      {post.mediaCount > 0 && <span> &bull; {post.mediaCount} imgs</span>}
                    </td>
                    <td className="py-3.5 px-4 text-medinex-muted text-[11px]">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {post.isHidden ? (
                        <Badge variant="warning" className="text-[10px]">
                          Hidden
                        </Badge>
                      ) : (
                        <Badge variant="mint" className="text-[10px]">
                          Active
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/community/posts/${post.id}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-medinex-teal hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Shareable Post"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <Button
                          variant={post.isHidden ? "primary" : "outline"}
                          size="sm"
                          onClick={() => handleToggleHide(post)}
                          disabled={actioningId === post.id}
                          className="text-xs h-7 px-2.5 flex items-center gap-1"
                        >
                          {post.isHidden ? (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>Unhide</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-amber-600" />
                              <span>Hide</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {postsPage.totalPages > 1 && (
          <div className="p-4 border-t border-medinex-border flex items-center justify-between text-xs text-medinex-muted">
            <span>
              Showing page {postsPage.number + 1} of {postsPage.totalPages} ({postsPage.totalElements} posts)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={postsPage.first || loading}
                className="h-8 px-2 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={postsPage.last || loading}
                className="h-8 px-2 text-xs"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
