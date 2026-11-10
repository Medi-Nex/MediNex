package com.medinex.team.controller;

import com.medinex.common.api.ApiResponse;
import com.medinex.common.exception.ResourceNotFoundException;
import com.medinex.team.dto.TeamMemberDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v1/team")
@Tag(name = "Team Management", description = "Endpoints for the official MediNex team and six contributors")
public class TeamController {

    // In Phase 1, backed by initialized structured placeholder repository
    private final Map<String, TeamMemberDto> memberStore = new ConcurrentHashMap<>();

    public TeamController() {
        initMembers();
    }

    private void initMembers() {
        addMember(TeamMemberDto.builder()
                .id("mem-01")
                .username("contributor-01")
                .fullName("Contributor 01 [Placeholder]")
                .designation("Team Lead & Systems Architect")
                .department("Computer Science & Engineering")
                .university("University Engineering Department [Pending Verification]")
                .bio("Placeholder profile for Team Contributor 1. Responsible for system architecture, backend integration, and project coordination for E-Health Hackathon 2026.")
                .skills(List.of("Distributed Systems", "Java Spring Boot", "PostgreSQL", "System Architecture"))
                .responsibilities(List.of("Platform architecture", "Data isolation oversight", "Hackathon coordination"))
                .githubUrl("https://github.com")
                .linkedinUrl("https://linkedin.com")
                .isLead(true)
                .isPlaceholder(true)
                .publicVisibility(true)
                .verifiedJoinDate(LocalDate.of(2026, 1, 15))
                .displayOrder(1)
                .build());

        addMember(TeamMemberDto.builder()
                .id("mem-02")
                .username("contributor-02")
                .fullName("Contributor 02 [Placeholder]")
                .designation("Full-Stack Web & Next.js Specialist")
                .department("Software Engineering")
                .university("Institute of Information Technology [Pending Verification]")
                .bio("Placeholder profile for Team Contributor 2. Spearheading front-end interface development, responsive UI accessibility (WCAG 2.2), and community feed components.")
                .skills(List.of("Next.js App Router", "TypeScript", "Tailwind CSS", "React Hook Form"))
                .responsibilities(List.of("Frontend views", "Hybrid design implementation", "Core Web Vitals"))
                .githubUrl("https://github.com")
                .linkedinUrl("https://linkedin.com")
                .isLead(false)
                .isPlaceholder(true)
                .publicVisibility(true)
                .verifiedJoinDate(LocalDate.of(2026, 1, 15))
                .displayOrder(2)
                .build());

        addMember(TeamMemberDto.builder()
                .id("mem-03")
                .username("contributor-03")
                .fullName("Contributor 03 [Placeholder]")
                .designation("Health Informatics & Data Architect")
                .department("Biomedical Engineering & Informatics")
                .university("Department of Biomedical Science [Pending Verification]")
                .bio("Placeholder profile for Team Contributor 3. Specializing in healthcare data schemas, standards evaluation, and relational database migrations.")
                .skills(List.of("PostgreSQL", "Data Modeling", "Health Informatics Research", "Relational Indexing"))
                .responsibilities(List.of("Schema migrations", "Data segregation enforcement", "Compliance research"))
                .githubUrl("https://github.com")
                .linkedinUrl("https://linkedin.com")
                .isLead(false)
                .isPlaceholder(true)
                .publicVisibility(true)
                .verifiedJoinDate(LocalDate.of(2026, 1, 15))
                .displayOrder(3)
                .build());

        addMember(TeamMemberDto.builder()
                .id("mem-04")
                .username("contributor-04")
                .fullName("Contributor 04 [Placeholder]")
                .designation("Telemedicine & Mobile Integration Lead")
                .department("Electrical & Electronic Engineering")
                .university("Engineering Faculty [Pending Verification]")
                .bio("Placeholder profile for Team Contributor 4. Leading research and interface prototyping for the ShasthoSetu connected telemedicine bridge.")
                .skills(List.of("WebRTC Research", "Low-bandwidth Optimization", "Mobile Architecture"))
                .responsibilities(List.of("Offline queuing prototype", "Low-bandwidth audio testing", "ShasthoSetu specs"))
                .githubUrl("https://github.com")
                .linkedinUrl("https://linkedin.com")
                .isLead(false)
                .isPlaceholder(true)
                .publicVisibility(true)
                .verifiedJoinDate(LocalDate.of(2026, 1, 15))
                .displayOrder(4)
                .build());

        addMember(TeamMemberDto.builder()
                .id("mem-05")
                .username("contributor-05")
                .fullName("Contributor 05 [Placeholder]")
                .designation("Clinical Workflow & UX Researcher")
                .department("Public Health & Human Factors")
                .university("School of Public Health [Pending Verification]")
                .bio("Placeholder profile for Team Contributor 5. Conducting user empathy studies, clinical workflow interviews with healthcare workers, and usability evaluations.")
                .skills(List.of("User Research", "Workflow Mapping", "Accessibility Audits", "Figma"))
                .responsibilities(List.of("Field usability research", "Bilingual UX testing", "Clinical journey maps"))
                .githubUrl("https://github.com")
                .linkedinUrl("https://linkedin.com")
                .isLead(false)
                .isPlaceholder(true)
                .publicVisibility(true)
                .verifiedJoinDate(LocalDate.of(2026, 1, 15))
                .displayOrder(5)
                .build());

        addMember(TeamMemberDto.builder()
                .id("mem-06")
                .username("contributor-06")
                .fullName("Contributor 06 [Placeholder]")
                .designation("DevSecOps & Compliance Specialist")
                .department("Information Security")
                .university("Faculty of Computer & Information Science [Pending Verification]")
                .bio("Placeholder profile for Team Contributor 6. Responsible for container orchestration, secure token infrastructure, automated test pipelines, and vulnerability assessments.")
                .skills(List.of("Docker & Compose", "Spring Security", "Linux Hardening", "JWT Architecture"))
                .responsibilities(List.of("Container configurations", "OWASP compliance checks", "DevOps orchestration"))
                .githubUrl("https://github.com")
                .linkedinUrl("https://linkedin.com")
                .isLead(false)
                .isPlaceholder(true)
                .publicVisibility(true)
                .verifiedJoinDate(LocalDate.of(2026, 1, 15))
                .displayOrder(6)
                .build());
    }

