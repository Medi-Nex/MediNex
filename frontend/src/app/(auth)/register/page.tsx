"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Lock, Mail, User, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api/client";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const router = useRouter();
  const { register } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await register({
        fullName,
        username,
        email,
        password,
        agreeTerms,
      });
      setRegisteredSuccess(true);
      router.push(`/verify-email?email=${encodeURIComponent(email.trim())}&sent=1`);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected registration error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-medinex-light px-4 py-10 sm:py-16 pb-24 md:pb-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-dot-matrix opacity-[0.18] pointer-events-none" />
      <div className="max-w-md w-full space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 p-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-medinex-teal to-medinex-deep flex items-center justify-center text-white shadow-md">
              <Activity className="w-6 h-6 text-medinex-mint" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-medinex-text">
              Medi<span className="text-medinex-teal">Nex</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-medinex-text">Create your community account</h1>
          <p className="text-xs text-medinex-muted">
            Join other innovators, follow the 6 team contributors, and participate in discussions.
          </p>
        </div>

        <Card className="shadow-card border-medinex-border">
          <CardBody className="p-5 sm:p-8 space-y-5">
            {registeredSuccess ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-medinex-teal flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-medinex-text">Registration Successful!</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We have dispatched a 6-digit verification OTP to <strong>{email}</strong>.
                  Redirecting you to the OTP verification page...
                </p>
                <div className="pt-2">
                  <Link href={`/verify-email?email=${encodeURIComponent(email.trim())}&sent=1`}>
                    <Button variant="primary" size="sm" className="inline-flex items-center gap-1.5">
                      <span>Enter 6-Digit OTP</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Dr. Alex Rivera"
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medinex-teal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Username (Handle)
                    </label>
                    <div className="relative">
                      <span className="text-xs text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 font-bold">
                        @
                      </span>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                        placeholder="alexrivera"
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medinex-teal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@example.org"
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medinex-teal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password (Min 8 characters)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medinex-teal"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      required
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-medinex-teal focus:ring-medinex-teal"
                    />
                    <label htmlFor="agreeTerms" className="text-xs text-slate-600 leading-tight">
                      I agree to the{" "}
                      <Link href="/terms" className="text-medinex-teal underline">
                        Terms of Service
                      </Link>{" "}
                      and acknowledge that MediNex does not store medical records as per the{" "}
                      <Link href="/privacy" className="text-medinex-teal underline">
                        Privacy Policy
                      </Link>
                      .
                    </label>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={!agreeTerms}
                    isLoading={isLoading}
                  >
                    Create Account
                  </Button>
                </form>

                <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-medinex-teal hover:underline">
                    Sign in
                  </Link>
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
