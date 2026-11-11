package com.medinex.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinex.admin.dto.AdminReportResolutionRequest;
import com.medinex.admin.dto.AdminUserUpdateDto;
import com.medinex.admin.dto.ModerateContentRequest;
import com.medinex.auth.dto.AuthResponse;
import com.medinex.auth.dto.LoginRequest;
import com.medinex.auth.dto.RegisterRequest;
import com.medinex.community.dto.CreateCommentRequest;
import com.medinex.community.dto.CreatePostRequest;
import com.medinex.community.entity.PostVisibility;
import com.medinex.moderation.dto.ReportRequest;
import com.medinex.moderation.entity.ReportStatus;
import com.medinex.user.entity.User;
import com.medinex.user.entity.UserProfile;
import com.medinex.user.repository.UserProfileRepository;
import com.medinex.user.repository.UserRepository;
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
public class PrivacyAndRbacIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    private record UserSession(UUID id, String username, String token) {
    }

    private UserSession registerAndLogin(String username, String password) throws Exception {
        String email = username.toLowerCase() + "@medinex.health";
        RegisterRequest register = RegisterRequest.builder()
                .username(username)
                .email(email)
                .fullName("User " + username)
                .password(password)
                .agreeTerms(true)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        return login(username, password);
    }

    private UserSession login(String emailOrUsername, String password) throws Exception {
        LoginRequest login = LoginRequest.builder()
                .emailOrUsername(emailOrUsername)
                .password(password)
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        AuthResponse auth = objectMapper.readValue(
                objectMapper.readTree(result.getResponse().getContentAsString()).get("data").toString(),
                AuthResponse.class
        );
        return new UserSession(auth.getUser().getId(), auth.getUser().getUsername(), auth.getAccessToken());
    }

    private String loginAdmin() throws Exception {
        return login("admin@medinex.health", "Admin@SecurePass2026!").token();
    }

    @Test
    void shouldEnforcePrivateProfileAndPrivatePostVisibilityConsistently() throws Exception {
        String suffix = System.currentTimeMillis() + "_priv";
        UserSession owner = registerAndLogin("priv_owner_" + suffix, "SecurePass123!");
        UserSession stranger = registerAndLogin("priv_stranger_" + suffix, "SecurePass123!");
        UserSession follower = registerAndLogin("priv_follower_" + suffix, "SecurePass123!");

        // Owner populates sensitive metadata and marks profile private (isPublicVisible = false)
        User ownerEntity = userRepository.findById(owner.id()).orElseThrow();
        UserProfile profile = ownerEntity.getProfile();
        profile.setHeadline("Confidential Clinical Investigator");
        profile.setBio("Proprietary protocol details inside private account.");
        profile.setSkills(List.of("HL7 FHIR", "Oncology Telemetry"));
        profile.setPublicVisible(false);
        userProfileRepository.save(profile);

        // Owner creates one PUBLIC post (profile-scoped since owner is private), one MEMBERS_ONLY, and one PRIVATE post
        MvcResult pubPostRes = mockMvc.perform(post("/api/v1/community/posts")
                        .header("Authorization", "Bearer " + owner.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CreatePostRequest.builder()
                                .content("Private-profile user public update " + suffix)
                                .visibility(PostVisibility.PUBLIC)
                                .build())))
                .andExpect(status().isOk())
                .andReturn();
        String publicPostId = objectMapper.readTree(pubPostRes.getResponse().getContentAsString()).path("data").path("id").asText();

        MvcResult privPostRes = mockMvc.perform(post("/api/v1/community/posts")
                        .header("Authorization", "Bearer " + owner.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CreatePostRequest.builder()
                                .content("Strictly personal draft note " + suffix)
                                .visibility(PostVisibility.PRIVATE)
                                .build())))
                .andExpect(status().isOk())
                .andReturn();
        String privateOnlyPostId = objectMapper.readTree(privPostRes.getResponse().getContentAsString()).path("data").path("id").asText();

        // Owner adds a comment on publicPost
        mockMvc.perform(post("/api/v1/community/posts/" + publicPostId + "/comments")
                        .header("Authorization", "Bearer " + owner.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CreateCommentRequest.builder()
                                .content("Owner note inside private profile post.")
                                .build())))
                .andExpect(status().isOk());

        // 1. Anonymous user blocked (403) across profile, posts, followers, following, post permalink, comments, and feed
        mockMvc.perform(get("/api/v1/users/" + owner.username()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/community/users/" + owner.username() + "/posts"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/users/" + owner.username() + "/followers"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/users/" + owner.username() + "/following"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/community/posts/" + publicPostId))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/community/posts/" + privateOnlyPostId))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/community/posts/" + publicPostId + "/comments"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/community/feed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + publicPostId + "')]", empty()));

        // 2. Non-follower blocked (403), even after sending an UNACCEPTED follow request
        mockMvc.perform(post("/api/v1/users/" + owner.username() + "/follow")
                        .header("Authorization", "Bearer " + follower.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFollowing").value(false))
                .andExpect(jsonPath("$.data.hasPendingRequest").value(true));

        for (String viewerToken : List.of(stranger.token(), follower.token())) {
            mockMvc.perform(get("/api/v1/users/" + owner.username())
                            .header("Authorization", "Bearer " + viewerToken))
                    .andExpect(status().isForbidden());
            mockMvc.perform(get("/api/v1/community/users/" + owner.username() + "/posts")
                            .header("Authorization", "Bearer " + viewerToken))
                    .andExpect(status().isForbidden());
            mockMvc.perform(get("/api/v1/users/" + owner.username() + "/followers")
                            .header("Authorization", "Bearer " + viewerToken))
                    .andExpect(status().isForbidden());
            mockMvc.perform(get("/api/v1/users/" + owner.username() + "/following")
                            .header("Authorization", "Bearer " + viewerToken))
                    .andExpect(status().isForbidden());
            mockMvc.perform(get("/api/v1/community/posts/" + publicPostId)
                            .header("Authorization", "Bearer " + viewerToken))
                    .andExpect(status().isForbidden());
            mockMvc.perform(get("/api/v1/community/feed")
                            .header("Authorization", "Bearer " + viewerToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.content[?(@.id == '" + publicPostId + "')]", empty()));
        }

        // 3. Owner accepts follower's request -> accepted follower gains access to profile & non-PRIVATE posts
        MvcResult requestsRes = mockMvc.perform(get("/api/v1/users/follow-requests")
                        .header("Authorization", "Bearer " + owner.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].requester.email").value(nullValue()))
                .andReturn();
        String reqId = objectMapper.readTree(requestsRes.getResponse().getContentAsString())
                .path("data").path("content").get(0).path("id").asText();

        mockMvc.perform(post("/api/v1/users/follow-requests/" + reqId + "/accept")
                        .header("Authorization", "Bearer " + owner.token()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/users/" + owner.username())
                        .header("Authorization", "Bearer " + follower.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.headline").value("Confidential Clinical Investigator"))
                .andExpect(jsonPath("$.data.isPublicVisible").value(false));

        mockMvc.perform(get("/api/v1/community/users/" + owner.username() + "/posts")
                        .header("Authorization", "Bearer " + follower.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + publicPostId + "')]", not(empty())))
                .andExpect(jsonPath("$.data.content[?(@.id == '" + privateOnlyPostId + "')]", empty()));

        mockMvc.perform(get("/api/v1/users/" + owner.username() + "/followers")
                        .header("Authorization", "Bearer " + follower.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.username == '" + follower.username() + "')]", not(empty())));

        mockMvc.perform(get("/api/v1/users/" + owner.username() + "/following")
                        .header("Authorization", "Bearer " + follower.token()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/community/posts/" + publicPostId)
                        .header("Authorization", "Bearer " + follower.token()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/community/posts/" + publicPostId + "/comments")
                        .header("Authorization", "Bearer " + follower.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)));

        mockMvc.perform(get("/api/v1/community/feed")
                        .header("Authorization", "Bearer " + follower.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + publicPostId + "')]", not(empty())))
                .andExpect(jsonPath("$.data.content[?(@.id == '" + privateOnlyPostId + "')]", empty()));

        // Accepted follower STILL cannot view owner's PostVisibility.PRIVATE post
        mockMvc.perform(get("/api/v1/community/posts/" + privateOnlyPostId)
                        .header("Authorization", "Bearer " + follower.token()))
                .andExpect(status().isForbidden());

        // 4. Profile owner has full access to profile, posts (including PRIVATE), and follow lists
        mockMvc.perform(get("/api/v1/users/" + owner.username())
                        .header("Authorization", "Bearer " + owner.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bio").value("Proprietary protocol details inside private account."));

        mockMvc.perform(get("/api/v1/community/users/" + owner.username() + "/posts")
                        .header("Authorization", "Bearer " + owner.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[?(@.id == '" + publicPostId + "')]", not(empty())))
                .andExpect(jsonPath("$.data.content[?(@.id == '" + privateOnlyPostId + "')]", not(empty())));

        mockMvc.perform(get("/api/v1/community/posts/" + privateOnlyPostId)
                        .header("Authorization", "Bearer " + owner.token()))
                .andExpect(status().isOk());
    }

    @Test
    void shouldResolveMixedCaseUsernamesAcrossProfileCommunityAndFollowServices() throws Exception {
        String suffix = System.currentTimeMillis() + "_mc";
        UserSession target = registerAndLogin("mixed_case_" + suffix, "SecurePass123!");
        UserSession viewer = registerAndLogin("viewer_mc_" + suffix, "SecurePass123!");

        mockMvc.perform(post("/api/v1/community/posts")
                        .header("Authorization", "Bearer " + target.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CreatePostRequest.builder()
                                .content("Mixed case username lookup test post")
                                .visibility(PostVisibility.PUBLIC)
                                .build())))
                .andExpect(status().isOk());

        String mixedUsername = "MiXeD_cAsE_" + suffix.toUpperCase();

        mockMvc.perform(get("/api/v1/users/" + mixedUsername))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value(target.username()));

        mockMvc.perform(get("/api/v1/community/users/" + mixedUsername + "/posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)));

        mockMvc.perform(post("/api/v1/users/" + mixedUsername + "/follow")
                        .header("Authorization", "Bearer " + viewer.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFollowing").value(true));

        mockMvc.perform(get("/api/v1/users/" + mixedUsername + "/follow-stats")
                        .header("Authorization", "Bearer " + viewer.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.followerCount").value(1));

        mockMvc.perform(get("/api/v1/users/" + mixedUsername + "/followers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].username").value(viewer.username()));

        mockMvc.perform(get("/api/v1/users/" + mixedUsername + "/following"))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/users/" + mixedUsername + "/follow")
                        .header("Authorization", "Bearer " + viewer.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFollowing").value(false));
    }

    @Test
    void shouldRestrictSeededContributorsToRoleUserAndPreventPrivilegeEscalation() throws Exception {
        for (int i = 1; i <= 6; i++) {
            User contributor = userRepository.findByUsernameIgnoreCase("contributor-0" + i).orElseThrow();
            List<String> roleNames = contributor.getRoles().stream().map(r -> r.getName()).toList();
            assertEquals(List.of("ROLE_USER"), roleNames, "Contributor must not have admin privileges by default");
        }

        // Contributor account must receive 403 on admin endpoints
        UserSession contrib = login("contributor-01", "Contributor@SecurePass2026!");
        mockMvc.perform(get("/api/v1/admin/stats")
                        .header("Authorization", "Bearer " + contrib.token()))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + contrib.token()))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/v1/team/members/contributor-02")
                        .header("Authorization", "Bearer " + contrib.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"designation\":\"Unauthorized\"}"))
                .andExpect(status().isForbidden());

        // An ordinary ROLE_ADMIN cannot modify a SUPER_ADMIN or assign ROLE_SUPER_ADMIN
        String superAdminToken = loginAdmin();
        String suffix = System.currentTimeMillis() + "_esc";
        UserSession promotedAdmin = registerAndLogin("sub_admin_" + suffix, "SecurePass123!");
        UserSession victim = registerAndLogin("victim_" + suffix, "SecurePass123!");
        User superAdmin = userRepository.findByUsernameIgnoreCase("medinex-admin").orElseThrow();

        mockMvc.perform(put("/api/v1/admin/users/" + promotedAdmin.id())
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(AdminUserUpdateDto.builder()
                                .roles(List.of("ROLE_USER", "ROLE_ADMIN"))
                                .build())))
                .andExpect(status().isOk());

        UserSession adminSession = login(promotedAdmin.username(), "SecurePass123!");

        // Admin cannot modify SUPER_ADMIN account -> 403
        mockMvc.perform(put("/api/v1/admin/users/" + superAdmin.getId())
                        .header("Authorization", "Bearer " + adminSession.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(AdminUserUpdateDto.builder()
                                .roles(List.of("ROLE_USER"))
                                .build())))
                .andExpect(status().isForbidden());

        // Admin cannot escalate victim or self to ROLE_SUPER_ADMIN -> 403
        mockMvc.perform(put("/api/v1/admin/users/" + victim.id())
                        .header("Authorization", "Bearer " + adminSession.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(AdminUserUpdateDto.builder()
                                .roles(List.of("ROLE_USER", "ROLE_SUPER_ADMIN"))
                                .build())))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/v1/admin/users/" + adminSession.id())
                        .header("Authorization", "Bearer " + adminSession.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(AdminUserUpdateDto.builder()
                                .roles(List.of("ROLE_USER", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"))
                                .build())))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldEnforceModeratorAuthorizationAndUnauthorizedResponses() throws Exception {
        // Anonymous /me and /admin must return 401 Unauthorized
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/admin/reports"))
                .andExpect(status().isUnauthorized());

        String superAdminToken = loginAdmin();
        String suffix = System.currentTimeMillis() + "_mod";
        UserSession modCandidate = registerAndLogin("mod_user_" + suffix, "SecurePass123!");
        UserSession author = registerAndLogin("mod_author_" + suffix, "SecurePass123!");
        UserSession reporter = registerAndLogin("mod_rep_" + suffix, "SecurePass123!");

        // Grant ROLE_MODERATOR cleanly via SUPER_ADMIN
        mockMvc.perform(put("/api/v1/admin/users/" + modCandidate.id())
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(AdminUserUpdateDto.builder()
                                .roles(List.of("ROLE_USER", "ROLE_MODERATOR"))
                                .build())))
                .andExpect(status().isOk());

        UserSession moderator = login(modCandidate.username(), "SecurePass123!");

        // Author creates a post & comment; reporter files a report
        MvcResult postRes = mockMvc.perform(post("/api/v1/community/posts")
                        .header("Authorization", "Bearer " + author.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CreatePostRequest.builder()
                                .content("Moderation boundary verification post " + suffix)
                                .visibility(PostVisibility.PUBLIC)
                                .build())))
                .andExpect(status().isOk())
                .andReturn();
        String postId = objectMapper.readTree(postRes.getResponse().getContentAsString()).path("data").path("id").asText();

        MvcResult commentRes = mockMvc.perform(post("/api/v1/community/posts/" + postId + "/comments")
                        .header("Authorization", "Bearer " + author.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CreateCommentRequest.builder()
                                .content("Comment to be reviewed by moderator")
                                .build())))
                .andExpect(status().isOk())
                .andReturn();
        String commentId = objectMapper.readTree(commentRes.getResponse().getContentAsString()).path("data").path("id").asText();

        mockMvc.perform(post("/api/v1/users/" + author.username() + "/report")
                        .header("Authorization", "Bearer " + reporter.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ReportRequest.builder()
                                .reportedPostId(UUID.fromString(postId))
                                .reason("SPAM_OR_MISLEADING")
                                .details("Flagged for moderator queue")
                                .build())))
                .andExpect(status().isOk());

        // Moderator CAN access moderation endpoints
        MvcResult reportsRes = mockMvc.perform(get("/api/v1/admin/reports")
                        .header("Authorization", "Bearer " + moderator.token())
                        .param("status", "PENDING"))
                .andExpect(status().isOk())
                .andReturn();
        String reportId = objectMapper.readTree(reportsRes.getResponse().getContentAsString())
                .path("data").path("content").get(0).path("id").asText();

        mockMvc.perform(get("/api/v1/admin/posts")
                        .header("Authorization", "Bearer " + moderator.token()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/comments")
                        .header("Authorization", "Bearer " + moderator.token()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/media")
                        .header("Authorization", "Bearer " + moderator.token()))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/v1/admin/comments/" + commentId + "/moderate")
                        .header("Authorization", "Bearer " + moderator.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ModerateContentRequest.builder()
                                .isHidden(true)
                                .reason("Moderated comment")
                                .build())))
                .andExpect(status().isOk());

        // Moderator CANNOT trigger SUSPEND_USER via report resolution -> 403
        mockMvc.perform(post("/api/v1/admin/reports/" + reportId + "/resolve")
                        .header("Authorization", "Bearer " + moderator.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(AdminReportResolutionRequest.builder()
                                .status(ReportStatus.RESOLVED)
                                .action("SUSPEND_USER")
                                .resolutionNotes("Should fail")
                                .build())))
                .andExpect(status().isForbidden());

        // Moderator CAN resolve with HIDE_POST
        mockMvc.perform(post("/api/v1/admin/reports/" + reportId + "/resolve")
                        .header("Authorization", "Bearer " + moderator.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(AdminReportResolutionRequest.builder()
                                .status(ReportStatus.RESOLVED)
                                .action("HIDE_POST")
                                .resolutionNotes("Hidden by moderator")
                                .build())))
                .andExpect(status().isOk());

        // Moderator MUST receive 403 Forbidden on admin-only endpoints
        for (String adminOnlyPath : List.of(
                "/api/v1/admin/stats",
                "/api/v1/admin/users",
                "/api/v1/admin/audit-logs",
                "/api/v1/admin/analytics",
                "/api/v1/admin/settings",
                "/api/v1/admin/team"
        )) {
            mockMvc.perform(get(adminOnlyPath)
                            .header("Authorization", "Bearer " + moderator.token()))
                    .andExpect(status().isForbidden());
        }

        mockMvc.perform(put("/api/v1/admin/users/" + author.id())
                        .header("Authorization", "Bearer " + moderator.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(AdminUserUpdateDto.builder()
                                .roles(List.of("ROLE_ADMIN"))
                                .build())))
                .andExpect(status().isForbidden());
    }
}
