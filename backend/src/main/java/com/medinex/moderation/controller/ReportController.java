package com.medinex.moderation.controller;

import com.medinex.common.api.ApiResponse;
import com.medinex.common.security.UserPrincipal;
import com.medinex.moderation.dto.ReportRequest;
import com.medinex.moderation.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Moderation & Reporting", description = "Endpoints for reporting users, content moderation, and community safety")
public class ReportController {

    private final ReportService reportService;

    @PostMapping("/{username}/report")
    @SecurityRequirement(name = "BearerAuth")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Submit a moderation report against a user")
    public ApiResponse<Void> reportUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String username,
            @Valid @RequestBody ReportRequest request) {
        reportService.reportUser(principal.getId(), username, request);
        return ApiResponse.ok(null, "Report submitted successfully for moderator review");
    }
}
