package com.medinex.project.controller;

import com.medinex.common.api.ApiResponse;
import com.medinex.common.exception.ResourceNotFoundException;
import com.medinex.project.dto.ProjectDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v1/projects")
@Tag(name = "Project Management", description = "Endpoints for official MediNex initiatives (e.g. ShasthoSetu)")
public class ProjectController {

    private final Map<String, ProjectDto> projectStore = new ConcurrentHashMap<>();

    public ProjectController() {
        initProjects();
    }

    private void initProjects() {
        ProjectDto shasthoSetu = ProjectDto.builder()
                .id("proj-shasthosetu")
                .title("ShasthoSetu (স্বাস্থ্যসেতু)")
                .slug("shasthosetu")
                .shortSummary("An experimental smart healthcare connectivity bridge engineered to connect grassroots community clinics and remote healthcare workers with specialized tele-consultation support.")
                .problemStatement("In underserved rural regions, community clinics frequently lack on-site specialized physicians. Patients face prohibitive travel costs, delayed diagnoses, and fragmented medical guidance.")
                .proposedSolution("ShasthoSetu is designed as an edge-resilient digital health bridge with offline-first structured triage templates, automated vital-sign capture guidelines, and asynchronous doctor consultation routing.")
                .features(List.of(
                        Map.of("title", "Offline-First Triage Assessment", "description", "Records structured patient encounters locally and queues for asynchronous sync."),
                        Map.of("title", "Low-Bandwidth Asynchronous Consultation", "description", "Sends concise clinical cards over 2G/3G instead of heavy video streams."),
                        Map.of("title", "Strict Data Isolation", "description", "Patient clinical data segregated from public MediNex social community platform.")
                ))
                .techStack(List.of("Next.js App Router", "Java 21 Spring Boot", "PostgreSQL", "Docker"))
                .stage("DEVELOPMENT")
                .isFeatured(true)
                .repositoryUrl("https://github.com/Medi-Nex")
                .assignedMembers(List.of("contributor-01", "contributor-02", "contributor-03", "contributor-04", "contributor-05", "contributor-06"))
                .build();

        projectStore.put(shasthoSetu.getSlug(), shasthoSetu);
    }

    @GetMapping
    @Operation(summary = "List all projects")
    public ApiResponse<List<ProjectDto>> getProjects() {
        return ApiResponse.ok(new ArrayList<>(projectStore.values()), "Projects retrieved successfully");
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get project details by slug")
    public ApiResponse<ProjectDto> getProjectBySlug(@PathVariable String slug) {
        ProjectDto dto = projectStore.get(slug);
        if (dto == null) {
            throw new ResourceNotFoundException("Project", "slug", slug);
        }
        return ApiResponse.ok(dto, "Project retrieved successfully");
    }

    @PutMapping("/{slug}")
    @Operation(summary = "Update project information")
    public ApiResponse<ProjectDto> updateProject(@PathVariable String slug, @RequestBody ProjectDto updated) {
        ProjectDto existing = projectStore.get(slug);
        if (existing == null) {
            throw new ResourceNotFoundException("Project", "slug", slug);
        }
        updated.setId(existing.getId());
        updated.setSlug(existing.getSlug());
        projectStore.put(slug, updated);
        return ApiResponse.ok(updated, "Project updated successfully");
    }
}
