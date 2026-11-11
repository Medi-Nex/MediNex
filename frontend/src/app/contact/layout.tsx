import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://medinex-bd.vercel.app";

export const metadata: Metadata = {
  title: "Contact & Collaboration Inquiries",
  description:
    "Get in touch with the MediNex team for healthcare technology research collaboration, interoperability discussions, and technical inquiries.",
  openGraph: {
    title: "Contact & Collaboration | MediNex",
    description:
      "Get in touch with the MediNex team for technical inquiries, research collaboration, and healthcare technology initiatives.",
    url: `${APP_URL}/contact`,
    siteName: "MediNex",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact & Collaboration | MediNex",
    description:
      "Get in touch with the MediNex team for healthcare technology collaboration and technical inquiries.",
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
