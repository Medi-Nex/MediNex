import { TeamMember, ProjectInfo, TeamAnnouncement, TeamEvent } from "@/types";

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "mem-01",
    username: "contributor-01",
    fullName: "Contributor 01 [Placeholder]",
    designation: "Team Lead & Systems Architect",
    department: "Computer Science & Engineering",
    university: "University Engineering Department [Pending Verification]",
    bio: "Placeholder profile for Team Contributor 1. Responsible for system architecture, backend integration, and project coordination for E-Health Hackathon 2026. This profile will be updated once official verified credentials are provided.",
    skills: ["Distributed Systems", "Java Spring Boot", "PostgreSQL", "System Architecture", "Healthcare Interoperability"],
    responsibilities: [
      "Overseeing end-to-end platform architecture and micro-services boundaries",
      "Ensuring strict data isolation between community platform and healthcare services",
      "Leading technical submissions for E-Health Hackathon 2026",
    ],
    portfolioUrl: "https://example.org/contributor-01",
    githubUrl: "https://github.com",
    linkedinUrl: "https://linkedin.com",
    isLead: true,
    isPlaceholder: true,
    publicVisibility: true,
    verifiedJoinDate: "2026-01-15",
    displayOrder: 1,
  },
  {
    id: "mem-02",
    username: "contributor-02",
    fullName: "Contributor 02 [Placeholder]",
    designation: "Full-Stack Web & Next.js Specialist",
    department: "Software Engineering",
    university: "Institute of Information Technology [Pending Verification]",
    bio: "Placeholder profile for Team Contributor 2. Spearheading front-end interface development, responsive UI accessibility (WCAG 2.2), and interactive community feed components.",
    skills: ["Next.js App Router", "TypeScript", "Tailwind CSS", "React Hook Form", "State Management"],
    responsibilities: [
      "Developing accessible and responsive public UI views",
      "Implementing hybrid design theme and real-time community engagement modules",
      "Optimizing Core Web Vitals and frontend performance",
    ],
    githubUrl: "https://github.com",
    linkedinUrl: "https://linkedin.com",
    isLead: false,
    isPlaceholder: true,
    publicVisibility: true,
    verifiedJoinDate: "2026-01-15",
    displayOrder: 2,
  },
  {
    id: "mem-03",
    username: "contributor-03",
    fullName: "Contributor 03 [Placeholder]",
    designation: "Health Informatics & Data Architect",
    department: "Biomedical Engineering & Informatics",
    university: "Department of Biomedical Science [Pending Verification]",
    bio: "Placeholder profile for Team Contributor 3. Specializing in healthcare data schemas, standards evaluation (HL7/FHIR research for ShasthoSetu), and database query optimization.",
    skills: ["PostgreSQL", "Database Schema Design", "Health Informatics Research", "FHIR Standards (Research)", "Data Modeling"],
    responsibilities: [
      "Designing relational schema migrations and indexing strategies",
      "Maintaining strict separation of public community data and medical project domains",
      "Researching compliant data pipelines for clinical evaluation",
    ],
    githubUrl: "https://github.com",
    linkedinUrl: "https://linkedin.com",
    isLead: false,
    isPlaceholder: true,
    publicVisibility: true,
    verifiedJoinDate: "2026-01-15",
    displayOrder: 3,
  },
  {
    id: "mem-04",
    username: "contributor-04",
    fullName: "Contributor 04 [Placeholder]",
    designation: "Telemedicine & Mobile Integration Lead",
    department: "Electrical & Electronic Engineering",
    university: "Engineering Faculty [Pending Verification]",
    bio: "Placeholder profile for Team Contributor 4. Leading research and early interface prototyping for the ShasthoSetu connected telemedicine bridge.",
    skills: ["WebRTC / Media Research", "Mobile Responsive Architecture", "REST API Integration", "Edge Optimization"],
    responsibilities: [
      "Prototyping low-bandwidth telemedicine audio/video bridges for rural health workers",
      "Optimizing connectivity handoffs in intermittent network conditions",
      "Collaborating on ShasthoSetu interface specifications",
    ],
    githubUrl: "https://github.com",
    linkedinUrl: "https://linkedin.com",
    isLead: false,
    isPlaceholder: true,
    publicVisibility: true,
    verifiedJoinDate: "2026-01-15",
    displayOrder: 4,
  },
  {
    id: "mem-05",
    username: "contributor-05",
    fullName: "Contributor 05 [Placeholder]",
    designation: "Clinical Workflow & UX Researcher",
    department: "Public Health & Human Factors",
    university: "School of Public Health [Pending Verification]",
    bio: "Placeholder profile for Team Contributor 5. Conducting user empathy studies, clinical workflow interviews with healthcare workers, and usability evaluations.",
    skills: ["User Research", "Clinical Workflow Mapping", "Heuristic Evaluation", "Accessibility Audits", "Figma Prototyping"],
    responsibilities: [
      "Conducting usability interviews with grassroots healthcare volunteers",
      "Ensuring multilingual usability across English and Bengali scripts",
      "Drafting human-centered user journey maps for ShasthoSetu",
    ],
    githubUrl: "https://github.com",
    linkedinUrl: "https://linkedin.com",
    isLead: false,
    isPlaceholder: true,
    publicVisibility: true,
    verifiedJoinDate: "2026-01-15",
    displayOrder: 5,
  },
  {
    id: "mem-06",
    username: "contributor-06",
    fullName: "Contributor 06 [Placeholder]",
    designation: "DevSecOps & Compliance Specialist",
    department: "Information Security",
    university: "Faculty of Computer & Information Science [Pending Verification]",
    bio: "Placeholder profile for Team Contributor 6. Responsible for container orchestration, secure token infrastructure, automated test pipelines, and vulnerability assessments.",
    skills: ["Docker & Compose", "Spring Security", "Linux Hardening", "JWT Architecture", "CI/CD & DevSecOps"],
    responsibilities: [
      "Configuring multi-stage Docker builds and non-root execution environments",
      "Auditing API endpoints against OWASP Top 10 vulnerabilities",
      "Managing secrets hygiene and secure token rotation mechanisms",
    ],
    githubUrl: "https://github.com",
    linkedinUrl: "https://linkedin.com",
    isLead: false,
    isPlaceholder: true,
    publicVisibility: true,
    verifiedJoinDate: "2026-01-15",
    displayOrder: 6,
  },
];

