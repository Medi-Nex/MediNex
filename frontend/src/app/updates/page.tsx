import React from "react";
import { Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { OFFICIAL_ANNOUNCEMENTS } from "@/lib/team-data";

export const metadata = {
  title: "Official Updates & Announcements",
  description: "Official technical bulletins and sprint updates from the MediNex team for E-Health Hackathon 2026.",
};

export default function UpdatesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-medinex-light pb-20">
      {/* Dark Header */}
      <section className="bg-medinex-dark text-white py-14 border-b border-emerald-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <Badge variant="mint">Official Dispatch</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Team Announcements &amp; Updates
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Follow our verified progress, architectural decisions, and milestones as we prepare for
            E-Health Hackathon 2026.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-6">
        {OFFICIAL_ANNOUNCEMENTS.map((ann) => (
          <Card key={ann.id} hoverEffect className="overflow-hidden">
            <CardBody className="p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={ann.category === "HACKATHON" ? "teal" : "mint"}
                    size="sm"
                  >
                    {ann.category}
                  </Badge>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{ann.date}</span>
                  </span>
                </div>
                <span className="text-xs text-medinex-muted flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  <span>{ann.authorName}</span>
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-medinex-text tracking-tight">
                  {ann.title}
                </h2>
                <p className="text-xs sm:text-sm text-medinex-teal font-medium mt-1">
                  {ann.summary}
                </p>
              </div>

              <div className="pt-2 text-xs sm:text-sm text-slate-700 leading-relaxed border-t border-slate-100">
                {ann.content}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
