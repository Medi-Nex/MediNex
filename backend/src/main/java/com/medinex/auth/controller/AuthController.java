package com.medinex.auth.controller;

import com.medinex.auth.dto.*;
import com.medinex.auth.service.AuthService;
import com.medinex.common.api.ApiResponse;
import com.medinex.common.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication & Identity", description = "Endpoints for registration, login, token refresh, and password recovery")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new community member")
    public ResponseEntity<ApiResponse<UserDto>> register(@Valid @RequestBody RegisterRequest request) {
        UserDto user = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok(user, "Registration successful. Please check your email for verification."));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and receive JWT tokens")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ApiResponse.ok(response, "Login successful");
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate refresh token and obtain a new access token")
    public ApiResponse<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ApiResponse.ok(response, "Token refreshed successfully");
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke active session and refresh token")
    public ApiResponse<Void> logout(@RequestBody(required = false) RefreshTokenRequest request) {
        if (request != null && request.getRefreshToken() != null) {
            authService.logout(request.getRefreshToken());
        }
        return ApiResponse.ok(null, "Logged out successfully");
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify account using email verification token")
    public ApiResponse<Void> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request);
        return ApiResponse.ok(null, "Email verified successfully. You may now participate fully.");
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend email verification code with 2-minute cooldown")
    public ApiResponse<Void> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerificationEmail(request);
        return ApiResponse.ok(null, "If an unverified account exists for this email, a verification code has been dispatched.");
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request a one-time password reset token")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ApiResponse.ok(null, "If an account exists with this email, a password reset token has been dispatched.");
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset account password with valid token")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.ok(null, "Password reset successfully. You may now log in with your new password.");
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Get current authenticated user profile")
    public ApiResponse<UserDto> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ApiResponse.error("Not authenticated", null);
        }
        UserDto user = authService.getCurrentUser(principal.getId());
        return ApiResponse.ok(user, "Fetched authenticated profile");
    }

    @PostMapping("/change-password")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Change password for authenticated user")
    public ApiResponse<Void> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(principal.getId(), request);
        return ApiResponse.ok(null, "Password changed successfully");
    }
}
