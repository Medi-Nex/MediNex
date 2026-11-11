"use client";

import React, { useEffect, useState } from "react";
import { X, ZoomIn, Pencil } from "lucide-react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string | null;
  fallbackSrc?: string | null;
  title: string;
  subtitle?: string;
  variant?: "avatar" | "banner";
  onEdit?: () => void;
  editLabel?: string;
}

export function ImagePreviewModal({
  isOpen,
  onClose,
  src,
  fallbackSrc,
  title,
  subtitle,
  variant = "avatar",
  onEdit,
  editLabel = "Edit",
}: ImagePreviewModalProps) {
  const [activeSrc, setActiveSrc] = useState<string | null>(src);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    setActiveSrc(src || fallbackSrc || null);
    setDimensions(null);
  }, [src, fallbackSrc, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !activeSrc) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} image preview`}
      onClick={onClose}
    >
      <div
        className={`relative w-full ${
          variant === "banner" ? "max-w-5xl" : "max-w-xl"
        } bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden text-white`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-950/70 border-b border-white/10">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate flex items-center gap-2">
              <ZoomIn className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="truncate">{title}</span>
            </h3>
            {subtitle && (
              <p className="text-[11px] text-slate-300 truncate mt-0.5">
                {subtitle}
                {dimensions ? ` • ${dimensions.w} × ${dimensions.h} px` : ""}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{editLabel}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close image preview"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Full-clarity image stage */}
        <div className="bg-slate-950 flex items-center justify-center p-3 sm:p-6 max-h-[82vh] overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeSrc}
            alt={title}
            onLoad={(e) => {
              const target = e.currentTarget;
              if (target.naturalWidth && target.naturalHeight) {
                setDimensions({ w: target.naturalWidth, h: target.naturalHeight });
              }
            }}
            onError={() => {
              if (fallbackSrc && activeSrc !== fallbackSrc) {
                setActiveSrc(fallbackSrc);
              } else {
                onClose();
              }
            }}
            className={
              variant === "banner"
                ? "w-full max-h-[68vh] object-contain rounded-xl shadow-lg"
                : "max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
            }
          />
        </div>
      </div>
    </div>
  );
}
