import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Official Projects Directory & Research Initiatives",
  description:
    "Explore official healthcare engineering projects by MediNex for E-Health Hackathon 2026, including the core ShasthoSetu telemedicine system and interoperability sandboxes.",
  openGraph: {
    title: "Official Projects Directory | MediNex",
    description:
      "Explore official healthcare engineering projects by MediNex for E-Health Hackathon 2026, including ShasthoSetu.",
    url: "https://medinex.health/projects",
    siteName: "MediNex",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Official Projects Directory | MediNex",
    description:
      "Official healthcare engineering projects by MediNex for E-Health Hackathon 2026.",
  },
  alternates: {
    canonical: "/projects",
  },
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
