
import {
  TeamMember,
  ProjectInfo,
  TeamAnnouncement,
  TeamEvent,
} from "@/types";

/**
 * ============================================================
 * MEDINEX — INITIAL TEAM MEMBERS
 * E-Health Hackathon 2026
 * ============================================================
 *
 * Only supplied or reasonably verified information is used.
 * Unverified profiles remain hidden until confirmed.
 */

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  // ----------------------------------------------------------
  // 01. MD ABU HASNAT ABDULLAH
  // ----------------------------------------------------------
  {
    id: "mem-01",
    username: "hasnat",
    fullName: "Md Abu Hasnat Abdullah",
    designation: "Lecturer",
    department: "Department of Public Health",
    university: "Daffodil International University",

    bio: "Lecturer in Public Health with an interest in public health research, healthcare accessibility, and user-centered healthcare solutions. Contributes public health perspectives and research insights to the ShasthoSetu initiative.",

    skills: [
      "Public Health",
      "User Research",
      "Clinical Workflow Mapping",
      "Healthcare Usability Evaluation",
      "Public Health Analytics",
    ],

    responsibilities: [
      "Providing public health insights for ShasthoSetu",
      "Supporting healthcare worker interviews and user research",
      "Evaluating healthcare workflows and user needs",
      "Contributing to human-centered healthcare solution design",
    ],

    githubUrl: "https://github.com",
    linkedinUrl:
      "https://www.linkedin.com/in/md-abu-hasnat-abdullah?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    email: "hasnat.ph@diu.edu.bd",

    isLead: true,
    isPlaceholder: false,
    publicVisibility: true,
    displayOrder: 1,
  },

  // ----------------------------------------------------------
  // 02. KAIUM AHMED
  // ----------------------------------------------------------
  {
    id: "mem-02",
    username: "jihadjp",
    fullName: "Kaium Ahmed",
    designation: "Full-Stack Developer",
    department: "Department of Computer Science & Engineering",
    university: "Daffodil International University",

    bio: "Full-Stack Developer and technology enthusiast focused on building modern web applications, Android applications, and practical digital solutions. Works with React and JavaScript for frontend development, Java for Android applications, and backend API integration and database technologies.",

    skills: [
      "React.js",
      "HTML & CSS",
      "Java",
      "Java Spring Boot",
      "JavaScript",
      "Android Development",
      "REST API Integration",
      "MySQL",
      "PostgreSQL",
      "Database Management",
      "Software Development",
    ],

    responsibilities: [
      "Contributing to MediNex product planning and technical development",
      "Developing frontend interfaces and interactive application features",
      "Building Android application features and integrations",
      "Integrating REST APIs and database-backed functionality",
      "Contributing to software architecture and technical problem-solving",
      "Working on user-friendly and scalable digital solutions",
    ],

    portfolioUrl: "https://jihadjp.com/",
    githubUrl: "https://github.com/jihadjp",
    linkedinUrl: "https://linkedin.com/in/jihadjpbd",
    email: "programmerjihad@gmail.com",

    isLead: false,
    isPlaceholder: false,
    publicVisibility: true,
    displayOrder: 2,
  },

  // ----------------------------------------------------------
  // 03. M TAREK RAHMAN
  // ----------------------------------------------------------
  {
    id: "mem-03",
    username: "tarek",
    fullName: "M Tarek Rahman",
    designation: "DevOps & Software Engineer",
    department: "Department of Computer Science & Engineering",
    university: "Daffodil International University",

    bio: "DevOps & Software Engineer contributing to MediNex infrastructure, CI/CD pipelines, distributed architecture, and software development.",

    skills: [
      "DevOps",
      "CI/CD",
      "Docker",
      "React.js",
      "HTML & CSS",
      "JavaScript",
      "Database Management",
    ],

    responsibilities: [
      "Managing DevOps pipelines and deployment architecture",
      "Developing software features and database integrations",
    ],

    portfolioUrl: "https://tarekparvez.me/",
    githubUrl: "https://github.com/mtarek47",
    linkedinUrl: "https://www.linkedin.com/in/m-tarek-rahman-06068a349?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    email: "tarekparvez47@gmail.com",

    isLead: false,
    isPlaceholder: false,
    publicVisibility: true,
    displayOrder: 3,
  },

  // ----------------------------------------------------------
  // 04. MD. KHAIRUL ANAM SHOPNIL
  // ----------------------------------------------------------
  {
    id: "mem-04",
    username: "shopnil",
    fullName: "Md. Khairul Anam Shopnil",
    designation: "Backend Developer",
    department: "Department of Software Engineering",
    university: "Daffodil International University",

    bio: "Backend Developer focused on server-side application development, API integration, database management, and reliable backend systems. Interested in building secure, maintainable, and scalable application infrastructure.",

    skills: [
      "PostgreSQL",
      "Database Schema Design",
      "REST API Development",
      "Backend Architecture",
    ],

    responsibilities: [
      "Developing backend APIs and server-side application functionality",
      "Designing and maintaining relational database structures",
      "Supporting database integration and query optimization",
      "Contributing to secure and maintainable backend development",
    ],

    githubUrl:
      "https://github.com/mdshopnil071",

    linkedinUrl:
      "https://www.linkedin.com/in/kashopnil?utm_source=share_via&utm_content=profile&utm_medium=member_android",

    email: "khairulanamshopnil@gmail.com",

    isLead: false,
    isPlaceholder: false,
    publicVisibility: true,
    displayOrder: 4,
  },

  // ----------------------------------------------------------
  // 05. MD. NABIL SHIKDAR
  // ----------------------------------------------------------
  {
    id: "mem-05",
    username: "nabil",
    fullName: "Md. Nabil Shikdar",
    designation: "Researcher",
    department: "Department of Public Health",
    university: "Daffodil International University",

    bio: "Researcher in the field of Public Health with an interest in healthcare research, clinical data evaluation, and evidence-based healthcare solutions. Contributes research-oriented perspectives to the ShasthoSetu project.",

    skills: [
      "Public Health Research",
      "Clinical Data Evaluation",
      "Healthcare Systems",
      "Research Analytics",
    ],

    responsibilities: [
      "Contributing public health research perspectives to ShasthoSetu",
      "Supporting healthcare data evaluation",
      "Analyzing healthcare needs and relevant research findings",
      "Contributing evidence-based insights to project development",
    ],

    researchGateUrl:
      "https://www.researchgate.net/profile/Md-Sikdhar?ev=hdr_xprf",

    linkedinUrl:
      "https://www.linkedin.com/in/md-nabil-shikdar-79b285356",

    email: "mdnabilsikderh@gmail.com",

    isLead: false,
    isPlaceholder: false,
    publicVisibility: true,
    displayOrder: 5,
  },

  // ----------------------------------------------------------
  // 06. CONTRIBUTOR 06
  // ----------------------------------------------------------
  {
    id: "mem-06",
    username: "puja",
    fullName: "Paromita Karmoker Puja",
    designation: "Researcher",
    department: "Department of Public Health",
    university: "Daffodil International University",

    bio: "Researcher in the field of Public Health with an interest in healthcare research, clinical data evaluation, and evidence-based healthcare solutions. Contributes research-oriented perspectives to the ShasthoSetu project.",

    skills: [
      "Public Health Research",
      "Clinical Data Evaluation",
      "Healthcare Systems",
      "Research Analytics",
    ],

    responsibilities: [
      "Contributing public health research perspectives to ShasthoSetu",
      "Supporting healthcare data evaluation",
      "Analyzing healthcare needs and relevant research findings",
      "Contributing evidence-based insights to project development",
    ],

    linkedinUrl:
      "https://www.linkedin.com/in/paromita-karmoker-puja-71b3b5335",

    email: "paromitakarmoker@gmail.com",

    isLead: false,
    isPlaceholder: false,
    publicVisibility: true,
    displayOrder: 6,
  },
];


