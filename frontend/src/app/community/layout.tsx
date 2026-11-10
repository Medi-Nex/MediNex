import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Healthcare Innovation Community Feed",
  description:
    "Participatory healthcare innovation discussions, open-source biomedical informatics dispatches, and collaborative community dialogue for E-Health Hackathon 2026.",
  openGraph: {
    title: "Healthcare Innovation Community Feed | MediNex",
    description:
      "Participatory healthcare innovation discussions, open-source biomedical informatics dispatches, and collaborative community dialogue for E-Health Hackathon 2026.",
    url: "https://medinex.health/community",
    siteName: "MediNex",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Healthcare Innovation Community Feed | MediNex",
    description:
      "Public health technology discussions, verified engineering updates, and open collaboration from MediNex.",
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
