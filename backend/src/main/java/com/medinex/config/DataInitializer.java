package com.medinex.config;

import com.medinex.project.entity.Project;
import com.medinex.project.repository.ProjectRepository;
import com.medinex.team.entity.Team;
import com.medinex.team.entity.TeamMember;
import com.medinex.team.repository.TeamMemberRepository;
import com.medinex.team.repository.TeamRepository;
import com.medinex.user.entity.Role;
import com.medinex.user.entity.User;
import com.medinex.user.entity.UserProfile;
import com.medinex.user.model.RoleType;
import com.medinex.user.model.UserStatus;
import com.medinex.user.repository.RoleRepository;
import com.medinex.user.repository.UserProfileRepository;
import com.medinex.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final String DEFAULT_DEV_ADMIN_PASSWORD = "Admin@SecurePass2026!";

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ProjectRepository projectRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    @Value("${medinex.seed.enabled:true}")
    private boolean seedEnabled;

    @Value("${medinex.seed.demo-users-enabled:true}")
    private boolean demoUsersEnabled;

    @Value("${medinex.seed.admin-email:admin@medinex.health}")
    private String adminEmail;

    @Value("${medinex.seed.admin-password:Admin@SecurePass2026!}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedEnabled) {
            log.info("[DATA INITIALIZER] Seeding disabled via medinex.seed.enabled=false.");
            return;
        }
        boolean isProd = Arrays.asList(environment.getActiveProfiles()).contains("prod");
        log.info("[DATA INITIALIZER] Verifying core roles and baseline platform records (prod={}, demoUsers={})...",
                isProd, demoUsersEnabled);

        // 1. Initialize Roles
        Role superAdminRole = initRole(RoleType.ROLE_SUPER_ADMIN.name(), "Super Administrator with full authority");
        Role adminRole = initRole(RoleType.ROLE_ADMIN.name(), "Administrator for team, projects, and moderation");
        Role moderatorRole = initRole(RoleType.ROLE_MODERATOR.name(), "Content moderator");
        Role userRole = initRole(RoleType.ROLE_USER.name(), "Standard community user");

        // 2. Initialize Seed Admin (if not exists and credentials are safe for current profile)
        if (!userRepository.existsByEmailIgnoreCase(adminEmail)) {
            boolean hasPassword = adminPassword != null && !adminPassword.isBlank();
            boolean isInsecureProdDefault = isProd && DEFAULT_DEV_ADMIN_PASSWORD.equals(adminPassword);
            if (!hasPassword || isInsecureProdDefault) {
                log.warn("[DATA INITIALIZER] Skipping default admin creation in prod profile: supply an explicit non-default SEED_ADMIN_PASSWORD.");
            } else {
                User admin = User.builder()
                        .fullName("MediNex Lead Administrator")
                        .username("medinex-admin")
                        .email(adminEmail)
                        .passwordHash(passwordEncoder.encode(adminPassword))
                        .status(UserStatus.ACTIVE)
                        .emailVerified(true)
                        .isTeamMember(true)
                        .roles(Set.of(superAdminRole, adminRole, userRole))
                        .build();
                userRepository.save(admin);
                userProfileRepository.save(UserProfile.builder().user(admin).designation("System Administrator").build());
                log.info("[DATA INITIALIZER] Seed administrator created: {}", adminEmail);
            }
        }

        // 3. Initialize Official Team
        Team team = teamRepository.findBySlug("medinex-official").orElseGet(() -> {
            Team newTeam = Team.builder()
                    .name("MediNex Official Team")
                    .slug("medinex-official")
                    .tagline("Connecting Technology, Research & Healthcare Innovation.")
                    .missionStatement("A collaborative healthcare technology platform uniting developers, researchers, and public health professionals to build digital health solutions.")
                    .officialEmail("team@medinex.health")
                    .githubOrgUrl("https://github.com/Medi-Nex")
                    .build();
            return teamRepository.save(newTeam);
        });

        // 4. Initialize 6 Contributor Placeholder Profiles (non-prod / explicit opt-in only)
        if (!demoUsersEnabled) {
            log.info("[DATA INITIALIZER] Skipping demo placeholder contributor credentials (demo-users-enabled=false).");
        } else {
            initContributor(team, "contributor-01", "Contributor 01 [Placeholder]",
                    "Team Lead & Systems Architect", "Computer Science & Engineering",
                    "University Engineering Department [Pending Verification]",
                    "Placeholder profile for Contributor 1. Responsible for system architecture, backend integration, and project coordination for E-Health Hackathon 2026.",
                    List.of("Distributed Systems", "Java Spring Boot", "PostgreSQL", "System Architecture"),
                    List.of("Platform architecture", "Data isolation oversight", "Hackathon coordination"),
                    true, 1);

            initContributor(team, "contributor-02", "Contributor 02 [Placeholder]",
                    "Full-Stack Web & Next.js Specialist", "Software Engineering",
                    "Institute of Information Technology [Pending Verification]",
                    "Placeholder profile for Contributor 2. Spearheading front-end interface development, responsive UI accessibility (WCAG 2.2), and community feed components.",
                    List.of("Next.js App Router", "TypeScript", "Tailwind CSS", "React Hook Form"),
                    List.of("Frontend views", "Hybrid design implementation", "Core Web Vitals"),
                    false, 2);

            initContributor(team, "contributor-03", "Contributor 03 [Placeholder]",
                    "Health Informatics & Data Architect", "Biomedical Engineering & Informatics",
                    "Department of Biomedical Science [Pending Verification]",
                    "Placeholder profile for Contributor 3. Specializing in healthcare data schemas, standards evaluation, and relational database migrations.",
                    List.of("PostgreSQL", "Data Modeling", "Health Informatics Research", "Relational Indexing"),
                    List.of("Schema migrations", "Data segregation enforcement", "Compliance research"),
                    false, 3);

            initContributor(team, "contributor-04", "Contributor 04 [Placeholder]",
                    "Mobile & Interoperable Systems Lead", "Electrical & Electronic Engineering",
                    "Engineering Faculty [Pending Verification]",
                    "Placeholder profile for Contributor 4. Leading research and mobile/web interface prototyping for ShasthoSetu health data exchange workflows.",
                    List.of("HL7 FHIR Research", "Interoperability Architecture", "Mobile Architecture"),
                    List.of("Record exchange prototype", "Consent & RBAC flows", "ShasthoSetu specs"),
                    false, 4);

            initContributor(team, "contributor-05", "Contributor 05 [Placeholder]",
                    "Health Workflow & UX Researcher", "Public Health & Human Factors",
                    "School of Public Health [Pending Verification]",
                    "Placeholder profile for Contributor 5. Conducting usability evaluations, health information workflow studies, and bilingual interface research.",
                    List.of("User Research", "Workflow Mapping", "Accessibility Audits", "Figma"),
                    List.of("Field usability research", "Bilingual UX testing", "Health workflow maps"),
                    false, 5);

            initContributor(team, "contributor-06", "Contributor 06 [Placeholder]",
                    "DevSecOps & Compliance Specialist", "Information Security",
                    "Faculty of Computer & Information Science [Pending Verification]",
                    "Placeholder profile for Contributor 6. Responsible for container orchestration, secure token infrastructure, automated test pipelines, and vulnerability assessments.",
                    List.of("Docker & Compose", "Spring Security", "Linux Hardening", "JWT Architecture"),
                    List.of("Container configurations", "OWASP compliance checks", "DevOps orchestration"),
                    false, 6);
        }

        // 5. Initialize ShasthoSetu Project
        if (projectRepository.findBySlug("shasthosetu").isEmpty()) {
            Project shasthoSetu = Project.builder()
                    .team(team)
                    .title("ShasthoSetu (স্বাস্থ্যসেতু)")
                    .slug("shasthosetu")
                    .shortSummary("An interoperable digital health record and exchange platform prototype exploring standardized health data structures, HL7 FHIR alignment, and consent-aware health record interoperability.")
                    .problemStatement("Healthcare data across clinics, laboratories, and hospitals is frequently stored in disconnected and incompatible systems. Because records rarely transfer cleanly between facilities, patients face repeated diagnostics and fragmented medical histories.")
                    .proposedSolution("ShasthoSetu is designed as a standards-oriented digital health record and exchange architecture exploring HL7 FHIR resource alignment, patient identity mapping concepts, consent workflows, role-based access control, audit logging, and optional QR identity lookup patterns.")
                    .techStack(List.of("Next.js App Router", "Java 21 Spring Boot", "PostgreSQL", "Docker"))
                    .stage("DEVELOPMENT")
                    .isFeatured(true)
                    .repositoryUrl("https://github.com/Medi-Nex")
                    .build();
            projectRepository.save(shasthoSetu);
            log.info("[DATA INITIALIZER] Seeded ShasthoSetu project specification (Stage: DEVELOPMENT)");
        }

        log.info("[DATA INITIALIZER] Core initialization complete.");
    }

    private Role initRole(String id, String desc) {
        return roleRepository.findById(id).orElseGet(() ->
                roleRepository.save(Role.builder().id(id).name(id).description(desc).build())
        );
    }

    private void initContributor(Team team, String username, String fullName, String designation,
                                 String department, String university, String bio,
                                 List<String> skills, List<String> responsibilities,
                                 boolean isLead, int order) {
        User user = userRepository.findByUsernameIgnoreCase(username).orElseGet(() -> {
            Role userRole = roleRepository.findById(RoleType.ROLE_USER.name()).orElseThrow();

            User newUser = User.builder()
                    .username(username)
                    .fullName(fullName)
                    .email(username + "@medinex.health")
                    .passwordHash(passwordEncoder.encode("Contributor@SecurePass2026!"))
                    .status(UserStatus.ACTIVE)
                    .emailVerified(true)
                    .isTeamMember(true)
                    .roles(Set.of(userRole))
                    .build();
            return userRepository.save(newUser);
        });

        if (userProfileRepository.findByUserId(user.getId()).isEmpty()) {
            UserProfile profile = UserProfile.builder()
                    .user(user)
                    .designation(designation)
                    .department(department)
                    .university(university)
                    .bio(bio)
                    .skills(skills)
                    .responsibilities(responsibilities)
                    .githubUrl("https://github.com")
                    .linkedinUrl("https://linkedin.com")
                    .isPublicVisible(true)
                    .isVerifiedContributor(false) // Verified placeholder flag
                    .verifiedJoinDate(LocalDate.of(2026, 1, 15))
                    .build();
            userProfileRepository.save(profile);
        }

        if (teamMemberRepository.findByUserUsernameIgnoreCase(username).isEmpty()) {
            TeamMember member = TeamMember.builder()
                    .team(team)
                    .user(user)
                    .officialDesignation(designation)
                    .department(department)
                    .university(university)
                    .displayOrder(order)
                    .isLead(isLead)
                    .isPlaceholder(true)
                    .build();
            teamMemberRepository.save(member);
        }
    }
}
