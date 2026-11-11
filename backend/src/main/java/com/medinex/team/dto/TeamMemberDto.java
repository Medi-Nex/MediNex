package com.medinex.team.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberDto {
    private String id;
    private String username;
    private String fullName;
    private String designation;
    private String department;
    private String university;
    private String bio;
    private List<String> skills;
    private List<String> responsibilities;
    private String portfolioUrl;
    private String githubUrl;
    private String linkedinUrl;
    private String avatarUrl;
    private String avatarSmUrl;
    private String avatarLgUrl;

    @JsonProperty("isLead")
    private boolean isLead;

    @JsonProperty("isPlaceholder")
    private boolean isPlaceholder;

    @JsonProperty("publicVisibility")
    private boolean publicVisibility;

    private LocalDate verifiedJoinDate;
    private int displayOrder;
}
