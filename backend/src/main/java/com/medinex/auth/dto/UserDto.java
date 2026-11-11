package com.medinex.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.medinex.user.entity.User;
import com.medinex.user.entity.UserProfile;
import com.medinex.user.model.UserStatus;
import com.medinex.user.service.AvatarUrlHelper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private UUID id;
    private String username;
    private String email;
    private String fullName;
    private UserStatus status;
    private boolean emailVerified;

    @JsonProperty("isTeamMember")
    private boolean isTeamMember;

    @JsonProperty("isPublicVisible")
    @Builder.Default
    private boolean isPublicVisible = true;

    @JsonProperty("isVerifiedContributor")
    private boolean isVerifiedContributor;

    private String headline;
    private String designation;
    private String department;
    private String university;
    private String bio;

    @Builder.Default
    private List<String> skills = new ArrayList<>();

    @Builder.Default
    private List<String> responsibilities = new ArrayList<>();

    private String portfolioUrl;
    private String githubUrl;
    private String linkedinUrl;
    private String avatarUrl;
    private String avatarSmUrl;
    private String avatarLgUrl;
    private String coverImageUrl;

    private List<String> roles;
    private Instant createdAt;

    public static UserDto fromEntity(User user) {
        return buildFromEntity(user, true);
    }

    public static UserDto fromPublicEntity(User user) {
        return buildFromEntity(user, false);
    }

    private static UserDto buildFromEntity(User user, boolean includeEmail) {
        UserProfile profile = user.getProfile();
        boolean publicVisible = profile == null || profile.isPublicVisible();
        String avatarUrl = profile != null ? profile.getAvatarUrl() : null;

        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(includeEmail ? user.getEmail() : null)
                .fullName(user.getFullName())
                .status(user.getStatus())
                .emailVerified(user.isEmailVerified())
                .isTeamMember(user.isTeamMember())
                .isPublicVisible(publicVisible)
                .isVerifiedContributor(profile != null && profile.isVerifiedContributor())
                .headline(profile != null ? profile.getHeadline() : null)
                .designation(profile != null ? profile.getDesignation() : null)
                .department(profile != null ? profile.getDepartment() : null)
                .university(profile != null ? profile.getUniversity() : null)
                .bio(profile != null ? profile.getBio() : null)
                .skills(profile != null && profile.getSkills() != null ? List.copyOf(profile.getSkills()) : List.of())
                .responsibilities(profile != null && profile.getResponsibilities() != null ? List.copyOf(profile.getResponsibilities()) : List.of())
                .portfolioUrl(profile != null ? profile.getPortfolioUrl() : null)
                .githubUrl(profile != null ? profile.getGithubUrl() : null)
                .linkedinUrl(profile != null ? profile.getLinkedinUrl() : null)
                .avatarUrl(avatarUrl)
                .avatarSmUrl(AvatarUrlHelper.deriveVariant(avatarUrl, AvatarUrlHelper.VARIANT_SM))
                .avatarLgUrl(AvatarUrlHelper.deriveVariant(avatarUrl, AvatarUrlHelper.VARIANT_LG))
                .coverImageUrl(profile != null ? profile.getCoverImageUrl() : null)
                .roles(user.getRoles().stream().map(r -> r.getName()).toList())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