/**
 * ============================================================
 * SHASTHOSETU PROJECT INFORMATION
 * ============================================================
 */

export const SHASTHOSETU_PROJECT: ProjectInfo = {
  id: "proj-shasthosetu",

  title: "ShasthoSetu (স্বাস্থ্যসেতু)",

  slug: "shasthosetu",

  shortSummary:
    "An interoperable digital health record and exchange platform prototype exploring standardized health data structures, HL7 FHIR alignment, and consent-aware health record interoperability.",

  problemStatement:
    "Across clinics, diagnostic centers, and hospitals, health records are frequently trapped in disconnected and incompatible software silos. Patients often carry fragmented paper histories and undergo duplicate diagnostics, while healthcare institutions lack standardized, consent-governed workflows to exchange records safely with transparent access auditability.",

  proposedSolution:
    "ShasthoSetu is a featured healthcare technology initiative under MediNex exploring standards-oriented digital health record management and interoperable health data exchange. Its research and prototype architecture investigate HL7 FHIR resource alignment, patient identity mapping concepts, explicit consent workflows, role-based access control (RBAC), secure API communication, access audit logs, and optional QR-based patient identity lookup—while enforcing strict Zero-PHI separation from the public MediNex community.",

  features: [
    {
      title: "Standardized Digital Health Record Exchange",
      description:
        "Researches structured digital health record schemas and HL7 FHIR-compatible API exchange patterns to enable interoperability across healthcare facilities.",
    },
    {
      title: "Patient Identity Mapping & Optional QR Lookup",
      description:
        "Explores privacy-preserving patient identity mapping models and an optional QR-based lookup concept (research stage; not government Health ID integrated).",
    },
    {
      title: "Consent Management, RBAC & Audit Logging",
      description:
        "Defines patient consent controls, role-based access boundaries, encrypted API communication, and access audit log concepts for record-sharing governance.",
    },
    {
      title: "Strict Data Isolation & Privacy Guard (Implemented)",
      description:
        "Enforces architectural separation and automated Zero-PHI screening so real patient medical records never enter the public MediNex community database.",
    },
  ],

  techStack: [
    "Next.js App Router",
    "Java 21 Spring Boot",
    "PostgreSQL",
    "HL7 FHIR (Research)",
    "Docker",
  ],

  stage: "DEVELOPMENT",

  isFeatured: true,

  // Add a real demo URL after deployment.
  demoUrl: undefined,

  repositoryUrl: "https://github.com/Medi-Nex",

  assignedMembers: [
    "mem-01",
    "mem-02",
    "mem-03",
    "mem-04",
    "mem-05",
    "mem-06",
  ],
};


