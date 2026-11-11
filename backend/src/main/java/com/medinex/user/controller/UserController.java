package com.medinex.user.controller;

import com.medinex.auth.dto.UserDto;
import com.medinex.common.api.ApiResponse;
import com.medinex.common.security.UserPrincipal;
import com.medinex.user.dto.UpdateProfileRequest;
import com.medinex.user.dto.UpdateUsernameRequest;
import com.medinex.user.dto.UsernameAvailabilityDto;
import com.medinex.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User & Profile Management", description = "Endpoints for fetching and updating community user profiles")
public class UserController {

    private final UserService userService;

    @GetMapping("/username-availability")
    @Operation(summary = "Check whether a candidate username handle is valid and available")
    public ApiResponse<UsernameAvailabilityDto> checkUsernameAvailability(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "username", defaultValue = "") String username) {
        java.util.UUID viewerId = principal != null ? principal.getId() : null;
        UsernameAvailabilityDto result = userService.checkUsernameAvailability(username, viewerId);
        return ApiResponse.ok(result, "Username availability checked");
    }

    @GetMapping("/{username}")
    @Operation(summary = "Get user profile by username (enforces private profile access rules)")
    public ApiResponse<UserDto> getUserByUsername(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String username) {
        java.util.UUID viewerId = principal != null ? principal.getId() : null;
        UserDto user = userService.getUserByUsername(username, viewerId);
        return ApiResponse.ok(user, "User profile retrieved successfully");
    }

    @PutMapping("/profile")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update authenticated user's profile details")
    public ApiResponse<UserDto> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UpdateProfileRequest request) {
        UserDto updated = userService.updateProfile(principal.getId(), request);
        return ApiResponse.ok(updated, "Profile updated successfully");
    }

    @PutMapping("/profile/username")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Change authenticated user's unique @username handle")
    public ApiResponse<UserDto> updateUsername(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateUsernameRequest request) {
        UserDto updated = userService.updateUsername(principal.getId(), request.getUsername());
        return ApiResponse.ok(updated, "Username updated successfully");
    }

    @PostMapping(value = "/profile/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Upload and process multi-resolution profile avatar (64px, 256px, 512px)")
    public ApiResponse<UserDto> uploadAvatar(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {
        UserDto updated = userService.uploadAvatar(principal.getId(), file);
        return ApiResponse.ok(updated, "Profile photo uploaded and resized successfully");
    }

    @DeleteMapping("/profile/avatar")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Remove authenticated user's profile avatar")
    public ApiResponse<UserDto> removeAvatar(@AuthenticationPrincipal UserPrincipal principal) {
        UserDto updated = userService.removeAvatar(principal.getId());
        return ApiResponse.ok(updated, "Profile photo removed successfully");
    }

    @PostMapping(value = "/profile/banner", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Upload and process wide profile cover banner (1600x400 JPEG)")
    public ApiResponse<UserDto> uploadBanner(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {
        UserDto updated = userService.uploadBanner(principal.getId(), file);
        return ApiResponse.ok(updated, "Profile banner uploaded successfully");
    }

    @DeleteMapping("/profile/banner")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Remove authenticated user's profile cover banner")
    public ApiResponse<UserDto> removeBanner(@AuthenticationPrincipal UserPrincipal principal) {
        UserDto updated = userService.removeBanner(principal.getId());
        return ApiResponse.ok(updated, "Profile banner removed successfully");
    }
}
