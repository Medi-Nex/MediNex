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
  ],
  authors: [{ name: "MediNex Innovation Team" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "MediNex — Healthcare Innovation. Connected Communities.",
    description:
      "A real team platform connecting healthcare innovators, official projects like ShasthoSetu, and participatory public communities.",
    siteName: "MediNex",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${hindSiliguri.variable} scroll-smooth`}>
      <body className="min-h-screen flex flex-col bg-medinex-light text-medinex-text selection:bg-medinex-teal selection:text-white">
        <AuthProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-medinex-teal focus:text-white focus:rounded-md shadow-lg"
          >
            Skip to main content
          </a>
          <Navbar />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
