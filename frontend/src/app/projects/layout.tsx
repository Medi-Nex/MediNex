import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://medinex-bd.vercel.app";

export const metadata: Metadata = {
  title: "Projects & Research Initiatives",
  description:
    "Explore healthcare technology projects by MediNex, including ShasthoSetu (Interoperable Digital Health Record & Exchange Platform) and health-data research initiatives.",
  openGraph: {
    title: "Projects & Research Initiatives | MediNex",
    description:
      "Explore healthcare technology initiatives by MediNex, including ShasthoSetu interoperability architecture and research prototypes.",
    url: `${APP_URL}/projects`,
    siteName: "MediNex",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Projects & Research Initiatives | MediNex",
    description:
      "Healthcare technology projects and research initiatives on MediNex.",
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
