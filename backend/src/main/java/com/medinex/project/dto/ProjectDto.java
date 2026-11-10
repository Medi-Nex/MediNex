package com.medinex.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDto {
    private String id;
    private String title;
    private String slug;
    private String shortSummary;
    private String problemStatement;
    private String proposedSolution;
    private List<Map<String, String>> features;
    private List<String> techStack;
    private String stage; // PLANNING, RESEARCH, DEVELOPMENT, TESTING, PILOT, COMPLETED
    private String demoUrl;
    private String repositoryUrl;
    private String heroImageUrl;
    private boolean isFeatured;
    private List<String> assignedMembers;
}