    private void addMember(TeamMemberDto m) {
        memberStore.put(m.getUsername(), m);
    }

    @GetMapping("/members")
    @Operation(summary = "Get all six team contributor profiles")
    public ApiResponse<List<TeamMemberDto>> getMembers() {
        List<TeamMemberDto> list = new ArrayList<>(memberStore.values());
        list.sort((a, b) -> Integer.compare(a.getDisplayOrder(), b.getDisplayOrder()));
        return ApiResponse.ok(list, "Fetched 6 team contributor profiles");
    }

    @GetMapping("/members/{username}")
    @Operation(summary = "Get individual contributor profile by username")
    public ApiResponse<TeamMemberDto> getMemberByUsername(@PathVariable String username) {
        TeamMemberDto dto = memberStore.get(username);
        if (dto == null) {
            throw new ResourceNotFoundException("Contributor", "username", username);
        }
        return ApiResponse.ok(dto, "Fetched contributor profile");
    }

    @PutMapping("/members/{username}")
    @Operation(summary = "Update verified contributor profile information")
    public ApiResponse<TeamMemberDto> updateMember(@PathVariable String username, @RequestBody TeamMemberDto updated) {
        TeamMemberDto existing = memberStore.get(username);
        if (existing == null) {
            throw new ResourceNotFoundException("Contributor", "username", username);
        }
        updated.setId(existing.getId());
        updated.setUsername(existing.getUsername());
        updated.setPlaceholder(false); // Clear placeholder flag once updated with verified details
        memberStore.put(username, updated);
        return ApiResponse.ok(updated, "Profile updated with verified information");
    }
}
