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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://medinex-bd.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "MediNex — Healthcare Innovation & Technology Platform",
    template: "%s | MediNex",
  },
  description:
    "MediNex is a collaborative healthcare technology platform where developers, researchers, and public health professionals explore ideas, build innovative solutions, and collaborate on technology-driven healthcare initiatives.",
  keywords: [
    "MediNex",
    "Healthcare Innovation",
    "Healthcare Technology Platform",
    "Digital Health",
    "Healthcare Interoperability",
    "Health Information Systems",
    "Public Health Technology",
    "ShasthoSetu",
    "FHIR Standards",
    "AI in Healthcare",
    "Health Data Security",
  ],
  authors: [{ name: "MediNex Innovation Team" }],
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "MediNex — Healthcare Innovation & Technology Platform",
    description:
      "Connecting Technology, Research & Healthcare Innovation. A collaborative platform uniting developers, researchers, and public health professionals.",
    siteName: "MediNex",
    locale: "en_US",
    type: "website",
    url: APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "MediNex — Healthcare Innovation & Technology Platform",
    description:
      "Connecting Technology, Research & Healthcare Innovation. Explore projects like ShasthoSetu and collaborate on health technology.",
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
      "@type": "Organization",
      "@id": `${APP_URL}/#organization`,
      "name": "MediNex",
      "alternateName": "MediNex Healthcare Innovation & Technology Platform",
      "url": APP_URL,
      "logo": `${APP_URL}/favicon.ico`,
      "description":
        "Connecting Technology, Research & Healthcare Innovation. A collaborative healthcare technology platform where developers, researchers, and public health professionals explore and build solutions.",
      "knowsAbout": [
        "Digital Health",
        "Healthcare Interoperability",
        "Health Information Systems",
        "Public Health Technology",
        "Health Data Security",
        "AI in Healthcare",
        "HL7 FHIR Standards",
      ],
      "sameAs": ["https://github.com/Medi-Nex/MediNex"],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Platform Collaboration and Technical Inquiries",
        "email": "contact@medinex.health",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${APP_URL}/#website`,
      "url": APP_URL,
      "name": "MediNex",
      "description": "Connecting Technology, Research & Healthcare Innovation.",
      "publisher": {
        "@id": `${APP_URL}/#organization`,
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${APP_URL}/community?q={search_term_string}`,
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
