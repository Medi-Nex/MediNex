"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Maximize2, ImagePlus, CheckCircle2 } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ImagePreviewModal } from "@/components/ui/ImagePreviewModal";
import { BannerCropUploadModal } from "@/components/settings/BannerCropUploadModal";
import { useAuth } from "@/lib/auth-context";
import { AuthUser } from "@/lib/api/auth";
import { getTeamPortraitFallback, resolveMediaUrl, selectAvatarVariantUrl } from "@/lib/media";

export interface ProfileHeroSubject {
  id?: string;
  username: string;
  fullName: string;
  isTeamMember?: boolean;
  headline?: string | null;
  designation?: string | null;
  avatarUrl?: string | null;
  avatarSmUrl?: string | null;
  avatarLgUrl?: string | null;
  coverImageUrl?: string | null;
}

interface ProfileHeroCoverProps {
  subject: ProfileHeroSubject;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  onUpdated?: (updatedUser: AuthUser) => void | Promise<void>;
  children?: React.ReactNode;
}

export function ProfileHeroCover({
  subject,
  badges,
  actions,
  onUpdated,
  children,
}: ProfileHeroCoverProps) {
  const router = useRouter();
  const { user: authUser, refreshUser } = useAuth();

  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<"avatar" | "banner" | null>(null);
  const [localBannerOverride, setLocalBannerOverride] = useState<string | null | undefined>(undefined);
  const [bannerSavedBannerToast, setBannerSavedToast] = useState(false);

  const isOwner =
    Boolean(authUser?.username) &&
    authUser!.username.toLowerCase() === subject.username.toLowerCase();

  // Prefer live freshly-saved cover, else owner's authUser cover, else fetched profile cover
  const rawCoverUrl =
    localBannerOverride !== undefined
      ? localBannerOverride
      : isOwner && authUser?.coverImageUrl !== undefined
      ? authUser.coverImageUrl
      : subject.coverImageUrl;

  const resolvedBannerUrl = resolveMediaUrl(rawCoverUrl);

  // Sync owner's latest avatar immediately too if updated in settings
  const rawAvatarUrl = isOwner && authUser?.avatarUrl !== undefined ? authUser.avatarUrl : subject.avatarUrl;
  const rawAvatarSmUrl = isOwner && authUser?.avatarSmUrl !== undefined ? authUser.avatarSmUrl : subject.avatarSmUrl;
  const rawAvatarLgUrl = isOwner && authUser?.avatarLgUrl !== undefined ? authUser.avatarLgUrl : subject.avatarLgUrl;

  const highResAvatar =
    selectAvatarVariantUrl(
      { smUrl: rawAvatarSmUrl, mdUrl: rawAvatarUrl, lgUrl: rawAvatarLgUrl },
      "xl"
    ) || resolveMediaUrl(rawAvatarUrl);

  const teamPortraitFallback = getTeamPortraitFallback(
    subject.username,
    subject.fullName,
    Boolean(subject.isTeamMember)
  );

  const avatarPreviewSrc = highResAvatar || teamPortraitFallback;

  const handleBannerSaved = async (updatedUser: AuthUser) => {
    setLocalBannerOverride(updatedUser.coverImageUrl ?? null);
    await refreshUser();
    if (onUpdated) {
      await onUpdated(updatedUser);
    }
    setBannerSavedToast(true);
    setTimeout(() => setBannerSavedToast(false), 3500);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-medinex-border shadow-card overflow-hidden">
        {/* Hero Cover Banner — exact 4:1 ratio matching BannerCropUploadModal (1600x400) */}
        <div
          className={`relative w-full aspect-[4/1] min-h-[116px] max-h-[260px] bg-medinex-dark bg-gradient-to-br from-medinex-dark via-medinex-deep to-medinex-teal overflow-hidden group ${
            resolvedBannerUrl ? "cursor-pointer" : ""
          }`}
          onClick={() => {
            if (resolvedBannerUrl) {
              setPreviewTarget("banner");
            }
          }}
        >
          {resolvedBannerUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolvedBannerUrl}
                alt={`${subject.fullName}'s profile banner`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-slate-950/20 pointer-events-none" />
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/55 text-white text-[11px] font-semibold backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-3 right-3 pointer-events-none">
                <Maximize2 className="w-3 h-3" />
                <span>Preview Banner</span>
              </span>
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-hero-mesh pointer-events-none" />
              <div className="absolute inset-0 bg-dot-matrix opacity-20 pointer-events-none" />
            </>
          )}

          {/* Owner edit / add banner trigger directly on hero cover */}
          {isOwner && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsBannerModalOpen(true);
              }}
              className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-950/65 hover:bg-slate-950/85 text-white border border-white/25 backdrop-blur-md text-[11px] sm:text-xs font-semibold shadow-sm transition-colors"
            >
              {resolvedBannerUrl ? (
                <>
                  <Camera className="w-3.5 h-3.5 text-teal-300" />
                  <span>Edit Banner</span>
                </>
              ) : (
                <>
                  <ImagePlus className="w-3.5 h-3.5 text-teal-300" />
                  <span>Add Banner</span>
                </>
              )}
            </button>
          )}

          {/* Top-right badges slot */}
          {badges && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex flex-wrap justify-end gap-1.5 sm:gap-2"
            >
              {badges}
            </div>
          )}
        </div>

        {/* Profile Identity Row (Overlapping Avatar + Actions) */}
        <div className="px-4 sm:px-8 pb-6 sm:pb-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 sm:-mt-16 gap-3.5 sm:gap-4 mb-5 sm:mb-6">
            {/* Click-to-preview Profile Photo */}
            <button
              type="button"
              onClick={() => {
                if (avatarPreviewSrc) {
                  setPreviewTarget("avatar");
                }
              }}
              aria-label={`Preview ${subject.fullName}'s profile photo`}
              className={`p-1.5 bg-white rounded-2xl shadow-lg border border-medinex-border inline-flex w-fit relative group text-left ${
                avatarPreviewSrc ? "cursor-pointer hover:ring-2 hover:ring-medinex-teal/60 transition-all" : "cursor-default"
              }`}
            >
              <UserAvatar
                src={rawAvatarUrl}
                smSrc={rawAvatarSmUrl}
                lgSrc={rawAvatarLgUrl}
                fullName={subject.fullName}
                username={subject.username}
                isTeamMember={subject.isTeamMember}
                size="xl"
                shape="rounded"
                className="border-0 shadow-none"
              />
              {avatarPreviewSrc && (
                <span className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-slate-950/65 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs pointer-events-none">
                  <Maximize2 className="w-3 h-3" />
                </span>
              )}
            </button>

            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>

          {bannerSavedBannerToast && (
            <div className="mb-4 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-medinex-teal shrink-0" />
              <span>Profile cover banner updated cleanly.</span>
            </div>
          )}

          {children}
        </div>
      </div>

      {/* Lightbox Preview Modal for both Profile Photo & Cover Banner */}
      <ImagePreviewModal
        isOpen={previewTarget !== null}
        onClose={() => setPreviewTarget(null)}
        src={previewTarget === "banner" ? resolvedBannerUrl : avatarPreviewSrc}
        fallbackSrc={previewTarget === "avatar" ? teamPortraitFallback : null}
        title={
          previewTarget === "banner"
            ? `${subject.fullName}'s Cover Banner`
            : `${subject.fullName}'s Profile Photo`
        }
        subtitle={`@${subject.username}${
          subject.headline || subject.designation
            ? ` • ${subject.headline || subject.designation}`
            : ""
        }`}
        variant={previewTarget === "banner" ? "banner" : "avatar"}
        onEdit={
          isOwner
            ? () => {
                if (previewTarget === "banner") {
                  setIsBannerModalOpen(true);
                } else {
                  router.push("/dashboard/profile");
                }
              }
            : undefined
        }
        editLabel={previewTarget === "banner" ? "Edit & Resize Banner" : "Change Photo"}
      />

      {/* Interactive Crop/Resize Editor Modal (owner only) */}
      {isOwner && authUser && (
        <BannerCropUploadModal
          isOpen={isBannerModalOpen}
          onClose={() => setIsBannerModalOpen(false)}
          user={{
            ...authUser,
            coverImageUrl: rawCoverUrl ?? authUser.coverImageUrl,
          }}
          onUpdated={handleBannerSaved}
        />
      )}
    </>
  );
}
