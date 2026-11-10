import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Official Innovation Team — Six Contributor Profiles",
  description:
    "Meet the official MediNex contributors participating in E-Health Hackathon 2026. Explore verified roles, research interests, and open-source contributions.",
  openGraph: {
    title: "Official Innovation Team — Six Contributor Profiles | MediNex",
    description:
      "Meet the official MediNex contributors participating in E-Health Hackathon 2026. Explore verified roles, research interests, and open-source contributions.",
    url: "https://medinex.health/team",
    siteName: "MediNex",
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    title: "Official Innovation Team | MediNex",
    description:
      "Meet the six official MediNex contributors participating in E-Health Hackathon 2026.",
  },
  alternates: {
    canonical: "/team",
  },
};

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
