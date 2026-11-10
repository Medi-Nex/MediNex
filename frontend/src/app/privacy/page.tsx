import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export const metadata = {
  title: "Privacy Policy & Healthcare Data Governance",
  description: "MediNex Privacy Policy emphasizing strict healthcare data separation and protection of community members.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-medinex-light pb-20">
      {/* Dark Header */}
      <section className="bg-medinex-dark text-white py-14 border-b border-emerald-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <Badge variant="mint">Governance &amp; Privacy</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            MediNex Privacy Policy
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Effective Date: February 2026 &bull; Formatted for E-Health Hackathon 2026 Compliance
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
        {/* Cardinal Rule Box */}
        <div className="p-6 bg-emerald-50 border-2 border-medinex-teal/40 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-medinex-deep font-bold text-base">
            <ShieldCheck className="w-6 h-6 text-medinex-teal" />
            <span>Core Principle: Absolute Medical Data Isolation</span>
          </div>
          <p className="text-slate-800">
            <strong>No Patient Medical Records Belong Here.</strong> The MediNex community platform is
            strictly an engineering collaboration and social dialogue hub. We do NOT collect, process, or
            store Protected Health Information (PHI), patient medical charts, clinical prescriptions, or
            diagnostic scans within the MediNex database.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3 bg-white p-6 sm:p-8 rounded-xl border border-medinex-border">
          <h2 className="text-lg font-bold text-medinex-text">1. Information We Collect</h2>
          <p>
            When you register for an account on the MediNex community platform, we collect only the minimal
            information needed to maintain your public profile and authentic identity:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Account credentials (username, email address, cryptographic password hash).</li>
            <li>Public profile information you choose to provide (full name, academic department, university affiliation, skills, biography).</li>
            <li>Community content (public discussion posts, comments, likes, and follow relationships).</li>
            <li>Technical telemetry (IP address, user agent, timestamps recorded exclusively in security audit logs for spam defense).</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 bg-white p-6 sm:p-8 rounded-xl border border-medinex-border">
          <h2 className="text-lg font-bold text-medinex-text">2. Separation of ShasthoSetu Telemedicine R&amp;D</h2>
          <p>
            ShasthoSetu is an independent telemedicine research initiative. Its experimental triage protocols
            are managed in an entirely segregated sandbox environment. Social accounts and community tokens
            issued by MediNex grant zero privilege to any medical triage queues or clinical data stores.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 bg-white p-6 sm:p-8 rounded-xl border border-medinex-border">
          <h2 className="text-lg font-bold text-medinex-text">3. Authentication &amp; Cookie Usage</h2>
          <p>
            MediNex uses secure, rotating JSON Web Tokens (JWT) and HttpOnly, Secure, SameSite cookies to
            maintain authenticated sessions. We do not use third-party behavioral advertising cookies or
            cross-site tracking beacons.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 bg-white p-6 sm:p-8 rounded-xl border border-medinex-border">
          <h2 className="text-lg font-bold text-medinex-text">4. Account Deletion and Data Rights</h2>
          <p>
            Every community user retains the right to export their public contributions or permanently delete
            their account. Upon deletion, personal identifiers and credentials are permanently purged from
            the active relational database.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 bg-white p-6 sm:p-8 rounded-xl border border-medinex-border">
          <h2 className="text-lg font-bold text-medinex-text">5. Contact Data Privacy Officer</h2>
          <p>
            If you have questions regarding our compliance practices, please reach out via our{" "}
            <Link href="/contact" className="text-medinex-teal underline font-semibold">
              Contact Form
            </Link>{" "}
            or email us at <strong>privacy@medinex.health</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
