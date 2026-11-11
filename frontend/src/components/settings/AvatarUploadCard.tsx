"use client";

import React, { useRef, useState, useEffect } from "react";
import { Upload, Trash2, CheckCircle2, AlertCircle, Image as ImageIcon, Loader2, Sparkles } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { authApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth-context";
import { deriveAvatarVariantUrl } from "@/lib/media";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/bmp", "image/webp"];

async function normalizeWebpIfNeeded(file: File): Promise<File> {
  if (file.type !== "image/webp") {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Canvas rendering context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error("Failed to convert WebP image"));
            return;
          }
          const baseName = file.name.replace(/\.webp$/i, "");
          resolve(new File([blob], `${baseName}.png`, { type: "image/png" }));
        }, "image/png");
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not decode WebP image in browser"));
    };
    img.src = objectUrl;
  });
}

export function AvatarUploadCard({ compact = false }: { compact?: boolean }) {
  const { user, refreshUser } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type.toLowerCase()) && !/\.(png|jpe?g|gif|bmp|webp)$/i.test(file.name)) {
      setErrorMsg("Unsupported file type. Please choose a PNG, JPG, GIF, BMP, or WebP image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg("Selected image exceeds the 5 MB upload limit.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const normalizedFile = await normalizeWebpIfNeeded(selectedFile);
      await authApi.uploadAvatar(normalizedFile);
      await refreshUser();

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setSuccessMsg("Profile photo uploaded and converted into 64px, 256px, and 512px responsive sizes.");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to upload profile photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await authApi.removeAvatar();
      await refreshUser();
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setSuccessMsg("Profile photo removed.");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to remove profile photo.");
    } finally {
      setIsRemoving(false);
    }
  };

  const cancelSelection = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMsg(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const smVariant = user.avatarSmUrl || deriveAvatarVariantUrl(user.avatarUrl, "sm");
  const mdVariant = user.avatarUrl || deriveAvatarVariantUrl(user.avatarUrl, "md");
  const lgVariant = user.avatarLgUrl || deriveAvatarVariantUrl(user.avatarUrl, "lg");

  return (
    <Card className="border border-medinex-border">
      <CardHeader className="bg-slate-50/80 border-b border-medinex-border p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-medinex-teal" />
            <div>
              <h2 className="text-sm font-bold text-medinex-text">
                Profile Photo &amp; Responsive Resolutions
              </h2>
              <p className="text-[11px] text-medinex-muted">
                Uploads are automatically cropped square, stripped of EXIF metadata, and encoded into 64px, 256px, and 512px variants.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-medinex-teal border border-teal-200/70">
            <Sparkles className="w-3 h-3" />
            Multi-Res Engine
          </span>
        </div>
      </CardHeader>

      <CardBody className="p-6 space-y-5">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Active or Staged Avatar Preview */}
          <div className="flex items-center gap-4">
            {previewUrl ? (
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-medinex-teal shadow-md shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Selected avatar preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <UserAvatar
                src={user.avatarUrl}
                smSrc={user.avatarSmUrl}
                lgSrc={user.avatarLgUrl}
                fullName={user.fullName}
                username={user.username}
                size="lg"
                className="w-20 h-20 text-xl border-2 border-medinex-border shadow-md"
              />
            )}

            <div className="space-y-1">
              <p className="text-sm font-bold text-medinex-text">{user.fullName}</p>
              <p className="text-xs font-mono text-slate-500">@{user.username}</p>
              <p className="text-[11px] text-medinex-muted">
                PNG, JPG, GIF, BMP, or WebP &bull; Max 5 MB
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/bmp,image/webp"
              onChange={handleFileChange}
              className="hidden"
              id="medinex-avatar-input"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading || isRemoving}
              className="text-xs inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-medinex-teal" />
              <span>{selectedFile ? "Change Selection" : user.avatarUrl ? "Choose New Photo" : "Upload Photo"}</span>
            </Button>

            {selectedFile && (
              <>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="text-xs inline-flex items-center gap-1.5"
                >
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isUploading ? "Processing Sizes..." : "Save Photo"}</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelSelection}
                  disabled={isUploading}
                  className="text-xs text-slate-500"
                >
                  Cancel
                </Button>
              </>
            )}

            {user.avatarUrl && !selectedFile && (
              <Button
                type="button"
                variant="outline"
                size="sm"
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

        {/* Generated Multi-Resolution Inspection Strip */}
        {!compact && user.avatarUrl && !previewUrl && (
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-3">
              Active Multi-Resolution Variants Served Across MediNex
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <UserAvatar src={mdVariant} smSrc={smVariant} lgSrc={lgVariant} fullName={user.fullName} username={user.username} size="sm" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Small (64 &times; 64 px)</div>
                  <div className="text-[11px] text-slate-500">Comments, Replies &amp; Navbar</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <UserAvatar src={mdVariant} smSrc={smVariant} lgSrc={lgVariant} fullName={user.fullName} username={user.username} size="md" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Medium (256 &times; 256 px)</div>
                  <div className="text-[11px] text-slate-500">Post Cards &amp; Network Lists</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <UserAvatar src={mdVariant} smSrc={smVariant} lgSrc={lgVariant} fullName={user.fullName} username={user.username} size="lg" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Large (512 &times; 512 px)</div>
                  <div className="text-[11px] text-slate-500">Public Profile Hero Banner</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
