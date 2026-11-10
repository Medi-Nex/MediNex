import type { Metadata } from "next";
import { Inter, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MediNex — Healthcare Innovation. Connected Communities.",
    template: "%s | MediNex",
  },
  description:
    "Official collaboration and innovation community platform for the MediNex healthcare engineering team participating in E-Health Hackathon 2026.",
  keywords: [
    "Healthcare Innovation",
    "Connected Communities",
    "E-Health Hackathon 2026",
    "Digital Health",
    "ShasthoSetu",
    "Medical Technology",
    "FHIR Standards",
    "Telemedicine",
  ],
  authors: [{ name: "MediNex Innovation Team" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://medinex.health"),
  openGraph: {
    title: "MediNex — Healthcare Innovation. Connected Communities.",
    description:
      "A real team platform connecting healthcare innovators, official projects like ShasthoSetu, and participatory public communities.",
    siteName: "MediNex",
    locale: "en_US",
    type: "website",
    url: "https://medinex.health",
  },
  twitter: {
    card: "summary_large_image",
    title: "MediNex — Healthcare Innovation. Connected Communities.",
    description:
      "A real team platform connecting healthcare innovators, official projects like ShasthoSetu, and participatory public communities.",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const rootStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "MedicalOrganization",
      "@id": "https://medinex.health/#organization",
      "name": "MediNex",
      "alternateName": "MediNex Healthcare Innovation Platform",
      "url": "https://medinex.health",
      "logo": "https://medinex.health/favicon.ico",
      "description":
        "Healthcare Innovation and Connected Communities platform for the E-Health Hackathon 2026 engineering team.",
      "knowsAbout": [
        "Healthcare Interoperability",
        "Digital Health",
        "Telemedicine",
        "Medical Informatics",
        "FHIR Standards",
      ],
      "sameAs": ["https://github.com/Medi-Nex/MediNex"],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Technical and Research Collaboration",
        "email": "contact@medinex.health",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://medinex.health/#website",
      "url": "https://medinex.health",
      "name": "MediNex",
      "description": "Healthcare Innovation. Connected Communities.",
      "publisher": {
        "@id": "https://medinex.health/#organization",
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://medinex.health/community?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${hindSiliguri.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootStructuredData) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-medinex-light text-medinex-text selection:bg-medinex-teal selection:text-white">
        <AuthProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-medinex-teal focus:text-white focus:rounded-md shadow-lg"
          >
            Skip to main content
          </a>
          <Navbar />
          <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
