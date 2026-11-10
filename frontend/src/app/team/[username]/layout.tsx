import type { Metadata } from "next";
import { INITIAL_TEAM_MEMBERS } from "@/lib/team-data";

interface Props {
  params: Promise<{ username: string }>;
  children: React.ReactNode;
}

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
  const description = `${member.bio.slice(0, 155)}... Official MediNex team member for E-Health Hackathon 2026.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | MediNex`,
      description,
      url: `https://medinex.health/team/${username}`,
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
