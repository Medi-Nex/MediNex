package com.medinex.project.entity;

import com.medinex.team.entity.Team;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, unique = true, length = 150)
    private String slug;

    @Column(name = "short_summary", nullable = false, length = 350)
    private String shortSummary;

    @Column(name = "problem_statement", nullable = false, columnDefinition = "TEXT")
    private String problemStatement;

    @Column(name = "proposed_solution", nullable = false, columnDefinition = "TEXT")
    private String proposedSolution;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "project_tech_stack", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "technology")
    @Builder.Default
    private List<String> techStack = new ArrayList<>();

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String stage = "PLANNING"; // PLANNING, RESEARCH, DEVELOPMENT, TESTING, PILOT, COMPLETED

    @Column(name = "demo_url", length = 500)
    private String demoUrl;

    @Column(name = "repository_url", length = 500)
    private String repositoryUrl;

    @Column(name = "hero_image_url", length = 500)
    private String heroImageUrl;

    @Column(name = "is_featured", nullable = false)
    @Builder.Default
    private boolean isFeatured = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
