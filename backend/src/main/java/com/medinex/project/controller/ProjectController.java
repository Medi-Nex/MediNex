package com.medinex.project.controller;

import com.medinex.common.api.ApiResponse;
import com.medinex.common.exception.ResourceNotFoundException;
import com.medinex.project.dto.ProjectDto;
import com.medinex.project.entity.Project;
import com.medinex.project.repository.ProjectRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
@Tag(name = "Project Management", description = "Endpoints for official MediNex initiatives (e.g. ShasthoSetu)")
@Transactional(readOnly = true)
public class ProjectController {

    private final ProjectRepository projectRepository;

    @GetMapping
    @Operation(summary = "List all projects")
    public ApiResponse<List<ProjectDto>> getProjects() {
        List<Project> projects = projectRepository.findAll();
        List<ProjectDto> dtos = projects.stream().map(this::mapToDto).toList();
        return ApiResponse.ok(dtos, "Projects retrieved successfully");
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get project details by slug")
    public ApiResponse<ProjectDto> getProjectBySlug(@PathVariable String slug) {
        Project project = projectRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "slug", slug));

        return ApiResponse.ok(mapToDto(project), "Project retrieved successfully");
    }

    @PutMapping("/{slug}")
    @Transactional
    @Operation(summary = "Update project information")
    public ApiResponse<ProjectDto> updateProject(@PathVariable String slug, @RequestBody ProjectDto updated) {
        Project project = projectRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "slug", slug));

        if (updated.getTitle() != null) project.setTitle(updated.getTitle());
        if (updated.getShortSummary() != null) project.setShortSummary(updated.getShortSummary());
        if (updated.getProblemStatement() != null) project.setProblemStatement(updated.getProblemStatement());
        if (updated.getProposedSolution() != null) project.setProposedSolution(updated.getProposedSolution());
        if (updated.getStage() != null) project.setStage(updated.getStage());
        if (updated.getTechStack() != null) project.setTechStack(updated.getTechStack());

        projectRepository.save(project);
        return ApiResponse.ok(mapToDto(project), "Project updated successfully");
    }

    private ProjectDto mapToDto(Project p) {
        return ProjectDto.builder()
                .id(p.getId().toString())
                .title(p.getTitle())
                .slug(p.getSlug())
                .shortSummary(p.getShortSummary())
                .problemStatement(p.getProblemStatement())
                .proposedSolution(p.getProposedSolution())
                .features(List.of(
                        Map.of("title", "Offline-First Triage Assessment", "description", "Records structured patient encounters locally and queues for asynchronous sync."),
                        Map.of("title", "Low-Bandwidth Asynchronous Consultation", "description", "Sends concise clinical cards over 2G/3G instead of heavy video streams."),
                        Map.of("title", "Strict Data Isolation", "description", "Patient clinical data segregated from public MediNex social community platform.")
                ))
                .techStack(p.getTechStack())
                .stage(p.getStage())
                .demoUrl(p.getDemoUrl())
                .repositoryUrl(p.getRepositoryUrl())
                .heroImageUrl(p.getHeroImageUrl())
                .isFeatured(p.isFeatured())
                .assignedMembers(List.of("contributor-01", "contributor-02", "contributor-03", "contributor-04", "contributor-05", "contributor-06"))
                .build();
    }
}
