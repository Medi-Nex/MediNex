package com.medinex.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinex.admin.dto.AdminReportResolutionRequest;
import com.medinex.admin.dto.AdminUserUpdateDto;
import com.medinex.admin.dto.ModerateContentRequest;
import com.medinex.auth.dto.AuthResponse;
import com.medinex.auth.dto.LoginRequest;
import com.medinex.auth.dto.RegisterRequest;
import com.medinex.community.dto.CreatePostRequest;
import com.medinex.community.entity.PostVisibility;
import com.medinex.moderation.dto.ReportRequest;
import com.medinex.moderation.entity.ReportStatus;
import com.medinex.user.model.UserStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AdminIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String obtainAdminToken() throws Exception {
        LoginRequest login = LoginRequest.builder()
                .emailOrUsername("admin@medinex.health")
                .password("Admin@SecurePass2026!")
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        AuthResponse authResponse = objectMapper.readValue(
                objectMapper.readTree(responseBody).get("data").toString(),
                AuthResponse.class
        );
        return authResponse.getAccessToken();
    }

    private String obtainUserToken(String username, String email) throws Exception {
        RegisterRequest register = RegisterRequest.builder()
                .username(username)
                .email(email)
                .fullName("Regular User " + username)
                .password("Password123!")
                .agreeTerms(true)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(register)));

        LoginRequest login = LoginRequest.builder()
                .emailOrUsername(username)
                .password("Password123!")
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        AuthResponse authResponse = objectMapper.readValue(
                objectMapper.readTree(responseBody).get("data").toString(),
                AuthResponse.class
        );
        return authResponse.getAccessToken();
    }

    @Test
    void testNonAdminForbiddenFromAdminEndpoints() throws Exception {
        String userToken = obtainUserToken("regular_non_admin", "regular_non_admin@example.com");

        mockMvc.perform(get("/api/v1/admin/stats")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testAdminCanRetrieveDashboardStatsAndUsers() throws Exception {
        String adminToken = obtainAdminToken();

        // 1. Dashboard stats
        mockMvc.perform(get("/api/v1/admin/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalUsers", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.pendingReportsCount", greaterThanOrEqualTo(0)));

        // 2. Users list
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", not(empty())));

        // 3. Audit logs list
        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testAdminCanUpdateUserStatusAndRoles() throws Exception {
        String adminToken = obtainAdminToken();
        String userToken = obtainUserToken("target_to_update", "target_to_update@example.com");

        // Get target user ID from /api/v1/auth/me
        MvcResult meResult = mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andReturn();

        var meJson = objectMapper.readTree(meResult.getResponse().getContentAsString());
        UUID targetUserId = UUID.fromString(meJson.path("data").path("id").asText());

        // Update target user to SUSPENDED with ROLE_MODERATOR
        AdminUserUpdateDto updateRequest = AdminUserUpdateDto.builder()
                .status(UserStatus.SUSPENDED)
                .roles(List.of("ROLE_USER", "ROLE_MODERATOR"))
                .isTeamMember(true)
                .build();

        mockMvc.perform(put("/api/v1/admin/users/" + targetUserId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("SUSPENDED"))
                .andExpect(jsonPath("$.data.isTeamMember").value(true));
    }

    @Test
    void testAdminCanModeratePostAndResolveReport() throws Exception {
        String adminToken = obtainAdminToken();
        String userToken = obtainUserToken("author_flagged", "author_flagged@example.com");

        // 1. Author creates a post
        CreatePostRequest postReq = CreatePostRequest.builder()
                .content("Community post for moderation inspection.")
                .visibility(PostVisibility.PUBLIC)
                .build();

        MvcResult postResult = mockMvc.perform(post("/api/v1/community/posts")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(postReq)))
                .andExpect(status().isOk())
                .andReturn();

        UUID postId = UUID.fromString(objectMapper.readTree(postResult.getResponse().getContentAsString())
                .path("data").path("id").asText());

        // 2. Admin moderates post (hides it)
        ModerateContentRequest modReq = ModerateContentRequest.builder()
                .isHidden(true)
                .reason("Test moderation hide")
                .build();

        mockMvc.perform(patch("/api/v1/admin/posts/" + postId + "/moderate")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(modReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // 3. Another user reports author_flagged's post
        String reporterToken = obtainUserToken("reporter_user", "reporter_user@example.com");

        ReportRequest reportReq = ReportRequest.builder()
                .reportedPostId(postId)
                .reason("INAPPROPRIATE_CONTENT")
                .details("Investigate this content")
                .build();

        mockMvc.perform(post("/api/v1/users/author_flagged/report")
                        .header("Authorization", "Bearer " + reporterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reportReq)))
                .andExpect(status().isOk());

        // 4. Admin reviews reports
        MvcResult reportsResult = mockMvc.perform(get("/api/v1/admin/reports")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("status", "PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", not(empty())))
                .andReturn();

        UUID reportId = UUID.fromString(objectMapper.readTree(reportsResult.getResponse().getContentAsString())
                .path("data").path("content").get(0).path("id").asText());

        // 5. Admin resolves the report
        AdminReportResolutionRequest resolveReq = AdminReportResolutionRequest.builder()
                .status(ReportStatus.RESOLVED)
                .resolutionNotes("Verified and resolved by admin.")
                .action("HIDE_POST")
                .build();

        mockMvc.perform(post("/api/v1/admin/reports/" + reportId + "/resolve")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resolveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testAdminAnalyticsAndSettings() throws Exception {
        String adminToken = obtainAdminToken();

        // 1. Get analytics
        mockMvc.perform(get("/api/v1/admin/analytics")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalUsers", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.totalPosts", greaterThanOrEqualTo(0)));

        // 2. Get settings
        mockMvc.perform(get("/api/v1/admin/settings")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.requireEmailVerification").value(true));

        // 3. Update settings
        com.medinex.admin.dto.AdminSettingsDto update = com.medinex.admin.dto.AdminSettingsDto.builder()
                .maintenanceMode(false)
                .allowUserRegistration(true)
                .requireEmailVerification(true)
                .phiWarningBannerEnabled(true)
                .allowedDomains("medinex.health")
                .platformNotice("Strict HIPAA and zero PHI compliance enforced.")
                .build();

        mockMvc.perform(put("/api/v1/admin/settings")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.platformNotice", containsString("Strict HIPAA")));
    }

    @Test
    void testAdminPostsAndTeamManagement() throws Exception {
        String adminToken = obtainAdminToken();

        // 1. List posts for moderation
        mockMvc.perform(get("/api/v1/admin/posts")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());

        // 2. List team members
        mockMvc.perform(get("/api/v1/admin/team")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(6)));

        // 3. Update team member designation
        com.medinex.team.dto.TeamMemberDto updateReq = com.medinex.team.dto.TeamMemberDto.builder()
                .designation("Senior Lead Architect & Systems Engineer")
                .department("Biomedical Engineering")
                .university("BUET")
                .displayOrder(1)
                .build();

        mockMvc.perform(put("/api/v1/admin/team/contributor-01")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.designation").value("Senior Lead Architect & Systems Engineer"));
    }
}
