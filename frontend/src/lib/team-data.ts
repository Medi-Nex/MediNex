
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
  // 02. JIHAD KHAN
  // ----------------------------------------------------------
  {
    id: "mem-02",
    username: "jihadjp",
    fullName: "Jihad Khan",
    designation: "Full-Stack Developer",
    department: "Computer Science & Engineering",
    university: "Daffodil International University",

    bio: "Full-Stack Developer and technology enthusiast focused on building modern web applications, Android applications, and practical digital solutions. Works with React and JavaScript for frontend development, Java for Android applications, and backend API integration and database technologies. Interested in software architecture, application development, and building technology that solves real-world problems. Contributes to the planning and technical development of MediNex and ShasthoSetu.",

    skills: [
      "React.js",
      "JavaScript",
      "HTML & CSS",
      "Java",
      "Java Spring Boot",
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
    linkedinUrl: "https://linkedin.com/in/jihadjp",
    email: "jihad.cse@diu.edu.bd",

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
    designation: "Core Software Developer",
    department: "Computer Science & Engineering",
    university: "Daffodil International University",

    bio: "Team contributor at MediNex. Additional professional information, technical skills, and project responsibilities are awaiting confirmation.",

    skills: [],

    responsibilities: [],

    githubUrl: "https://github.com/mtarek47",
    linkedinUrl: "https://www.linkedin.com/in/m-tarek-rahman-06068a349",
    email: "tarekparvez47@gmail.com",

    isLead: false,
    isPlaceholder: false,
    publicVisibility: false,
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
    department: "SWE",
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
    "An experimental smart healthcare connectivity bridge designed to connect grassroots community clinics and remote healthcare workers with specialized tele-consultation support.",

  problemStatement:
    "In underserved rural regions, community clinics frequently lack on-site specialized physicians. Patients face prohibitive travel costs, delayed diagnoses, and fragmented medical guidance. Critical medical emergencies and chronic conditions may go unmonitored due to the absence of resilient, low-bandwidth communication channels between village healthcare assistants and district hospital consultants.",

  proposedSolution:
    "ShasthoSetu is designed as an edge-resilient digital health bridge. It aims to empower frontline healthcare volunteers with structured digital triage templates, vital-sign recording guidelines, offline-first queuing, and asynchronous doctor consultation routing that can operate on limited network connectivity.",

  features: [
    {
      title: "Offline-First Triage Assessment",
      description:
        "Allows rural health workers to record structured patient encounters locally and securely queue them for synchronization when network connectivity resumes.",
    },
    {
      title: "Low-Bandwidth Asynchronous Consultation",
      description:
        "Doctors receive concise, structured clinical information instead of requiring continuous high-bandwidth video streaming, enabling more practical remote consultation.",
    },
    {
      title: "Strict Data Isolation & Privacy Guard",
      description:
        "Patient clinical data and identifiers are kept separate from the public MediNex social community platform.",
    },
    {
      title: "Bilingual Bangla & English Interface",
      description:
        "Designed with intuitive visual elements and Bangla and English language support for community healthcare workers with varying levels of digital literacy.",
    },
  ],

  techStack: [
    "Next.js App Router",
    "Java 21 Spring Boot",
    "PostgreSQL",
    "WebRTC (Research)",
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
      "MediNex is designed to maintain separation between public social interactions, including posts, follows, and discussions, and clinical services such as ShasthoSetu. Patient medical records, diagnostic information, and personally identifiable clinical information must not be stored in the public community database.",

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
