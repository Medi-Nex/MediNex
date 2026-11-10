import React from "react";
import Link from "next/link";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { OFFICIAL_EVENTS } from "@/lib/team-data";

export const metadata = {
  title: "Events & Hackathon Schedule",
  description: "Schedule of hackathon presentations, demonstrations, and community syncs for MediNex.",
};

export default function EventsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-medinex-light pb-20">
      {/* Dark Header */}
      <section className="bg-medinex-dark text-white py-14 border-b border-emerald-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <Badge variant="mint">Hackathon Calendar</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Events &amp; Milestones
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Key demonstration sessions, jury presentations, and live technical workshops for
            E-Health Hackathon 2026.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-6">
        {OFFICIAL_EVENTS.map((evt) => (
          <Card key={evt.id} hoverEffect className="overflow-hidden">
            <CardBody className="p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge
                  variant={evt.status === "UPCOMING" ? "teal" : "neutral"}
                  size="sm"
                >
                  {evt.status}
                </Badge>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-medinex-teal" />
                    <span>{new Date(evt.eventDate).toLocaleDateString()}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-medinex-teal" />
                    <span>{evt.location}</span>
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-medinex-text tracking-tight">
                  {evt.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  {evt.description}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                <span className="text-slate-400">Time: 14:00 UTC (Verified Schedule)</span>
                <Link
                  href="/contact"
                  className="font-semibold text-medinex-teal hover:underline inline-flex items-center gap-1"
                >
                  <span>Inquire / RSVP</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
