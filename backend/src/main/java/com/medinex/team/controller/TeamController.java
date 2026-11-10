package com.medinex.team.controller;

import com.medinex.common.api.ApiResponse;
import com.medinex.common.exception.ResourceNotFoundException;
import com.medinex.team.dto.TeamMemberDto;
import com.medinex.team.entity.TeamMember;
import com.medinex.team.repository.TeamMemberRepository;
import com.medinex.user.entity.UserProfile;
import com.medinex.user.repository.UserProfileRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/team")
@RequiredArgsConstructor
@Tag(name = "Team Management", description = "Endpoints for the official MediNex team and six contributors")
@Transactional(readOnly = true)
public class TeamController {

    private final TeamMemberRepository teamMemberRepository;
    private final UserProfileRepository userProfileRepository;

    @GetMapping("/members")
    @Operation(summary = "Get all six team contributor profiles")
    public ApiResponse<List<TeamMemberDto>> getMembers() {
        List<TeamMember> members = teamMemberRepository.findAllByOrderByDisplayOrderAsc();

        List<TeamMemberDto> dtos = members.stream().map(this::mapToDto).toList();
        return ApiResponse.ok(dtos, "Fetched " + dtos.size() + " team contributor profiles");
    }

    @GetMapping("/members/{username}")
    @Operation(summary = "Get individual contributor profile by username")
    public ApiResponse<TeamMemberDto> getMemberByUsername(@PathVariable String username) {
        TeamMember member = teamMemberRepository.findByUserUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("Contributor", "username", username));

        return ApiResponse.ok(mapToDto(member), "Fetched contributor profile");
    }

    @PutMapping("/members/{username}")
    @Transactional
    @Operation(summary = "Update verified contributor profile information")
    public ApiResponse<TeamMemberDto> updateMember(@PathVariable String username, @RequestBody TeamMemberDto updated) {
        TeamMember member = teamMemberRepository.findByUserUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("Contributor", "username", username));

        if (updated.getDesignation() != null) {
            member.setOfficialDesignation(updated.getDesignation());
        }
        if (updated.getDepartment() != null) {
            member.setDepartment(updated.getDepartment());
        }
        if (updated.getUniversity() != null) {
            member.setUniversity(updated.getUniversity());
        }
        member.setPlaceholder(false); // Verified update clears placeholder flag
        teamMemberRepository.save(member);

        userProfileRepository.findByUserId(member.getUser().getId()).ifPresent(profile -> {
            if (updated.getFullName() != null) member.getUser().setFullName(updated.getFullName());
            if (updated.getBio() != null) profile.setBio(updated.getBio());
            if (updated.getSkills() != null) profile.setSkills(updated.getSkills());
            if (updated.getResponsibilities() != null) profile.setResponsibilities(updated.getResponsibilities());
            if (updated.getGithubUrl() != null) profile.setGithubUrl(updated.getGithubUrl());
            if (updated.getLinkedinUrl() != null) profile.setLinkedinUrl(updated.getLinkedinUrl());
            profile.setVerifiedContributor(true);
            userProfileRepository.save(profile);
        });

        return ApiResponse.ok(mapToDto(member), "Profile updated with verified information");
    }

    private TeamMemberDto mapToDto(TeamMember member) {
        UserProfile profile = userProfileRepository.findByUserId(member.getUser().getId()).orElse(null);

        return TeamMemberDto.builder()
                .id(member.getId().toString())
                .username(member.getUser().getUsername())
                .fullName(member.getUser().getFullName())
                .designation(member.getOfficialDesignation())
                .department(member.getDepartment())
                .university(member.getUniversity())
                .bio(profile != null ? profile.getBio() : null)
                .skills(profile != null ? profile.getSkills() : List.of())
                .responsibilities(profile != null ? profile.getResponsibilities() : List.of())
                .portfolioUrl(profile != null ? profile.getPortfolioUrl() : null)
                .githubUrl(profile != null ? profile.getGithubUrl() : null)
                .linkedinUrl(profile != null ? profile.getLinkedinUrl() : null)
                .avatarUrl(profile != null ? profile.getAvatarUrl() : null)
                .isLead(member.isLead())
                .isPlaceholder(member.isPlaceholder())
                .publicVisibility(profile == null || profile.isPublicVisible())
                .verifiedJoinDate(profile != null ? profile.getVerifiedJoinDate() : null)
                .displayOrder(member.getDisplayOrder())
                .build();
    }
}
