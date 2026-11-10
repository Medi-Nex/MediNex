package com.medinex.follow.controller;

import com.medinex.common.api.ApiResponse;
import com.medinex.common.security.UserPrincipal;
import com.medinex.follow.dto.*;
import com.medinex.follow.service.FollowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@RequiredArgsConstructor
@Tag(name = "Follow & Relationships System", description = "Endpoints for following teams, individual contributors, blocking, and managing follow requests")
public class FollowController {

    private final FollowService followService;

    // --------------------------------------------------------------------------
    // USER FOLLOW ENDPOINTS
    // --------------------------------------------------------------------------

    @PostMapping("/api/v1/users/{username}/follow")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Follow a user or contributor (or request if private)")
    public ApiResponse<FollowStatsDto> followUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String username) {
        FollowStatsDto stats = followService.followUser(principal.getId(), username);
        return ApiResponse.ok(stats, "Follow action processed");
    }

    @DeleteMapping("/api/v1/users/{username}/follow")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Unfollow a user or contributor")
    public ApiResponse<FollowStatsDto> unfollowUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String username) {
        FollowStatsDto stats = followService.unfollowUser(principal.getId(), username);
        return ApiResponse.ok(stats, "Unfollowed successfully");
    }

    @GetMapping("/api/v1/users/{username}/follow-stats")
    @Operation(summary = "Get user follower & following counts and relationship status")
    public ApiResponse<FollowStatsDto> getUserFollowStats(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String username) {
        UUID currentUserId = principal != null ? principal.getId() : null;
        FollowStatsDto stats = followService.getUserFollowStats(currentUserId, username);
        return ApiResponse.ok(stats, "User follow stats retrieved");
    }

    @GetMapping("/api/v1/users/{username}/followers")
    @Operation(summary = "Get paginated followers for a user")
    public ApiResponse<Page<FollowUserDto>> getUserFollowers(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String username,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        UUID currentUserId = principal != null ? principal.getId() : null;
        Page<FollowUserDto> followers = followService.getUserFollowers(username, currentUserId, pageable);
        return ApiResponse.ok(followers, "Followers retrieved successfully");
    }

    @GetMapping("/api/v1/users/{username}/following")
    @Operation(summary = "Get paginated users followed by a user")
    public ApiResponse<Page<FollowUserDto>> getUserFollowing(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String username,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        UUID currentUserId = principal != null ? principal.getId() : null;
        Page<FollowUserDto> following = followService.getUserFollowing(username, currentUserId, pageable);
        return ApiResponse.ok(following, "Following list retrieved successfully");
    }

    // --------------------------------------------------------------------------
    // TEAM FOLLOW ENDPOINTS
    // --------------------------------------------------------------------------

    @PostMapping("/api/v1/team/follow")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Follow the official MediNex team account")
    public ApiResponse<TeamFollowStatsDto> followTeam(
            @AuthenticationPrincipal UserPrincipal principal) {
        TeamFollowStatsDto stats = followService.followTeam(principal.getId());
        return ApiResponse.ok(stats, "Followed official MediNex team");
    }

    @DeleteMapping("/api/v1/team/follow")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Unfollow the official MediNex team account")
    public ApiResponse<TeamFollowStatsDto> unfollowTeam(
            @AuthenticationPrincipal UserPrincipal principal) {
        TeamFollowStatsDto stats = followService.unfollowTeam(principal.getId());
        return ApiResponse.ok(stats, "Unfollowed official MediNex team");
    }

    @GetMapping("/api/v1/team/follow-stats")
    @Operation(summary = "Get official MediNex team follower count and follow state")
    public ApiResponse<TeamFollowStatsDto> getTeamFollowStats(
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID currentUserId = principal != null ? principal.getId() : null;
        TeamFollowStatsDto stats = followService.getTeamFollowStats(currentUserId);
        return ApiResponse.ok(stats, "Team follow stats retrieved");
    }

    @GetMapping("/api/v1/team/followers")
    @Operation(summary = "Get paginated followers of the official MediNex team")
    public ApiResponse<Page<FollowUserDto>> getTeamFollowers(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        UUID currentUserId = principal != null ? principal.getId() : null;
        Page<FollowUserDto> followers = followService.getTeamFollowers(currentUserId, pageable);
        return ApiResponse.ok(followers, "Team followers retrieved successfully");
    }

    // --------------------------------------------------------------------------
    // BLOCKING & UNBLOCKING
    // --------------------------------------------------------------------------

    @PostMapping("/api/v1/users/{username}/block")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Block a user to prevent mutual interactions and sever follow ties")
    public ApiResponse<Void> blockUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String username,
            @RequestBody(required = false) BlockRequest request) {
        String reason = request != null ? request.getReason() : null;
        followService.blockUser(principal.getId(), username, reason);
        return ApiResponse.ok(null, "User blocked successfully");
    }

    @DeleteMapping("/api/v1/users/{username}/block")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Unblock a user")
    public ApiResponse<Void> unblockUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String username) {
        followService.unblockUser(principal.getId(), username);
        return ApiResponse.ok(null, "User unblocked successfully");
    }

    @GetMapping("/api/v1/users/blocks")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get list of users blocked by authenticated user")
    public ApiResponse<List<BlockedUserDto>> getBlockedUsers(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(followService.getBlockedUsers(principal.getId()), "Blocked users retrieved successfully");
    }

    // --------------------------------------------------------------------------
    // FOLLOW REQUESTS (PRIVATE PROFILES)
    // --------------------------------------------------------------------------

    @GetMapping("/api/v1/users/follow-requests")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get pending follow requests for the authenticated user")
    public ApiResponse<Page<FollowRequestDto>> getFollowRequests(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<FollowRequestDto> requests = followService.getPendingFollowRequests(principal.getId(), pageable);
        return ApiResponse.ok(requests, "Follow requests retrieved");
    }

    @PostMapping("/api/v1/users/follow-requests/{id}/accept")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Accept a pending follow request")
    public ApiResponse<Void> acceptFollowRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        followService.acceptFollowRequest(principal.getId(), id);
        return ApiResponse.ok(null, "Follow request accepted");
    }

    @PostMapping("/api/v1/users/follow-requests/{id}/reject")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Reject a pending follow request")
    public ApiResponse<Void> rejectFollowRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        followService.rejectFollowRequest(principal.getId(), id);
        return ApiResponse.ok(null, "Follow request rejected");
    }
}
