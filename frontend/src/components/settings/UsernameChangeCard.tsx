"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AtSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth-context";
import { authApi, UsernameAvailabilityResult } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { getUserProfileHref } from "@/lib/media";
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  sanitizeUsernameInput,
  validateUsernameLocally,
} from "@/lib/username";

interface UsernameChangeCardProps {
  compact?: boolean;
}

export function UsernameChangeCard({ compact = false }: UsernameChangeCardProps) {
  const { user, refreshUser } = useAuth();

  const [candidate, setCandidate] = useState<string>(user?.username || "");
  const [availability, setAvailability] = useState<UsernameAvailabilityResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.username) {
      setCandidate(user.username);
    }
  }, [user?.username]);

  const currentUsername = user?.username || "";
  const isUnchanged = candidate.toLowerCase() === currentUsername.toLowerCase();
  const localValidationError =
    candidate.length === 0 || isUnchanged ? null : validateUsernameLocally(candidate);

  useEffect(() => {
    if (!user || !candidate || isUnchanged || localValidationError) {
      setAvailability(null);
      setIsChecking(false);
      return;
    }

    let cancelled = false;
    setIsChecking(true);

    const timer = setTimeout(async () => {
      try {
        const res = await authApi.checkUsernameAvailability(candidate);
        if (!cancelled) {
          setAvailability(res);
        }
      } catch {
        if (!cancelled) {
          setAvailability(null);
        }
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    }, 320);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [candidate, isUnchanged, localValidationError, user]);

  if (!user) return null;

  const canSubmit =
    !isSaving &&
    !isChecking &&
    !isUnchanged &&
    candidate.length >= USERNAME_MIN_LENGTH &&
    !localValidationError &&
    (availability ? availability.available && !availability.current : true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const localErr = validateUsernameLocally(candidate);
    if (localErr) {
      setErrorMsg(localErr);
      return;
    }
    if (isUnchanged) {
      return;
    }

    setIsSaving(true);
    try {
      const updated = await authApi.updateUsername(candidate);
      await refreshUser();
      setCandidate(updated.username);
      setAvailability(null);
      setSuccessMsg(`Username updated cleanly to @${updated.username}.`);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.errors?.username || err.message);
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to update username.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={compact ? "border-medinex-border bg-slate-50/70" : "border border-medinex-border"}>
      <CardHeader className={compact ? "py-3.5 px-4" : "bg-slate-50/80 border-b border-medinex-border p-5"}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-medinex-text flex items-center gap-2">
              <AtSign className="w-4 h-4 text-medinex-teal shrink-0" />
              <span>Username &amp; Profile Handle</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-medinex-muted mt-0.5">
              Customize your unique @handle used for sign-in and your public profile URL.
            </p>
          </div>
          <Badge variant="mint" className="text-[11px] font-mono w-fit">
            @{currentUsername}
          </Badge>
        </div>
      </CardHeader>

      <CardBody className={compact ? "p-4 space-y-3" : "p-6 space-y-4"}>
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-medinex-teal shrink-0" />
              <span>{successMsg}</span>
            </div>
            <Link
              href={getUserProfileHref(user.username)}
              className="inline-flex items-center gap-1 font-semibold text-medinex-teal hover:underline shrink-0"
            >
              <span>View Updated Profile</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="username-handle-input"
                className="block text-xs font-semibold text-slate-700"
              >
                New Username Handle
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {candidate.length}/{USERNAME_MAX_LENGTH}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <span className="text-xs text-slate-400 font-bold absolute left-3.5 top-1/2 -translate-y-1/2">
                  @
                </span>
                <input
                  id="username-handle-input"
                  type="text"
                  value={candidate}
                  onChange={(e) => {
                    setCandidate(sanitizeUsernameInput(e.target.value));
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  maxLength={USERNAME_MAX_LENGTH}
                  autoComplete="username"
                  placeholder="your_new_handle"
                  className="w-full text-xs pl-8 pr-9 py-2.5 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-medinex-teal"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isChecking ? (
                    <Loader2 className="w-4 h-4 animate-spin text-medinex-teal" />
                  ) : !isUnchanged && candidate.length > 0 && !localValidationError && availability?.available ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : !isUnchanged &&
                    candidate.length > 0 &&
                    (localValidationError || (availability && !availability.available)) ? (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!isUnchanged && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCandidate(currentUsername);
                      setErrorMsg(null);
                      setAvailability(null);
                    }}
                    className="text-xs inline-flex items-center gap-1"
                    title="Reset to current handle"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </Button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={!canSubmit}
                  isLoading={isSaving}
                  className="text-xs whitespace-nowrap"
                >
                  Update Username
                </Button>
              </div>
            </div>

            {/* Live feedback + URL preview */}
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px]">
              <div className="min-h-[18px]">
                {isUnchanged ? (
                  <span className="text-slate-500">
                    This is your current handle. Use 3-50 chars (a-z, 0-9, _ or -).
                  </span>
                ) : localValidationError ? (
                  <span className="text-rose-600 font-medium">{localValidationError}</span>
                ) : isChecking ? (
                  <span className="text-medinex-teal font-medium">Checking availability...</span>
                ) : availability ? (
                  <span
                    className={
                      availability.available
                        ? "text-emerald-700 font-semibold"
                        : "text-rose-600 font-medium"
                    }
                  >
                    {availability.message}
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Allowed: lowercase letters, numbers, underscores (_), hyphens (-).
                  </span>
                )}
              </div>

              {candidate && (
                <span className="text-slate-400 font-mono truncate">
                  Profile URL: /users/{candidate}
                </span>
              )}
            </div>
          </div>
        </form>

        <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-100 text-[11px] text-slate-600 leading-relaxed">
          All of your existing posts, comments, followers, profile photo, and cover banner remain
          attached automatically, and your active session stays signed in. After changing, sign in
          with either your email or your new <strong className="font-mono text-medinex-text">@{candidate || currentUsername}</strong> handle.
        </div>
      </CardBody>
    </Card>
  );
}
