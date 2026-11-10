import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Collaboration Inquiries",
  description:
    "Get in touch with the MediNex core engineering team for E-Health Hackathon 2026 technical inquiries, research collaboration, and feedback.",
  openGraph: {
    title: "Contact & Collaboration | MediNex",
    description:
      "Get in touch with the MediNex core engineering team for E-Health Hackathon 2026 inquiries and collaboration.",
    url: "https://medinex.health/contact",
    siteName: "MediNex",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact & Collaboration | MediNex",
    description:
      "Get in touch with the MediNex engineering team for E-Health Hackathon 2026.",
  },
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
