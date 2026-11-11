import type { Metadata } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://medinex-bd.vercel.app";

export const metadata: Metadata = {
  title: "Contributors & Research Team",
  description:
    "Meet the multidisciplinary MediNex contributors across software engineering and public health research, building digital health solutions and ShasthoSetu.",
  openGraph: {
    title: "Contributors & Research Team | MediNex",
    description:
      "Meet the multidisciplinary MediNex contributors across software engineering and public health research.",
    url: `${APP_URL}/team`,
    siteName: "MediNex",
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contributors & Research Team | MediNex",
    description:
      "Meet the software developers and public health researchers behind MediNex.",
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
