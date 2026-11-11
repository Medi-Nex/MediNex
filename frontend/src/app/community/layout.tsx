import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://medinex-bd.vercel.app";

export const metadata: Metadata = {
  title: "Healthcare Technology Community Feed",
  description:
    "Collaborative healthcare technology discussions, digital health interoperability engineering notes, and public health research dialogue on MediNex.",
  openGraph: {
    title: "Healthcare Technology Community Feed | MediNex",
    description:
      "Collaborative healthcare technology discussions, digital health engineering notes, and public health research dialogue on MediNex.",
    url: `${APP_URL}/community`,
    siteName: "MediNex",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Healthcare Technology Community Feed | MediNex",
    description:
      "Public health technology discussions, engineering notes, and open collaboration from MediNex.",
  },
  alternates: {
    canonical: "/community",
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
