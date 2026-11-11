"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Activity, MailCheck, CheckCircle2, AlertCircle, RotateCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

const RESEND_COOLDOWN_SECONDS = 120;

function formatCountdown(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const justSent = searchParams.get("sent") === "1";

  const [emailInput, setEmailInput] = useState(initialEmail);
  const [tokenInput, setTokenInput] = useState("");
  const [verified, setVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [resendTrigger, setResendTrigger] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendSuccessMessage, setResendSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const emailKey = emailInput.trim().toLowerCase();
    if (!emailKey) return;

    const storageKey = `medinex_resend_until_${emailKey}`;
    let untilMs = Number(window.sessionStorage.getItem(storageKey) || "0");

    if ((!untilMs || Number.isNaN(untilMs)) && justSent && emailKey === initialEmail.trim().toLowerCase()) {
      untilMs = Date.now() + RESEND_COOLDOWN_SECONDS * 1000;
      window.sessionStorage.setItem(storageKey, String(untilMs));
    }

    const syncRemaining = () => {
      const storedUntil = Number(window.sessionStorage.getItem(storageKey) || String(untilMs) || "0");
      const remaining = storedUntil > 0 ? Math.max(0, Math.ceil((storedUntil - Date.now()) / 1000)) : 0;
      setCooldownSeconds(remaining);
      if (remaining <= 0) {
        window.sessionStorage.removeItem(storageKey);
      }
    };

    const immediateTimer = window.setTimeout(syncRemaining, 0);
    const interval = window.setInterval(syncRemaining, 1000);
    return () => {
      window.clearTimeout(immediateTimer);
      window.clearInterval(interval);
    };
  }, [emailInput, initialEmail, justSent, resendTrigger]);

  const startCooldownForEmail = (targetEmail: string, seconds: number) => {
    const emailKey = targetEmail.trim().toLowerCase();
    if (!emailKey) return;
    const storageKey = `medinex_resend_until_${emailKey}`;
    window.sessionStorage.setItem(storageKey, String(Date.now() + seconds * 1000));
    setCooldownSeconds(seconds);
    setResendTrigger((prev) => prev + 1);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await authApi.verifyEmail(tokenInput.trim());
      setVerified(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to verify email. Token may be invalid or expired.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    const cleanEmail = emailInput.trim();
    if (!cleanEmail || isResending || cooldownSeconds > 0) return;

    setIsResending(true);
    setErrorMessage(null);
    setResendSuccessMessage(null);

    try {
      await authApi.resendVerification(cleanEmail);
      startCooldownForEmail(cleanEmail, RESEND_COOLDOWN_SECONDS);
      setResendSuccessMessage(
        `A new verification code has been dispatched from medinexbd.noreply@gmail.com to ${cleanEmail}.`
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
        const match = err.message.match(/wait\s+(\d+)\s+second/i);
        if (err.status === 429 && match) {
          startCooldownForEmail(cleanEmail, Number(match[1]));
        }
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to resend verification email. Please try again shortly.");
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-medinex-light px-4 py-16">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 p-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-medinex-teal to-medinex-deep flex items-center justify-center text-white shadow-md">
              <Activity className="w-6 h-6 text-medinex-mint" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-medinex-text">
              Medi<span className="text-medinex-teal">Nex</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-medinex-text">Email Verification</h1>
          <p className="text-xs text-medinex-muted">
            Confirm your email address to activate your community posting and following privileges.
          </p>
        </div>

        <Card className="shadow-subtle">
          <CardBody className="p-6 sm:p-8 space-y-5 text-center">
            {verified ? (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-medinex-teal flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-medinex-text">Email Address Verified!</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your email has been confirmed. You now have full community access on MediNex.
                </p>
                <Link href="/login" className="inline-block pt-2">
                  <Button variant="primary" size="sm">
                    Sign In to Community
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4 text-left">
                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {resendSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-medinex-teal shrink-0 mt-0.5" />
                    <span>{resendSuccessMessage}</span>
                  </div>
                )}

                <div className="p-3 bg-emerald-50 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                  <MailCheck className="w-4 h-4 text-medinex-teal shrink-0 mt-0.5" />
                  <span>
                    A verification code was sent from <strong>medinexbd.noreply@gmail.com</strong> to{" "}
                    <strong>{emailInput.trim() || "your registered address"}</strong>. Please check your inbox (and spam folder) and enter it below.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Verification Code / Token
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Enter verification code from email"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medinex-teal text-center tracking-widest font-mono text-sm"
                  />
                </div>

                <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                  Verify Email &amp; Activate Account
                </Button>

                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                  <p className="text-[11px] font-semibold text-slate-600">
                    Didn&apos;t receive the code? Resend verification email (2-minute cooldown):
                  </p>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter your registered email address"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medinex-teal"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full inline-flex items-center justify-center gap-1.5"
                    disabled={!emailInput.trim() || cooldownSeconds > 0 || isResending}
                    isLoading={isResending}
                    onClick={handleResend}
                  >
                    {cooldownSeconds > 0 ? (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Resend Code in {formatCountdown(cooldownSeconds)}</span>
                      </>
                    ) : (
                      <>
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Resend Verification Code</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center pt-1">
                  <Link href="/login" className="text-xs text-medinex-teal hover:underline font-semibold">
                    Skip for now and go to Login
                  </Link>
                </div>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-medinex-light px-4 py-16">
          <div className="text-xs text-medinex-muted">Loading verification page...</div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
