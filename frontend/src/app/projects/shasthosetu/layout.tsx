import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ShasthoSetu — Telemedicine Bridge Architecture",
  description:
    "ShasthoSetu is the flagship healthcare innovation project by MediNex for E-Health Hackathon 2026. Low-bandwidth rural triage, clinician consultation, and strict zero-PHI isolation.",
  openGraph: {
    title: "ShasthoSetu — Telemedicine Bridge Architecture | MediNex",
    description:
      "Flagship healthcare innovation project by MediNex for E-Health Hackathon 2026. Low-bandwidth rural triage and clinician consultation.",
    url: "https://medinex.health/projects/shasthosetu",
    siteName: "MediNex",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShasthoSetu — Telemedicine Bridge Architecture | MediNex",
    description:
      "Low-bandwidth rural triage and clinician consultation system engineered for E-Health Hackathon 2026.",
  },
  alternates: {
    canonical: "/projects/shasthosetu",
  },
};

const shasthoSetuJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ShasthoSetu",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "Web, Cross-platform",
  "description":
    "Flagship telemedicine bridge connecting rural community healthcare workers with specialized tertiary clinicians over low-bandwidth constraints.",
  "creator": {
    "@type": "Organization",
    "name": "MediNex Team",
    "url": "https://medinex.health",
  },
};

export default function ShasthoSetuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(shasthoSetuJsonLd) }}
      />
      {children}
    </>
  );
}
