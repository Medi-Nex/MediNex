// MediNex Core TypeScript Type Definitions

export type UserRole = "ROLE_SUPER_ADMIN" | "ROLE_ADMIN" | "ROLE_MODERATOR" | "ROLE_USER";

export type ProjectStage = "PLANNING" | "RESEARCH" | "DEVELOPMENT" | "TESTING" | "PILOT" | "COMPLETED";

export interface TeamMember {
  id: string;
  username: string;
  fullName: string;
  designation: string;
  department: string;
  university: string;
  bio: string;
  skills: string[];
  responsibilities: string[];

  email?: string;
  avatarUrl?: string;
  avatarSmUrl?: string;
  avatarLgUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  researchGateUrl?: string;

  isLead: boolean;
  isPlaceholder: boolean;
  publicVisibility: boolean;
  verifiedJoinDate?: string;
  displayOrder: number;
}

export interface ProjectInfo {
  id: string;
  title: string;
  slug: string;
  shortSummary: string;
  problemStatement: string;
  proposedSolution: string;
  features: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
  techStack: string[];
  stage: ProjectStage;
  demoUrl?: string;
  repositoryUrl?: string;
  heroImageUrl?: string;
  isFeatured: boolean;
  assignedMembers: string[]; // usernames
}

export interface Post {
  id: string;
  authorUsername: string;
  authorName: string;
  authorDesignation: string;
  authorAvatar?: string;
  isOfficialAnnouncement: boolean;
  content: string;
  mediaUrls?: string[];
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
  isSeedDemo?: boolean;
}

export interface TeamAnnouncement {
  id: string;
  title: string;
  slug: string;
  date: string;
  authorName: string;
  summary: string;
  content: string;
  category: "HACKATHON" | "TECHNICAL" | "COMMUNITY" | "MILESTONE";
}

export interface TeamEvent {
  id: string;
  title: string;
  slug: string;
  eventDate: string;
  location: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED";
  description: string;
  registrationUrl?: string;
}
