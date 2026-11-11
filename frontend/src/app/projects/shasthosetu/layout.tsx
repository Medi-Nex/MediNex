import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://medinex-bd.vercel.app";

export const metadata: Metadata = {
  title: "ShasthoSetu — Interoperable Digital Health Record & Exchange",
  description:
    "ShasthoSetu (স্বাস্থ্যসেতু) is a featured MediNex project exploring interoperable digital health record management, HL7 FHIR alignment, consent-aware exchange, and zero-PHI platform boundaries.",
  openGraph: {
    title: "ShasthoSetu — Interoperable Digital Health Record & Exchange | MediNex",
    description:
      "Featured healthcare interoperability project by MediNex exploring standardized digital health record management, HL7 FHIR alignment, and consent-aware data exchange.",
    url: `${APP_URL}/projects/shasthosetu`,
    siteName: "MediNex",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShasthoSetu — Interoperable Digital Health Record & Exchange | MediNex",
    description:
      "Interoperable Digital Health Record & Exchange initiative documented with clear prototype and research boundaries on MediNex.",
  },
  alternates: {
    canonical: "/projects/shasthosetu",
  },
};

const shasthoSetuJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ShasthoSetu (স্বাস্থ্যসেতু)",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "Web, Cross-platform",
  "description":
    "Interoperable Digital Health Record & Exchange Platform initiative focused on standardized health data exchange, HL7 FHIR compatibility research, and patient consent concepts.",
  "creator": {
    "@type": "Organization",
    "name": "MediNex",
    "url": APP_URL,
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