/**
 * ============================================================
 * OFFICIAL ANNOUNCEMENTS
 * ============================================================
 */

export const OFFICIAL_ANNOUNCEMENTS: TeamAnnouncement[] = [
  {
    id: "ann-01",

    title: "MediNex Platform Phase 1 Launched for E-Health Hackathon 2026",

    slug: "phase-1-launched-ehealth-hackathon-2026",

    date: "2026-02-10",

    authorName: "MediNex Lead Team",

    summary:
      "Introduction of the MediNex community platform architecture, team profiles, and ShasthoSetu project specification.",

    content:
      "MediNex is being developed as a collaborative platform for its team and the broader digital health community. The platform brings together team information, project updates, and community engagement features.",

    category: "HACKATHON",
  },

  {
    id: "ann-02",

    title: "Architecture Decisions: Healthcare Data Separation Policy",

    slug: "architecture-decisions-strict-healthcare-data-separation",

    date: "2026-02-08",

    authorName: "MediNex Architecture Working Group",

    summary:
      "Separating public community interactions from patient clinical information.",

    content:
      "MediNex is designed to maintain strict separation between public social interactions, including posts, follows, and discussions, and interoperable health-record research initiatives such as ShasthoSetu. Real patient medical records, diagnostic information, and personally identifiable clinical information must not be stored in the public community database.",

    category: "TECHNICAL",
  },
];


/**
 * ============================================================
 * OFFICIAL EVENTS
 * ============================================================
 */

export const OFFICIAL_EVENTS: TeamEvent[] = [
  {
    id: "evt-01",

    title: "E-Health Hackathon 2026 Opening Ceremony",

    slug: "e-health-hackathon-2026-opening",

    eventDate: "2026-03-01T09:00:00Z",

    location: "National Health Innovation Center / Virtual Stage",

    status: "UPCOMING",

    description:
      "Opening ceremony for E-Health Hackathon 2026, introducing participating teams and the initial project development activities.",
  },

  {
    id: "evt-02",

    title: "ShasthoSetu Technical Demonstration & Feedback Session",

    slug: "shasthosetu-technical-demonstration",

    eventDate: "2026-03-12T14:30:00Z",

    location: "Virtual Demo Arena",

    status: "UPCOMING",

    description:
      "A technical demonstration session for presenting the ShasthoSetu architecture and collecting project feedback.",
  },
];

export function getInitials(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "MN";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