export const SHASTHOSETU_PROJECT: ProjectInfo = {
  id: "proj-shasthosetu",
  title: "ShasthoSetu (স্বাস্থ্যসেতু)",
  slug: "shasthosetu",
  shortSummary:
    "An experimental smart healthcare connectivity bridge engineered to connect grassroots community clinics and remote healthcare workers with specialized tele-consultation support.",
  problemStatement:
    "In underserved rural regions, community clinics frequently lack on-site specialized physicians. Patients face prohibitive travel costs, delayed diagnoses, and fragmented medical guidance. Critical medical emergencies and chronic conditions go unmonitored due to the absence of resilient, low-bandwidth communication channels between village healthcare assistants and district hospital consultants.",
  proposedSolution:
    "ShasthoSetu is designed as an edge-resilient digital health bridge. It empowers frontline healthcare volunteers with structured digital triage templates, automated vital-sign capture guidelines, offline-first queuing, and an asynchronous doctor consultation routing engine that operates reliably even on fragile 2G/3G networks.",
  features: [
    {
      title: "Offline-First Triage Assessment",
      description:
        "Allows rural health workers to record structured patient encounters locally and securely queue them for asynchronous synchronization when network connectivity resumes.",
    },
    {
      title: "Low-Bandwidth Asynchronous Consultation",
      description:
        "Doctors receive concise, structured clinical cards rather than heavy streaming streams, enabling rapid review and timely prescription guidance.",
    },
    {
      title: "Strict Data Isolation & Privacy Guard",
      description:
        "All patient clinical data and identifiers are physically and logically segregated from the public MediNex social community platform.",
    },
    {
      title: "Bilingual Bangla & English Interface",
      description:
        "Designed with high-contrast, intuitive visual affordances and native Hind Siliguri typography for community health workers with varying digital literacy.",
    },
  ],
  techStack: ["Next.js App Router", "Java 21 Spring Boot", "PostgreSQL", "WebRTC (Research)", "Docker"],
  stage: "DEVELOPMENT",
  isFeatured: true,
  demoUrl: undefined, // Pending hackathon deployment
  repositoryUrl: "https://github.com/Medi-Nex",
  assignedMembers: [
    "contributor-01",
    "contributor-02",
    "contributor-03",
    "contributor-04",
    "contributor-05",
    "contributor-06",
  ],
};

export const OFFICIAL_ANNOUNCEMENTS: TeamAnnouncement[] = [
  {
    id: "ann-01",
    title: "MediNex Platform Phase 1 Launched for E-Health Hackathon 2026",
    slug: "phase-1-launched-ehealth-hackathon-2026",
    date: "2026-02-10",
    authorName: "MediNex Lead Team",
    summary:
      "Official launch of the MediNex community platform architecture, team profiles, and ShasthoSetu project specification.",
    content:
      "We are excited to unveil the public release of the MediNex platform architecture. Built specifically for the upcoming E-Health Hackathon 2026, MediNex serves as the collaborative hub for our six-member innovation team and the broader digital health community.",
    category: "HACKATHON",
  },
  {
    id: "ann-02",
    title: "Architecture Decisions: Strict Healthcare Data Separation Policy",
    slug: "architecture-decisions-strict-healthcare-data-separation",
    date: "2026-02-08",
    authorName: "MediNex Architecture Working Group",
    summary:
      "Mandating zero storage of patient clinical records in the community platform database.",
    content:
      "In accordance with modern healthcare data governance principles, MediNex establishes an absolute barrier between public social interactions (posts, follows, discussions) and clinical solutions such as ShasthoSetu. No patient medical records, diagnostic tests, or identifying information are permitted on the community database.",
    category: "TECHNICAL",
  },
];

export const OFFICIAL_EVENTS: TeamEvent[] = [
  {
    id: "evt-01",
    title: "E-Health Hackathon 2026 Opening Ceremony",
    slug: "e-health-hackathon-2026-opening",
    eventDate: "2026-03-01T09:00:00Z",
    location: "National Health Innovation Center / Virtual Stage",
    status: "UPCOMING",
    description:
      "Official commencement of E-Health Hackathon 2026. Teams present problem statements and kickoff sprint phases.",
  },
  {
    id: "evt-02",
    title: "ShasthoSetu Technical Demonstration & Feedback Session",
    slug: "shasthosetu-technical-demonstration",
    eventDate: "2026-03-12T14:30:00Z",
    location: "Virtual Demo Arena",
    status: "UPCOMING",
    description:
      "Live architectural walkthrough of the ShasthoSetu offline-first telemedicine triage pipeline before hackathon evaluators.",
  },
];
