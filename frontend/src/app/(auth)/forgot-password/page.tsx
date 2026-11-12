"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await authApi.forgotPassword(cleanEmail);
      setIsSent(true);
      router.push(`/reset-password?email=${encodeURIComponent(cleanEmail)}&sent=1`);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to submit password reset request.");
      }
    } finally {
      setIsLoading(false);
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
          <h1 className="text-2xl font-bold text-medinex-text">Reset your password</h1>
          <p className="text-xs text-medinex-muted">
            Enter your registered email to receive a 6-digit password reset OTP.
          </p>
        </div>

        <Card className="shadow-subtle">
          <CardBody className="p-6 sm:p-8 space-y-5">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {isSent ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-medinex-teal flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-medinex-text">6-Digit Reset OTP Dispatched</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  If an account exists for <strong>{email}</strong>, a 6-digit password reset OTP has been sent from <span className="font-mono text-medinex-teal">medinexbd.noreply@gmail.com</span>. Please check your inbox (and spam folder).
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <Link href={`/reset-password?email=${encodeURIComponent(email.trim())}&sent=1`}>
                    <Button variant="primary" size="sm" className="w-full">
                      Enter 6-Digit OTP &amp; Reset Password
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="sm" className="w-full">
                      Return to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.org"
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medinex-teal"
                    />
                  </div>
                </div>

                <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                  Send 6-Digit Reset OTP
                </Button>

                <div className="pt-2 space-y-2 text-center">
                  <Link
                    href="/reset-password"
                    className="block text-xs font-semibold text-medinex-teal hover:underline"
                  >
                    Already have a reset OTP? Reset password
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-medinex-teal"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    <span>Back to login</span>
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
