"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Activity, MailCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

export default function VerifyEmailPage() {
  const [tokenInput, setTokenInput] = useState("");
  const [verified, setVerified] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      setVerified(true);
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
                <div className="p-3 bg-emerald-50 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                  <MailCheck className="w-4 h-4 text-medinex-teal shrink-0 mt-0.5" />
                  <span>
                    A 6-digit code or link was sent to your registered address during sign-up.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Verification Code / Token
                  </label>
                  <input
                    type="text"
                    required
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="e.g. 849201"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medinex-teal text-center tracking-widest font-mono text-sm"
                  />
                </div>

                <Button type="submit" variant="primary" className="w-full">
                  Confirm Email Address
                </Button>

                <div className="text-center pt-2">
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
