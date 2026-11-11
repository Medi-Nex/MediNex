import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://medinex-bd.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Community Discussion #${id.slice(0, 8)}`,
    description: `Read and join this verified health technology discussion on MediNex.`,
    openGraph: {
      title: `Community Discussion #${id.slice(0, 8)} | MediNex`,
      description: `Read and join this verified health technology discussion on MediNex.`,
      url: `${APP_URL}/community/posts/${id}`,
      siteName: "MediNex",
      type: "article",
    },
    twitter: {
      card: "summary",
      title: `Community Discussion #${id.slice(0, 8)} | MediNex`,
      description: `Participatory healthcare innovation discussions on MediNex.`,
    },
    alternates: {
      canonical: `/community/posts/${id}`,
    },
  };
}

export default function SinglePostLayout({ children }: Props) {
  return <>{children}</>;
}
