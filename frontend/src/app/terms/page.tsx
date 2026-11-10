import React from "react";
import { Badge } from "@/components/ui/Badge";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of service and community guidelines for the MediNex platform.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-medinex-light pb-20">
      {/* Dark Header */}
      <section className="bg-medinex-dark text-white py-14 border-b border-emerald-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <Badge variant="mint">Platform Rules</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            MediNex Terms of Service
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Effective Date: February 2026 &bull; E-Health Hackathon 2026 Participation Standards
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <section className="bg-white p-6 sm:p-8 rounded-xl border border-medinex-border space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-medinex-text">1. Nature of the Platform</h2>
          <p>
            MediNex is an open platform designed to showcase technological innovation, research specifications,
            and community dialogue around digital health engineering. MediNex is NOT a licensed healthcare
            provider and does NOT deliver clinical medical diagnoses, prescriptions, or emergency healthcare services.
          </p>
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-xl border border-medinex-border space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-medinex-text">2. Prohibited Conduct</h2>
          <p>Users participating in community discussions agree never to:</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Post or transmit any patient medical records, personal health identifiers, or unconsented medical photography.</li>
            <li>Post medical misinformation, unverified cures, or fraudulent health advisories.</li>
            <li>Harass, impersonate, or defame contributors, healthcare workers, or community peers.</li>
            <li>Attempt unauthorized access to backend APIs, bypass rate limits, or disrupt platform infrastructure.</li>
          </ul>
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-xl border border-medinex-border space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-medinex-text">3. Intellectual Property &amp; Open Source</h2>
          <p>
            Code repositories, documentation, and architectural designs provided by the MediNex team for
            E-Health Hackathon 2026 are released under applicable open-source guidelines as specified on our
            official GitHub organization.
          </p>
        </section>
      </div>
    </div>
  );
}
