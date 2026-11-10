package com.medinex.e2e;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinex.admin.dto.AdminReportResolutionRequest;
import com.medinex.auth.dto.AuthResponse;
import com.medinex.auth.dto.LoginRequest;
import com.medinex.auth.dto.RegisterRequest;
import com.medinex.community.dto.CreateCommentRequest;
import com.medinex.community.dto.CreatePostRequest;
import com.medinex.community.entity.PostVisibility;
import com.medinex.moderation.dto.ReportRequest;
import com.medinex.moderation.entity.ReportStatus;
import org.junit.jupiter.api.DisplayName;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-End Orchestrated Lifecycle Integration Test.
 * Validates the complete user workflow required by Master Prompt Section 16:
 * 1. Register
 * 2. Authenticate & Obtain Tokens
 * 3. Follow MediNex Official Team
 * 4. Follow Team Member & Assert Counts
 * 5. Publish Community Post with Attachments
 * 6. Social Reactions (Likes, Unlike, Re-like)
 * 7. Hierarchical Comments & Nested Thread Replies
 * 8. Notification Dispatch & Unread Counts
 * 9. Unfollow Interaction
 * 10. Content Reporting & Admin Moderation Resolution
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class FullUserJourneyE2EIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String obtainAccessToken(String username, String email, String password) throws Exception {
        RegisterRequest register = RegisterRequest.builder()
                .username(username)
                .email(email)
                .fullName("Innovator " + username)
                .password(password)
                .agreeTerms(true)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        LoginRequest login = LoginRequest.builder()
                .emailOrUsername(username)
                .password(password)
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

    @Test
    @DisplayName("E2E Journey: Register -> Login -> Follow -> Post -> Like -> Comment -> Notify -> Unfollow -> Report -> Admin Moderate")
    void testCompleteUserLifecycleJourney() throws Exception {
        String suffix = System.currentTimeMillis() + "_e2e";
        String user1Username = "journey_alex_" + suffix;
        String user1Email = "alex_" + suffix + "@medinex.health";
        String user2Username = "journey_sam_" + suffix;
        String user2Email = "sam_" + suffix + "@medinex.health";

        // Step 1 & 2: User 1 and User 2 Register and Obtain Tokens
        String user1Token = obtainAccessToken(user1Username, user1Email, "Pass123456!");
        String user2Token = obtainAccessToken(user2Username, user2Email, "Pass123456!");
        String adminToken = obtainAdminToken();
        assertNotNull(user1Token);
        assertNotNull(user2Token);
        assertNotNull(adminToken);

        // Step 3: Follow Official MediNex Team
        mockMvc.perform(post("/api/v1/team/follow")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFollowing").value(true));

        // Step 4: User 1 Follows User 2
        mockMvc.perform(post("/api/v1/users/" + user2Username + "/follow")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFollowing").value(true))
                .andExpect(jsonPath("$.data.followerCount").value(1));

        // Step 4b: Prevent Self-Follow
        mockMvc.perform(post("/api/v1/users/" + user1Username + "/follow")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("cannot follow your own profile")));

        // Step 4c: Duplicate Follow Idempotency (Does not create duplicate records)
        mockMvc.perform(post("/api/v1/users/" + user2Username + "/follow")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFollowing").value(true))
                .andExpect(jsonPath("$.data.followerCount").value(1));

        // Step 5: User 1 Publishes a Community Post with Image Attachment
        CreatePostRequest postReq = CreatePostRequest.builder()
                .content("Announcing our E-Health Hackathon 2026 decentralized clinic interoperability architecture.")
                .visibility(PostVisibility.PUBLIC)
                .mediaUrls(List.of("https://images.unsplash.com/photo-1576091160399-112ba8d25d1d"))
                .build();

        MvcResult postResult = mockMvc.perform(post("/api/v1/community/posts")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(postReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", containsString("decentralized clinic")))
                .andExpect(jsonPath("$.data.media", hasSize(1)))
                .andReturn();

        String postId = objectMapper.readTree(postResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Step 6: User 2 Likes the Post
        mockMvc.perform(post("/api/v1/community/posts/" + postId + "/like")
                        .header("Authorization", "Bearer " + user2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isLiked").value(true))
                .andExpect(jsonPath("$.data.likesCount").value(1));

        // Step 6b: Unlike and Re-like Toggling
        mockMvc.perform(post("/api/v1/community/posts/" + postId + "/like")
                        .header("Authorization", "Bearer " + user2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isLiked").value(false))
                .andExpect(jsonPath("$.data.likesCount").value(0));

        mockMvc.perform(post("/api/v1/community/posts/" + postId + "/like")
                        .header("Authorization", "Bearer " + user2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isLiked").value(true))
                .andExpect(jsonPath("$.data.likesCount").value(1));

        // Step 7: User 2 Adds a Comment
        CreateCommentRequest commentReq = CreateCommentRequest.builder()
                .content("Fascinating research! How does the FHIR bridge handle intermittent rural network dropouts?")
                .build();

        MvcResult commentResult = mockMvc.perform(post("/api/v1/community/posts/" + postId + "/comments")
                        .header("Authorization", "Bearer " + user2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(commentReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", containsString("FHIR bridge")))
                .andReturn();

        String commentId = objectMapper.readTree(commentResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Step 7b: User 1 Replies to the Comment
        CreateCommentRequest replyReq = CreateCommentRequest.builder()
                .content("We employ an offline-first transactional queue caching local observations until synchronization.")
                .parentCommentId(UUID.fromString(commentId))
                .build();

        mockMvc.perform(post("/api/v1/community/posts/" + postId + "/comments")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(replyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.parentCommentId").value(commentId));

        // Step 8: User 1 Checks Notifications (Follow, Post Like, Comments)
        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", not(empty())));

        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount", greaterThanOrEqualTo(1)));

        // Step 9: User 1 Unfollows User 2
        mockMvc.perform(delete("/api/v1/users/" + user2Username + "/follow")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFollowing").value(false))
                .andExpect(jsonPath("$.data.followerCount").value(0));

        // Step 10: User 2 Reports User 1's Post for Moderation
        ReportRequest reportReq = ReportRequest.builder()
                .reportedPostId(UUID.fromString(postId))
                .reason("INAPPROPRIATE_CONTENT")
                .details("Please review this post against forum guidelines.")
                .build();

        mockMvc.perform(post("/api/v1/users/" + user1Username + "/report")
                        .header("Authorization", "Bearer " + user2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reportReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Step 11: Admin Inspects and Moderates the Post via Reports Queue
        MvcResult reportsResult = mockMvc.perform(get("/api/v1/admin/reports")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("status", "PENDING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", not(empty())))
                .andReturn();

        String reportId = objectMapper.readTree(reportsResult.getResponse().getContentAsString())
                .path("data").path("content").get(0).path("id").asText();

        AdminReportResolutionRequest resolveReq = AdminReportResolutionRequest.builder()
                .status(ReportStatus.RESOLVED)
                .resolutionNotes("Moderator reviewed and resolved issue.")
                .action("HIDE_POST")
                .build();

        mockMvc.perform(post("/api/v1/admin/reports/" + reportId + "/resolve")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resolveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Post should now be hidden and return 404 from public endpoint
        mockMvc.perform(get("/api/v1/community/posts/" + postId))
                .andExpect(status().isNotFound());
    }
}
