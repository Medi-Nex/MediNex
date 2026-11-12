"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Trash2,
  Move,
  Maximize2,
  Minimize2,
  Eye,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { authApi, AuthUser } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { resolveMediaUrl } from "@/lib/media";

const BANNER_EXPORT_WIDTH = 1600;
const BANNER_EXPORT_HEIGHT = 400;
const BANNER_ASPECT = BANNER_EXPORT_WIDTH / BANNER_EXPORT_HEIGHT; // 4.0
const MAX_SOURCE_BYTES = 15 * 1024 * 1024; // Pre-crop raw selection allowed up to 15 MB
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/bmp",
]);

type CropMode = "cover" | "contain";

interface BannerCropUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Pick<
    AuthUser,
    "id" | "username" | "fullName" | "headline" | "designation" | "avatarUrl" | "avatarSmUrl" | "avatarLgUrl" | "coverImageUrl"
  >;
  onUpdated?: (updatedUser: AuthUser) => void | Promise<void>;
}

interface ImageDimensions {
  width: number;
  height: number;
}

export function BannerCropUploadModal({
  isOpen,
  onClose,
  user,
  onUpdated,
}: BannerCropUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceIsObjectUrl, setSourceIsObjectUrl] = useState(false);
  const [imgDims, setImgDims] = useState<ImageDimensions | null>(null);
  const [stageWidth, setStageWidth] = useState<number>(720);

  // Interactive crop state
  const [cropMode, setCropMode] = useState<CropMode>("cover");
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0); // normalized pixels on export canvas (-max..+max or relative)
  const [panY, setPanY] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0); // 0 | 90 | 180 | 270
  const [showOverlayGuide, setShowOverlayGuide] = useState<boolean>(true);
  const [showCardPreview, setShowCardPreview] = useState<boolean>(true);

  const [isDragging, setIsDragging] = useState(false);
  const dragOriginRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasUnsavedEdit, setHasUnsavedEdit] = useState(false);

  const existingBannerResolved = resolveMediaUrl(user.coverImageUrl);

  const resetTransform = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setRotation(0);
    setCropMode("cover");
  }, []);

  // Load existing banner or clear when opening
  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setHasUnsavedEdit(false);
    resetTransform();

    if (existingBannerResolved) {
      setSourceUrl(existingBannerResolved);
      setSourceIsObjectUrl(false);
    } else {
      setSourceUrl(null);
      setSourceIsObjectUrl(false);
      setImgDims(null);
      loadedImageRef.current = null;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving && !isRemoving) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, existingBannerResolved, resetTransform, isSaving, isRemoving, onClose]);

  // Revoke object URLs safely on change/unmount
  useEffect(() => {
    return () => {
      if (sourceIsObjectUrl && sourceUrl) {
        URL.revokeObjectURL(sourceUrl);
      }
    };
  }, [sourceUrl, sourceIsObjectUrl]);

  // Track responsive stage width so drag sensitivity matches 1:1 on phone and desktop
  useEffect(() => {
    if (!isOpen || !stageRef.current) return;
    const updateSize = () => {
      if (stageRef.current) {
        setStageWidth(stageRef.current.clientWidth || 720);
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, [isOpen, sourceUrl]);

  // Decode selected/existing image into offscreen HTMLImageElement
  useEffect(() => {
    if (!sourceUrl) {
      loadedImageRef.current = null;
      setImgDims(null);
      return;
    }

    let cancelled = false;
    const img = new Image();
    if (!sourceUrl.startsWith("blob:") && !sourceUrl.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      if (cancelled) return;
      loadedImageRef.current = img;
      setImgDims({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      if (cancelled) return;
      loadedImageRef.current = null;
      setImgDims(null);
      if (sourceIsObjectUrl) {
        setErrorMsg("Could not decode the selected image. Try a standard PNG, JPG, or WebP image.");
      }
    };
    img.src = sourceUrl;

    return () => {
      cancelled = true;
    };
  }, [sourceUrl, sourceIsObjectUrl]);

  // Effective rotated source dimensions
  const effectiveDims = useCallback(() => {
    if (!imgDims) return { w: 1600, h: 400 };
    const swapped = rotation === 90 || rotation === 270;
    return {
      w: swapped ? imgDims.height : imgDims.width,
      h: swapped ? imgDims.width : imgDims.height,
    };
  }, [imgDims, rotation]);

  // Render exact WYSIWYG output on a target canvas (used for BOTH live card preview and 1600x400 export)
  const drawCroppedBannerToCanvas = useCallback(
    (canvas: HTMLCanvasElement, targetWidth: number, targetHeight: number) => {
      const img = loadedImageRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx || !img || !imgDims) return false;

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const { w: effW, h: effH } = effectiveDims();
      const targetRatio = targetWidth / targetHeight;
      const srcRatio = effW / effH;

      // Base dimensions at zoom === 1
      let baseW: number;
      let baseH: number;
      if (cropMode === "cover") {
        if (srcRatio > targetRatio) {
          baseH = targetHeight;
          baseW = baseH * srcRatio;
        } else {
          baseW = targetWidth;
          baseH = baseW / srcRatio;
        }
      } else {
        // contain: whole image fits cleanly inside banner without edge chopping
        if (srcRatio > targetRatio) {
          baseW = targetWidth * 0.96;
          baseH = baseW / srcRatio;
        } else {
          baseH = targetHeight * 0.94;
          baseW = baseH * srcRatio;
        }
      }

      const drawW = baseW * zoom;
      const drawH = baseH * zoom;

      // Convert normalized pan (-1..+1 relative to target stage) or bounded pixels
      const scaleFactor = targetWidth / BANNER_EXPORT_WIDTH;
      const offsetX = panX * scaleFactor;
      const offsetY = panY * scaleFactor;

      // Deep dark studio backdrop (especially visible in Contain/Fit mode)
      const bgGrad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
      bgGrad.addColorStop(0, "#0B3B3C");
      bgGrad.addColorStop(0.5, "#0E5A58");
      bgGrad.addColorStop(1, "#0D9488");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      if (cropMode === "contain") {
        // Blurred studio backdrop fill so uncropped photos look crisp & intentional
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.filter = "blur(24px)";
        const backdropScale = Math.max(targetWidth / effW, targetHeight / effH) * 1.15;
        const bdW = effW * backdropScale;
        const bdH = effH * backdropScale;
        ctx.translate(targetWidth / 2, targetHeight / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        const rawBdW = rotation === 90 || rotation === 270 ? bdH : bdW;
        const rawBdH = rotation === 90 || rotation === 270 ? bdW : bdH;
        ctx.drawImage(img, -rawBdW / 2, -rawBdH / 2, rawBdW, rawBdH);
        ctx.restore();
        ctx.filter = "none";

        ctx.fillStyle = "rgba(7, 26, 24, 0.36)";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      // Draw crisp primary positioned photo
      ctx.save();
      ctx.translate(targetWidth / 2 + offsetX, targetHeight / 2 + offsetY);
      ctx.rotate((rotation * Math.PI) / 180);
      const rawDrawW = rotation === 90 || rotation === 270 ? drawH : drawW;
      const rawDrawH = rotation === 90 || rotation === 270 ? drawW : drawH;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, -rawDrawW / 2, -rawDrawH / 2, rawDrawW, rawDrawH);
      ctx.restore();

      return true;
    },
    [imgDims, effectiveDims, cropMode, zoom, panX, panY, rotation]
  );

  // Clamp pan softly when zooming/rotating in cover mode so edges never show accidental gaps
  const clampPan = useCallback(
    (nextX: number, nextY: number, nextZoom = zoom, mode = cropMode) => {
      if (!imgDims) return { x: nextX, y: nextY };
      const { w: effW, h: effH } = effectiveDims();
      const srcRatio = effW / effH;

      let baseW: number;
      let baseH: number;
      if (mode === "cover") {
        if (srcRatio > BANNER_ASPECT) {
          baseH = BANNER_EXPORT_HEIGHT;
          baseW = baseH * srcRatio;
        } else {
          baseW = BANNER_EXPORT_WIDTH;
          baseH = baseW / srcRatio;
        }
        const maxPanX = Math.max(0, (baseW * nextZoom - BANNER_EXPORT_WIDTH) / 2);
        const maxPanY = Math.max(0, (baseH * nextZoom - BANNER_EXPORT_HEIGHT) / 2);
        return {
          x: Math.max(-maxPanX, Math.min(maxPanX, nextX)),
          y: Math.max(-maxPanY, Math.min(maxPanY, nextY)),
        };
      }

      // In contain mode allow flexible positioning up to half frame
      const maxX = BANNER_EXPORT_WIDTH * 0.45;
      const maxY = BANNER_EXPORT_HEIGHT * 0.45;
      return {
        x: Math.max(-maxX, Math.min(maxX, nextX)),
        y: Math.max(-maxY, Math.min(maxY, nextY)),
      };
    },
    [imgDims, effectiveDims, zoom, cropMode]
  );

  // Redraw mini card preview + stage canvas cleanly on state changes
  useEffect(() => {
    if (!isOpen || !imgDims || !previewCanvasRef.current) return;
    drawCroppedBannerToCanvas(previewCanvasRef.current, 800, 200);
  }, [isOpen, imgDims, drawCroppedBannerToCanvas]);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setErrorMsg(null);
    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      setErrorMsg("Unsupported image format. Please choose PNG, JPG, JPEG, WebP, GIF, or BMP.");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setErrorMsg("Selected file is larger than 15 MB. Please choose a smaller photo.");
      return;
    }

    if (sourceIsObjectUrl && sourceUrl) {
      URL.revokeObjectURL(sourceUrl);
    }

    const nextObjUrl = URL.createObjectURL(file);
    resetTransform();
    setSourceUrl(nextObjUrl);
    setSourceIsObjectUrl(true);
    setHasUnsavedEdit(true);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!imgDims) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragOriginRef.current = { x: e.clientX, y: e.clientY, panX, panY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragOriginRef.current) return;
    const pxRatio = BANNER_EXPORT_WIDTH / Math.max(stageWidth, 320);
    const dx = (e.clientX - dragOriginRef.current.x) * pxRatio;
    const dy = (e.clientY - dragOriginRef.current.y) * pxRatio;
    const clamped = clampPan(dragOriginRef.current.panX + dx, dragOriginRef.current.panY + dy);
    setPanX(clamped.x);
    setPanY(clamped.y);
    setHasUnsavedEdit(true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
      dragOriginRef.current = null;
    }
  };

  const handleZoomChange = (nextZoom: number) => {
    const clampedZoom = Math.max(0.5, Math.min(3, nextZoom));
    setZoom(clampedZoom);
    const clamped = clampPan(panX, panY, clampedZoom, cropMode);
    setPanX(clamped.x);
    setPanY(clamped.y);
    setHasUnsavedEdit(true);
  };

  const handleModeChange = (mode: CropMode) => {
    setCropMode(mode);
    const minZoomForMode = mode === "cover" ? Math.max(1, zoom) : 1;
    setZoom(minZoomForMode);
    setPanX(0);
    setPanY(0);
    setHasUnsavedEdit(true);
  };

  const handleRotate = (delta: number) => {
    const nextRot = (rotation + delta + 360) % 360;
    setRotation(nextRot);
    setPanX(0);
    setPanY(0);
    setHasUnsavedEdit(true);
  };

  const handleSaveBanner = async () => {
    if (!loadedImageRef.current || !imgDims) {
      setErrorMsg("Please choose an image to crop and upload as your banner.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const exportCanvas = document.createElement("canvas");
      const drawn = drawCroppedBannerToCanvas(
        exportCanvas,
        BANNER_EXPORT_WIDTH,
        BANNER_EXPORT_HEIGHT
      );
      if (!drawn) {
        throw new Error("Could not render banner canvas.");
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        exportCanvas.toBlob(
          (result) => {
            if (result) resolve(result);
            else reject(new Error("Could not export cropped banner image."));
          },
          "image/jpeg",
          0.92
        );
      });

      const bannerFile = new File([blob], "profile-banner.jpg", { type: "image/jpeg" });
      const updatedUser = await authApi.uploadBanner(bannerFile);
      if (onUpdated) {
        await onUpdated(updatedUser);
      }
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else if (err instanceof Error && err.message.toLowerCase().includes("tainted")) {
        setErrorMsg("Please re-select the image file from your device before re-cropping.");
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to upload profile banner.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveBanner = async () => {
    setIsRemoving(true);
    setErrorMsg(null);
    try {
      const updatedUser = await authApi.removeBanner();
      if (onUpdated) {
        await onUpdated(updatedUser);
      }
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to remove profile banner.");
      }
    } finally {
      setIsRemoving(false);
    }
  };

  if (!isOpen) return null;

  // CSS transforms matching the exact canvas export geometry in the interactive stage
  const stageHeight = stageWidth / BANNER_ASPECT;
  const eff = effectiveDims();
  const srcRatio = eff.w / eff.h;
  let stageBaseW = stageWidth;
  let stageBaseH = stageHeight;
  if (imgDims) {
    if (cropMode === "cover") {
      if (srcRatio > BANNER_ASPECT) {
        stageBaseH = stageHeight;
        stageBaseW = stageBaseH * srcRatio;
      } else {
        stageBaseW = stageWidth;
        stageBaseH = stageBaseW / srcRatio;
      }
    } else {
      if (srcRatio > BANNER_ASPECT) {
        stageBaseW = stageWidth * 0.96;
        stageBaseH = stageBaseW / srcRatio;
      } else {
        stageBaseH = stageHeight * 0.94;
        stageBaseW = stageBaseH * srcRatio;
      }
    }
  }
  const pxScale = stageWidth / BANNER_EXPORT_WIDTH;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-2.5 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Edit profile banner"
      onClick={() => !isSaving && !isRemoving && onClose()}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-2xl border border-medinex-border shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-medinex-text">
              Customize Profile Banner (1600 &times; 400 px)
            </h2>
            <p className="text-xs text-medinex-muted mt-0.5">
              Drag to reposition, adjust zoom or fit mode, and preview exactly how your profile hero card will look.
            </p>
          </div>
          <button
            type="button"
            disabled={isSaving || isRemoving}
            onClick={onClose}
            aria-label="Close banner editor"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Hidden native file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp"
            onChange={handleFileSelected}
            className="hidden"
          />

          {/* Interactive 4:1 Crop Stage */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-700 inline-flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-medinex-teal" />
                {imgDims
                  ? `Interactive 4:1 Editor — Drag image to frame (${imgDims.width} × ${imgDims.height} px source)`
                  : "Upload a cover banner photo to frame and crop"}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOverlayGuide((v) => !v)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                    showOverlayGuide
                      ? "bg-teal-50 text-teal-800 border-teal-200"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {showOverlayGuide ? "Hide Profile Guides" : "Show Profile Guides"}
                </button>
              </div>
            </div>

            <div
              ref={stageRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`relative w-full aspect-[4/1] rounded-xl overflow-hidden border-2 select-none touch-none ${
                imgDims
                  ? isDragging
                    ? "border-medinex-teal cursor-grabbing shadow-md"
                    : "border-medinex-teal/60 cursor-grab shadow-sm"
                  : "border-dashed border-slate-300 bg-gradient-to-br from-medinex-dark via-medinex-deep to-medinex-teal"
              }`}
            >
              {sourceUrl && imgDims ? (
                <>
                  {/* Subtle blurred backdrop behind Contain mode */}
                  {cropMode === "contain" && (
                    <div
                      className="absolute inset-0 bg-cover bg-center scale-110 blur-xl opacity-45 pointer-events-none"
                      style={{ backgroundImage: `url("${sourceUrl}")` }}
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sourceUrl}
                      alt="Banner crop preview"
                      draggable={false}
                      style={{
                        width: `${(rotation === 90 || rotation === 270 ? stageBaseH : stageBaseW) * zoom}px`,
                        height: `${(rotation === 90 || rotation === 270 ? stageBaseW : stageBaseH) * zoom}px`,
                        maxWidth: "none",
                        maxHeight: "none",
                        transform: `translate(${panX * pxScale}px, ${panY * pxScale}px) rotate(${rotation}deg)`,
                      }}
                      className="select-none pointer-events-none"
                    />
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4 text-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Select Banner Image</span>
                  </button>
                  <p className="text-[11px] text-teal-100 mt-1.5 hidden sm:block">
                    Recommended: Wide landscape image (PNG, JPG, WebP) — you can resize, zoom &amp; reposition right here.
                  </p>
                </div>
              )}

              {/* Ghosted Hero Overlap Guides matching real /users/[username] and /team/[username] */}
              {showOverlayGuide && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-2.5 right-3 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-white/25 text-[10px] font-semibold text-white/85 backdrop-blur-xs">
                    Badge Zone
                  </div>
                  <div className="absolute -bottom-5 left-4 sm:left-7 w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-white/25 border-2 border-dashed border-white/75 flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
                    Avatar
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Crop, Fit, Zoom & Rotation Controls */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 sm:p-4 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving || isRemoving}
                  className="text-xs border-medinex-teal text-medinex-deep hover:bg-teal-50 inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{sourceUrl ? "Choose Another Image" : "Upload Image"}</span>
                </Button>

                {imgDims && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleModeChange("cover")}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border inline-flex items-center gap-1 transition-colors ${
                        cropMode === "cover"
                          ? "bg-medinex-dark text-white border-medinex-dark"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Fill &amp; Crop (4:1)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleModeChange("contain")}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border inline-flex items-center gap-1 transition-colors ${
                        cropMode === "contain"
                          ? "bg-medinex-dark text-white border-medinex-dark"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span>Fit Full Image</span>
                    </button>
                  </>
                )}
              </div>

              {imgDims && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleRotate(-90)}
                    title="Rotate 90° left"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRotate(90)}
                    title="Rotate 90° right"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1);
                      setPanX(0);
                      setPanY(0);
                      setHasUnsavedEdit(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Center
                  </button>
                </div>
              )}
            </div>

            {imgDims && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleZoomChange(zoom - 0.1)}
                  aria-label="Zoom out"
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-medinex-teal"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 flex items-center gap-3">
                  <input
                    type="range"
                    aria-label="Banner zoom"
                    min={cropMode === "contain" ? 0.5 : 1}
                    max={3}
                    step={0.02}
                    value={zoom}
                    onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-slate-700 w-12 text-right">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleZoomChange(zoom + 0.1)}
                  aria-label="Zoom in"
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-medinex-teal"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Exact Rendered Profile Card Preview ("thik jemon dekhabe ovabe") */}
          {imgDims && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 inline-flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-medinex-teal" />
                  <span>Live Profile Card Appearance</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowCardPreview((v) => !v)}
                  className="text-[11px] font-semibold text-medinex-teal hover:underline"
                >
                  {showCardPreview ? "Collapse Preview" : "Show Preview"}
                </button>
              </div>

              {showCardPreview && (
                <div className="rounded-xl border border-medinex-border bg-white overflow-hidden shadow-sm">
                  <div className="relative w-full aspect-[4/1] bg-slate-900 overflow-hidden">
                    <canvas
                      ref={previewCanvasRef}
                      className="w-full h-full object-cover block"
                    />
                    <div className="absolute top-2 right-2.5 px-2 py-0.5 rounded-full bg-white/90 text-[10px] font-bold text-medinex-deep shadow-xs">
                      Verified Contributor
                    </div>
                  </div>
                  <div className="px-4 sm:px-6 pb-3.5 relative">
                    <div className="flex items-start gap-3">
                      <div className="-mt-8 sm:-mt-10 p-1 bg-white rounded-xl border border-medinex-border shadow-md inline-flex shrink-0">
                        <UserAvatar
                          src={user.avatarUrl}
                          smSrc={user.avatarSmUrl}
                          lgSrc={user.avatarLgUrl}
                          fullName={user.fullName}
                          username={user.username}
                          size="lg"
                          shape="rounded"
                          className="border-0 shadow-none"
                        />
                      </div>
                      <div className="pt-2 min-w-0">
                        <div className="text-sm font-extrabold text-medinex-text truncate">
                          {user.fullName}
                        </div>
                        <div className="text-[11px] font-semibold text-medinex-teal truncate">
                          @{user.username}
                          {user.headline || user.designation
                            ? ` • ${user.headline || user.designation}`
                            : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <div>
            {user.coverImageUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveBanner}
                disabled={isSaving || isRemoving}
                className="text-xs border-rose-200 text-rose-600 hover:bg-rose-50 inline-flex items-center gap-1.5"
              >
                {isRemoving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Remove Banner</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSaving || isRemoving}
              className="text-xs text-slate-600"
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveBanner}
              disabled={
                !imgDims ||
                isSaving ||
                isRemoving ||
                (!hasUnsavedEdit && !sourceIsObjectUrl && Boolean(user.coverImageUrl))
              }
              className="text-xs inline-flex items-center gap-1.5"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? "Saving 1600×400..." : "Apply & Save Banner"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
