package com.medinex.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    private String fullName;
    private String headline;
    private String designation;
    private String department;
    private String university;
    private String bio;
    private List<String> skills;
    private List<String> responsibilities;
    private String portfolioUrl;
    private String githubUrl;
    private String linkedinUrl;

    @JsonProperty("isPublicVisible")
    private Boolean isPublicVisible;
}
