package com.medinex.admin.controller;

import com.medinex.admin.dto.*;
import com.medinex.admin.service.AdminService;
import com.medinex.audit.entity.AuditLog;
import com.medinex.auth.dto.UserDto;
import com.medinex.common.api.ApiResponse;
import com.medinex.common.security.UserPrincipal;
import com.medinex.moderation.dto.ReportDto;
import com.medinex.moderation.entity.ReportStatus;
import com.medinex.team.dto.TeamMemberDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin & Moderation Console", description = "Endpoints for platform administration, user management, moderation, and immutable audit logs")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    @Operation(summary = "Get real dashboard metrics and statistics")
    public ApiResponse<AdminDashboardStatsDto> getStats() {
        return ApiResponse.ok(adminService.getDashboardStats(), "Admin dashboard statistics retrieved");
    }

    @GetMapping("/users")
    @Operation(summary = "Get paginated user accounts")
    public ApiResponse<Page<UserDto>> getUsers(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(adminService.getUsers(pageable), "Users list retrieved");
    }

    @PutMapping("/users/{id}")
    @Operation(summary = "Update user status, roles, or team member designation")
    public ApiResponse<UserDto> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody AdminUserUpdateDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UserDto updated = adminService.updateUser(id, request, principal.getId());
        return ApiResponse.ok(updated, "User updated successfully");
    }

    @GetMapping("/reports")
    @Operation(summary = "Get paginated moderation reports")
    public ApiResponse<Page<ReportDto>> getReports(
            @RequestParam(required = false) ReportStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(adminService.getReports(status, pageable), "Moderation reports retrieved");
    }

    @PostMapping("/reports/{id}/resolve")
    @Operation(summary = "Resolve or dismiss a moderation report")
    public ApiResponse<Void> resolveReport(
            @PathVariable UUID id,
            @Valid @RequestBody AdminReportResolutionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        adminService.resolveReport(id, request, principal.getId());
        return ApiResponse.ok(null, "Report resolved successfully");
    }

    @PatchMapping("/posts/{id}/moderate")
    @Operation(summary = "Moderate community post (hide/unhide)")
    public ApiResponse<Void> moderatePost(
            @PathVariable UUID id,
            @RequestBody ModerateContentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        adminService.moderatePost(id, request.isHidden(), principal.getId());
        return ApiResponse.ok(null, request.isHidden() ? "Post hidden by admin" : "Post unhidden by admin");
    }

    @PatchMapping("/comments/{id}/moderate")
    @Operation(summary = "Moderate community comment (hide/unhide)")
    public ApiResponse<Void> moderateComment(
            @PathVariable UUID id,
            @RequestBody ModerateContentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        adminService.moderateComment(id, request.isHidden(), principal.getId());
        return ApiResponse.ok(null, request.isHidden() ? "Comment hidden by admin" : "Comment unhidden by admin");
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Get immutable system audit logs")
    public ApiResponse<Page<AuditLog>> getAuditLogs(
            @PageableDefault(size = 30, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(adminService.getAuditLogs(pageable), "Audit logs retrieved");
    }

    @GetMapping("/posts")
    @Operation(summary = "Get paginated posts for moderation")
    public ApiResponse<Page<AdminPostDto>> getPosts(
            @RequestParam(required = false) Boolean hidden,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(adminService.getPosts(hidden, pageable), "Posts list retrieved");
    }

    @GetMapping("/comments")
    @Operation(summary = "Get paginated comments for moderation")
    public ApiResponse<Page<AdminCommentDto>> getComments(
            @RequestParam(required = false) Boolean hidden,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(adminService.getComments(hidden, pageable), "Comments list retrieved");
    }

    @GetMapping("/media")
    @Operation(summary = "Get paginated media attachments for review")
    public ApiResponse<Page<AdminMediaDto>> getMedia(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.ok(adminService.getMedia(pageable), "Media assets retrieved");
    }

    @GetMapping("/analytics")
    @Operation(summary = "Get comprehensive platform analytics")
    public ApiResponse<AdminAnalyticsDto> getAnalytics() {
        return ApiResponse.ok(adminService.getAnalytics(), "Platform analytics retrieved");
    }

    @GetMapping("/settings")
    @Operation(summary = "Get platform settings")
    public ApiResponse<AdminSettingsDto> getSettings() {
        return ApiResponse.ok(adminService.getSettings(), "Platform settings retrieved");
    }

    @PutMapping("/settings")
    @Operation(summary = "Update platform settings")
    public ApiResponse<AdminSettingsDto> updateSettings(
            @RequestBody AdminSettingsDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(adminService.updateSettings(request, principal.getId()), "Platform settings updated");
    }

    @GetMapping("/team")
    @Operation(summary = "Get all team contributor profiles for admin management")
    public ApiResponse<List<TeamMemberDto>> getTeamMembers() {
        return ApiResponse.ok(adminService.getTeamMembers(), "Team members retrieved");
    }

    @PutMapping("/team/{username}")
    @Operation(summary = "Update team member profile by admin")
    public ApiResponse<TeamMemberDto> updateTeamMember(
            @PathVariable String username,
            @RequestBody TeamMemberDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(adminService.updateTeamMember(username, request, principal.getId()), "Team member updated");
    }
}
