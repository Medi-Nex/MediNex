package com.medinex.user.controller;

import com.medinex.auth.dto.UserDto;
import com.medinex.common.api.ApiResponse;
import com.medinex.common.security.UserPrincipal;
import com.medinex.user.dto.UpdateProfileRequest;
import com.medinex.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User & Profile Management", description = "Endpoints for fetching and updating community user profiles")
public class UserController {

    private final UserService userService;

    @GetMapping("/{username}")
    @Operation(summary = "Get public user profile by username")
    public ApiResponse<UserDto> getUserByUsername(@PathVariable String username) {
        UserDto user = userService.getUserByUsername(username);
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
}
