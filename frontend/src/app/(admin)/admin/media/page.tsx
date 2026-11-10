"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Image as ImageIcon,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  EyeOff,
  Eye,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getAdminMedia,
  moderatePost,
  AdminMediaItem,
  PaginatedResult,
} from "@/lib/api/admin";

export default function AdminMediaPage() {
  const [mediaPage, setMediaPage] = useState<PaginatedResult<AdminMediaItem>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 16,
    number: 0,
    first: true,
    last: true,
  });
  const [page, setPage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningPostId, setActioningPostId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const fetchMedia = async (p = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminMedia(p, 16);
      setMediaPage(data);
      setPage(data.number);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load media attachments";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia(page);
  }, [page]);

  const handleToggleHidePost = (postId: string, currentHidden: boolean) => {
    setActioningPostId(postId);
    startTransition(async () => {
      try {
        await moderatePost(postId, !currentHidden, "Media attachment guideline moderation");
        setMediaPage((prev) => ({
          ...prev,
          content: prev.content.map((m) =>
            m.postId === postId ? { ...m, isPostHidden: !currentHidden } : m
          ),
        }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to moderate media post";
        setError(msg);
      } finally {
        setActioningPostId(null);
      }
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-medinex-text tracking-tight flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-medinex-teal" />
            <span>Community Media Asset Review</span>
          </h1>
          <p className="text-xs text-medinex-muted mt-1">
            Review uploaded image attachments, inspect diagnostic representations for PHI leaks, and enforce media safety.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchMedia(page)}
          disabled={loading}
          className="text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Media Grid */}
      {loading && mediaPage.content.length === 0 ? (
        <div className="p-16 text-center text-medinex-muted">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-medinex-teal" />
          <span className="text-xs">Loading media assets...</span>
        </div>
      ) : mediaPage.content.length === 0 ? (
        <Card className="text-center py-16 px-4">
          <CardBody className="space-y-3 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-medinex-teal flex items-center justify-center mx-auto">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-medinex-text">No Media Attachments</h3>
            <p className="text-xs text-medinex-muted">
              No user-uploaded images or technical diagrams have been registered in the database yet.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaPage.content.map((item) => (
            <Card key={item.id} className="overflow-hidden border border-medinex-border flex flex-col shadow-xs">
              <div className="relative aspect-video bg-slate-100 border-b border-slate-100">
                <Image
                  src={item.mediaUrl}
                  alt="Attachment preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
                {item.isPostHidden && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="warning" className="text-[10px]">
                      Post Hidden
                    </Badge>
                  </div>
                )}
              </div>
              <CardBody className="p-3 text-xs flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-medinex-muted mb-1">
                    <span className="font-mono text-medinex-teal font-semibold">
                      @{item.authorUsername}
                    </span>
                    <span>{formatFileSize(item.fileSizeBytes)}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Uploaded: {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/community/posts/${item.postId}`}
                    target="_blank"
                    className="text-[11px] font-semibold text-medinex-teal hover:underline flex items-center gap-1"
                  >
                    <span>View Post</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <Button
                    variant={item.isPostHidden ? "primary" : "outline"}
                    size="sm"
                    onClick={() => handleToggleHidePost(item.postId, item.isPostHidden)}
                    disabled={actioningPostId === item.postId}
                    className="h-7 text-[10px] px-2 flex items-center gap-1"
                  >
                    {item.isPostHidden ? (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>Unhide</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3 text-amber-600" />
                        <span>Hide Post</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {mediaPage.totalPages > 1 && (
        <div className="p-4 rounded-xl bg-white border border-medinex-border flex items-center justify-between text-xs text-medinex-muted">
          <span>
            Showing page {mediaPage.number + 1} of {mediaPage.totalPages} ({mediaPage.totalElements} assets)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={mediaPage.first || loading}
              className="h-8 px-2 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={mediaPage.last || loading}
              className="h-8 px-2 text-xs"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
