"use client";

import React, { useState } from "react";
import { Image as ImageIcon, Pencil, Trash2, Loader2, CheckCircle2, AlertCircle, Maximize2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ImagePreviewModal } from "@/components/ui/ImagePreviewModal";
import { BannerCropUploadModal } from "@/components/settings/BannerCropUploadModal";
import { useAuth } from "@/lib/auth-context";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { resolveMediaUrl } from "@/lib/media";

export function BannerUploadCard({ compact = false }: { compact?: boolean }) {
  const { user, refreshUser } = useAuth();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!user) return null;

  const resolvedBanner = resolveMediaUrl(user.coverImageUrl);

  const handleRemove = async () => {
    setIsRemoving(true);
    setFeedback(null);
    setErrorMsg(null);
    try {
      await authApi.removeBanner();
      await refreshUser();
      setFeedback("Profile cover banner removed.");
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Failed to remove cover banner.");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <Card className={compact ? "border-medinex-border bg-slate-50/70" : "shadow-subtle"}>
        <CardHeader className={compact ? "py-3.5 px-4" : undefined}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-medinex-text flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-medinex-teal" />
                <span>Profile Cover Banner</span>
              </h2>
              <p className="text-xs text-medinex-muted mt-0.5">
                Customize your hero banner (1600 &times; 400 px • 4:1 ratio) with interactive crop, fit, and zoom controls.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={() => {
                  setFeedback(null);
                  setErrorMsg(null);
                  setIsEditorOpen(true);
                }}
                className="text-xs inline-flex items-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{resolvedBanner ? "Edit & Resize Banner" : "Add Cover Banner"}</span>
              </Button>

              {resolvedBanner && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRemove}
                  disabled={isRemoving}
                  className="text-xs border-rose-200 text-rose-600 hover:bg-rose-50 inline-flex items-center gap-1.5"
                >
                  {isRemoving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Remove</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardBody className={compact ? "p-4 space-y-3" : "p-6 space-y-4"}>
          {feedback && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-medinex-teal shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* WYSIWYG Profile Hero Preview Strip */}
          <div className="rounded-xl border border-medinex-border bg-white overflow-hidden shadow-xs">
            <div
              onClick={() => {
                if (resolvedBanner) setIsPreviewOpen(true);
                else setIsEditorOpen(true);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (resolvedBanner) setIsPreviewOpen(true);
                  else setIsEditorOpen(true);
                }
              }}
              className="relative w-full aspect-[4/1] bg-medinex-dark bg-gradient-to-br from-medinex-dark via-medinex-deep to-medinex-teal overflow-hidden group cursor-pointer"
            >
              {resolvedBanner ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolvedBanner}
                    alt={`${user.fullName}'s profile cover banner`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-slate-950/65 text-white text-[11px] font-semibold inline-flex items-center gap-1 opacity-90 group-hover:opacity-100 backdrop-blur-xs">
                    <Maximize2 className="w-3 h-3" />
                    <span>Click to Preview</span>
                  </span>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-hero-mesh pointer-events-none" />
                  <div className="absolute inset-0 bg-dot-matrix opacity-20 pointer-events-none" />
                  <div className="relative z-10 h-full flex items-center justify-center text-white/90 text-xs font-semibold px-4 text-center">
                    No custom banner uploaded — click &ldquo;Add Cover Banner&rdquo; to upload and crop yours
                  </div>
                </>
              )}
            </div>

            <div className="px-4 pb-3 flex items-end gap-3 -mt-6 sm:-mt-8 relative pointer-events-none">
              <div className="p-1 bg-white rounded-xl border border-medinex-border shadow-md inline-flex">
                <UserAvatar
                  src={user.avatarUrl}
                  smSrc={user.avatarSmUrl}
                  lgSrc={user.avatarLgUrl}
                  fullName={user.fullName}
                  username={user.username}
                  size="md"
                  shape="rounded"
                  className="border-0 shadow-none"
                />
              </div>
              <div className="pb-0.5 min-w-0">
                <div className="text-xs font-bold text-medinex-text truncate">{user.fullName}</div>
                <div className="text-[11px] text-medinex-teal truncate">@{user.username}</div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <BannerCropUploadModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        user={user}
        onUpdated={async () => {
          await refreshUser();
          setFeedback("Profile cover banner saved successfully (1600 × 400 px).");
        }}
      />

      <ImagePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        src={resolvedBanner}
        title={`${user.fullName}'s Cover Banner`}
        subtitle={`@${user.username} • Profile Banner`}
        variant="banner"
        onEdit={() => setIsEditorOpen(true)}
        editLabel="Edit & Resize"
      />
    </>
  );
}
