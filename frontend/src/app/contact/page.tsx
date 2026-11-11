"use client";

import React, { useState } from "react";
import {
  Send,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { GithubIcon } from "@/components/ui/SocialIcons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("COLLABORATION");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission for Phase 1
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    }, 700);
  };

  return (
    <div className="flex flex-col min-h-screen bg-medinex-light pb-20">
      {/* Dark Header */}
      <section className="bg-medinex-dark text-white py-14 border-b border-emerald-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <Badge variant="mint">Direct Communication</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Contact the MediNex Team
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Reach out for healthcare technology collaboration, interoperability research feedback, or
            platform inquiries.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Info Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-slate-50/70">
              <h2 className="font-bold text-sm text-medinex-text">Official Channels</h2>
            </CardHeader>
            <CardBody className="space-y-4 text-xs text-slate-600">
              <div>
                <span className="font-bold text-slate-800 block mb-0.5">Project Inquiries</span>
                <span className="text-medinex-teal font-medium">team@medinex.health</span>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-0.5">Open Source Repository</span>
                <a
                  href="https://github.com/Medi-Nex"
                  target="_blank"
                  rel="noreferrer"
                  className="text-medinex-teal hover:underline flex items-center gap-1 mt-0.5"
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  <span>github.com/Medi-Nex</span>
                </a>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-800 block mb-0.5">Collaboration Desk</span>
                <p className="text-slate-500">
                  MediNex Healthcare Innovation &amp; Technology Platform &bull; Digital Health Research Group
                </p>
              </div>
            </CardBody>
          </Card>

          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-medinex-teal shrink-0 mt-0.5" />
            <span>
              We do not provide medical consultation or clinic appointments through this portal.
            </span>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2">
          <Card className="shadow-subtle">
            <CardHeader>
              <h2 className="font-bold text-base text-medinex-text">Send Us a Direct Message</h2>
              <p className="text-xs text-medinex-muted">
                Our team responds to all verified technical and community queries.
              </p>
            </CardHeader>

            <CardBody>
              {isSubmitted ? (
                <div className="p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-medinex-teal flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-medinex-text">Message Received!</h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Thank you for contacting the MediNex engineering team. We will review your message promptly.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setIsSubmitted(false)}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Dr. / Eng. Jane Doe"
                        className="w-full text-xs p-2.5 bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medinex-teal"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@domain.org"
                        className="w-full text-xs p-2.5 bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medinex-teal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Inquiry Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medinex-teal"
                      >
                        <option value="COLLABORATION">Research &amp; Collaboration</option>
                        <option value="HACKATHON">Hackathon Jury &amp; Mentors</option>
                        <option value="TECHNICAL">Technical Architecture Question</option>
                        <option value="SECURITY">Security / Data Privacy Notice</option>
                        <option value="OTHER">General Inquiry</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Subject Line *
                      </label>
                      <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. ShasthoSetu FHIR Exchange Architecture Feedback"
                        className="w-full text-xs p-2.5 bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medinex-teal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Message Content *
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please do NOT include sensitive patient health records or confidential clinical notes..."
                      className="w-full text-xs p-2.5 bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medinex-teal"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
                      <Send className="w-4 h-4 mr-1.5" />
                      <span>Send Message</span>
                    </Button>
                  </div>
                </form>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
