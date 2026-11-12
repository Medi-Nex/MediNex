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

        // 2. Initialize Seed Admin (if not exists by email or username, and credentials are safe for current profile)
        if (!userRepository.existsByEmailIgnoreCase(adminEmail)
                && !userRepository.existsByUsernameIgnoreCase("medinex-admin")) {
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
                    .officialEmail("medinexbd.noreply@gmail.com")
                    .githubOrgUrl("https://github.com/Medi-Nex")
                    .build();
            return teamRepository.save(newTeam);
        });

        // 4. Initialize 6 Contributor Placeholder Profiles (non-prod / explicit opt-in only)
        if (!demoUsersEnabled) {
            log.info("[DATA INITIALIZER] Skipping demo placeholder contributor credentials (demo-users-enabled=false).");
        } else {
            initContributor(team, "hasnat", "hasnat.ph@diu.edu.bd", "Md Abu Hasnat Abdullah",
                    "Lecturer", "Department of Public Health",
                    "Daffodil International University",
                    "Lecturer in Public Health with an interest in public health research, healthcare accessibility, and user-centered healthcare solutions.",
                    List.of("Public Health", "User Research", "Clinical Workflow Mapping", "Healthcare Usability Evaluation"),
                    List.of("Providing public health insights for ShasthoSetu", "Supporting healthcare worker interviews"),
                    true, 1);

            initContributor(team, "jihadjp", "jihad.cse@diu.edu.bd", "Jihad Khan",
                    "Full-Stack Developer", "Department of Computer Science & Engineering",
                    "Daffodil International University",
                    "Full-Stack Developer focused on building modern web applications, Android applications, and practical digital solutions.",
                    List.of("React.js", "JavaScript", "Java", "Spring Boot", "Android Development", "PostgreSQL"),
                    List.of("Developing frontend interfaces", "Building Android application features", "REST API Integration"),
                    false, 2);

            initContributor(team, "tarek", "tarekparvez47@gmail.com", "M Tarek Rahman",
                    "Core Software Developer", "Department of Computer Science & Engineering",
                    "Daffodil International University",
                    "Core Software Developer contributing to MediNex web interfaces, React.js frontend engineering, and database-backed features.",
                    List.of("React.js", "HTML & CSS", "JavaScript", "Database Management"),
                    List.of("Frontend development", "UI engineering"),
                    false, 3);

            initContributor(team, "shopnil", "khairulanamshopnil@gmail.com", "Md. Khairul Anam Shopnil",
                    "Backend Developer", "Department of Software Engineering",
                    "Daffodil International University",
                    "Backend Developer focused on server-side application development, API integration, and database management.",
                    List.of("PostgreSQL", "Database Schema Design", "REST API Development", "Backend Architecture"),
                    List.of("Developing backend APIs", "Designing relational database structures"),
                    false, 4);

            initContributor(team, "nabil", "mdnabilsikderh@gmail.com", "Md. Nabil Shikdar",
                    "Researcher", "Department of Public Health",
                    "Daffodil International University",
                    "Researcher in the field of Public Health with an interest in healthcare research and clinical data evaluation.",
                    List.of("Public Health Research", "Clinical Data Evaluation", "Healthcare Systems", "Research Analytics"),
                    List.of("Evaluating healthcare data schemas", "Ensuring evidence-backed health solutions"),
                    false, 5);

            initContributor(team, "puja", "paromitakarmoker@gmail.com", "Paromita Karmoker Puja",
                    "Researcher", "Department of Public Health",
                    "Daffodil International University",
                    "Researcher in the field of Public Health with an interest in healthcare research, clinical data evaluation, and evidence-based healthcare solutions. Contributes research-oriented perspectives to the ShasthoSetu project.",
                    List.of("Public Health Research", "Clinical Data Evaluation", "Healthcare Systems", "Research Analytics"),
                    List.of("Contributing public health research perspectives to ShasthoSetu", "Supporting healthcare data evaluation", "Analyzing healthcare needs", "Contributing evidence-based insights"),
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

    private void initContributor(Team team, String username, String email, String fullName, String designation,
                                 String department, String university, String bio,
                                 List<String> skills, List<String> responsibilities,
                                 boolean isLead, int order) {
        User user = userRepository.findByUsernameIgnoreCase(username)
                .or(() -> userRepository.findByEmailIgnoreCase(email))
                .orElseGet(() -> {
                    Role userRole = roleRepository.findById(RoleType.ROLE_USER.name()).orElseThrow();

                    User newUser = User.builder()
                            .username(username)
                            .fullName(fullName)
                            .email(email)
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

        if (teamMemberRepository.findByUserId(user.getId()).isEmpty()) {
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
