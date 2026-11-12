"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Activity, MailCheck, CheckCircle2, AlertCircle, RotateCw, Clock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import {
  OTP_RESEND_COOLDOWN_SECONDS,
  formatOtpCountdown,
  useOtpCooldown,
} from "@/lib/use-otp-cooldown";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const justSent = searchParams.get("sent") === "1";

  const [emailInput, setEmailInput] = useState(initialEmail);
  const [otpInput, setOtpInput] = useState("");
  const [verified, setVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendSuccessMessage, setResendSuccessMessage] = useState<string | null>(null);

  const { cooldownSeconds, startCooldown: startCooldownForEmail } = useOtpCooldown(
    "medinex_resend_until_",
    emailInput,
    initialEmail,
    justSent
  );

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    const cleanOtp = otpInput.replace(/\D/g, "").slice(0, 6);
    if (!cleanEmail || cleanOtp.length !== 6) return;

    setIsLoading(true);
    setErrorMessage(null);
    setResendSuccessMessage(null);

    try {
      await authApi.verifyEmail(cleanEmail, cleanOtp);
      setVerified(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to verify email. OTP may be invalid or expired.");
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
      setOtpInput("");
      startCooldownForEmail(cleanEmail, OTP_RESEND_COOLDOWN_SECONDS);
      setResendSuccessMessage(
        `A new 6-digit verification OTP has been dispatched from medinexbd.noreply@gmail.com to ${cleanEmail}.`
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
        setErrorMessage("Failed to resend verification OTP. Please try again shortly.");
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
          <h1 className="text-2xl font-bold text-medinex-text">OTP Email Verification</h1>
          <p className="text-xs text-medinex-muted">
            Enter the 6-digit OTP code sent to your email to activate your community account.
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
                    A 6-digit OTP was sent from <strong>medinexbd.noreply@gmail.com</strong> to{" "}
                    <strong>{emailInput.trim() || "your registered address"}</strong>. Valid for 10 minutes (max 5 attempts). Check inbox or spam folder.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medinex-teal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    pattern="\d{6}"
                    required
                    autoFocus
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medinex-teal text-center tracking-[0.45em] font-mono text-lg font-bold"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={!emailInput.trim() || otpInput.length !== 6}
                  isLoading={isLoading}
                >
                  Verify OTP &amp; Activate Account
                </Button>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <p className="text-[11px] font-semibold text-slate-600">
                    Didn&apos;t receive the OTP or code expired? Wait 2 minutes to resend:
                  </p>
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
                        <span>Resend OTP in {formatOtpCountdown(cooldownSeconds)}</span>
                      </>
                    ) : (
                      <>
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Resend Verification OTP</span>
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
          <div className="text-xs text-medinex-muted">Loading OTP verification page...</div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
