import type { Metadata } from "next";
import { INITIAL_TEAM_MEMBERS } from "@/lib/team-data";

interface Props {
  params: Promise<{ username: string }>;
  children: React.ReactNode;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://medinex-bd.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const member = INITIAL_TEAM_MEMBERS.find((m) => m.username === username);

  if (!member) {
    return {
      title: "Team Contributor Profile",
      description: "Individual contributor profile for the MediNex healthcare innovation platform.",
    };
  }

  const title = `${member.fullName} — ${member.designation}`;
  const description = `${member.bio.slice(0, 155)}... Contributor on the MediNex Healthcare Innovation & Technology Platform.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | MediNex`,
      description,
      url: `${APP_URL}/team/${username}`,
      siteName: "MediNex",
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${title} | MediNex`,
      description,
    },
    alternates: {
      canonical: `/team/${username}`,
    },
  };
}

export default function ContributorLayout({ children }: Props) {
  return <>{children}</>;
}
