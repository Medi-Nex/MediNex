import React from "react";
import Link from "next/link";
import {
  Activity,
  ShieldCheck,
  Target,
  Compass,
  Heart,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "About MediNex — Mission, Vision & Hackathon 2026",
  description:
    "Learn about the mission, engineering values, and E-Health Hackathon 2026 participation of the MediNex healthcare innovation platform.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Dark Hero Header */}
      <section className="bg-medinex-dark text-white py-16 md:py-24 border-b border-emerald-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge variant="mint" className="mb-2">
            The MediNex Story
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Bridging Healthcare Innovation with Connected Communities
          </h1>
          <p className="text-slate-300 text-lg max-w-3xl mx-auto leading-relaxed">
            MediNex is built by an interdisciplinary team of six developers, health informatics
            researchers, and human factors designers participating in{" "}
            <strong className="text-white">E-Health Hackathon 2026</strong>.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Mission and Vision Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-t-4 border-t-medinex-teal">
            <CardBody className="space-y-4 p-8">
              <div className="w-12 h-12 rounded-xl bg-medinex-teal/10 text-medinex-teal flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-medinex-text">Our Mission</h2>
              <p className="text-sm text-medinex-muted leading-relaxed">
                To create a collaborative and transparent digital ecosystem where healthcare
                technologies are conceptualized, peer-reviewed, and stress-tested alongside public
                community feedback—without ever compromising patient privacy or clinical integrity.
              </p>
            </CardBody>
          </Card>

          <Card className="border-t-4 border-t-medinex-mint">
            <CardBody className="space-y-4 p-8">
              <div className="w-12 h-12 rounded-xl bg-medinex-mint/20 text-medinex-deep flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-medinex-text">Our Vision</h2>
              <p className="text-sm text-medinex-muted leading-relaxed">
                A healthcare landscape where grassroots healthcare workers in remote community
                clinics have resilient digital bridges to specialized clinical expertise, supported by
                open-source standards and honest, verifiable metrics.
              </p>
            </CardBody>
          </Card>
        </section>

        {/* E-Health Hackathon 2026 Context */}
        <section id="hackathon" className="bg-white border border-medinex-border rounded-2xl p-8 sm:p-10 shadow-subtle space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-medinex-teal">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-medinex-text">E-Health Hackathon 2026 Context</h2>
              <p className="text-xs text-medinex-muted">Official Team Collaboration Project</p>
            </div>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">
            The MediNex platform originated as the official collaborative workspace for our six-member
            hackathon team. As we tackled rural telemedicine challenges in Bangladesh, we recognized
            that technical innovation requires both deep engineering discipline (our flagship project,{" "}
            <strong>ShasthoSetu</strong>) and an open community platform to gather feedback from
            fellow students, doctors, and tech advocates.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-5 h-5 text-medinex-teal shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700">
                <strong>Transparent Sprint Work:</strong> All features are developed in an open,
                documented repository adhering to real code standards.
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-5 h-5 text-medinex-teal shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700">
                <strong>No Fabricated Claims:</strong> We do not claim clinical trials, hospital
                affiliations, or user volumes that have not been objectively verified.
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-medinex-text">Core Engineering Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardBody className="space-y-3">
                <div className="p-2 bg-medinex-teal/10 rounded-lg text-medinex-teal w-fit">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-medinex-text">Architectural Integrity</h3>
                <p className="text-xs text-medinex-muted leading-relaxed">
                  Real backend persistence, strict schema validation, robust Docker containerization,
                  and zero cosmetic mockups passed off as finished systems.
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-3">
                <div className="p-2 bg-medinex-teal/10 rounded-lg text-medinex-teal w-fit">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-medinex-text">Data Segregation</h3>
                <p className="text-xs text-medinex-muted leading-relaxed">
                  Clear boundaries separating social user profiles and public commentary from
                  medical/clinical workflows. PHI has no place in social tables.
                </p>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-3">
                <div className="p-2 bg-medinex-teal/10 rounded-lg text-medinex-teal w-fit">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-medinex-text">Accessibility &amp; Inclusivity</h3>
                <p className="text-xs text-medinex-muted leading-relaxed">
                  Full WCAG 2.2 AA accessibility, screen reader compatibility, and bilingual English &amp;
                  Bangla typography using Hind Siliguri.
                </p>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* Data Governance Disclaimer */}
        <section id="governance" className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-base">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Healthcare Data Governance Notice</span>
          </div>
          <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
            The MediNex public platform is designed solely for technical team collaboration,
            project documentation, and public community discourse. It does not provide medical advice,
            prescriptions, or patient diagnostic services. ShasthoSetu is an isolated experimental
            technology prototype under technical development.
          </p>
        </section>

        {/* Team Callout */}
        <div className="text-center pt-8">
          <Link href="/team">
            <Button variant="primary" size="lg">
              <span>View the 6 Contributor Profiles</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
