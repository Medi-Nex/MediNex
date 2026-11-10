package com.medinex.community;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinex.auth.dto.AuthResponse;
import com.medinex.auth.dto.LoginRequest;
import com.medinex.auth.dto.RegisterRequest;
import com.medinex.community.dto.CreateCommentRequest;
import com.medinex.community.dto.CreatePostRequest;
import com.medinex.community.dto.UpdatePostRequest;
import com.medinex.community.entity.PostVisibility;
import com.medinex.community.repository.CommentRepository;
import com.medinex.community.repository.PostLikeRepository;
import com.medinex.community.repository.PostRepository;
import com.medinex.notification.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class CommunityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private PostLikeRepository postLikeRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private String obtainAccessToken(String username, String email, String password) throws Exception {
        RegisterRequest register = RegisterRequest.builder()
                .username(username)
                .email(email)
                .fullName("User " + username)
                .password(password)
                .agreeTerms(true)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(register)));

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

    @Test
    void shouldCreateAndRetrievePostInFeed() throws Exception {
        String suffix = System.currentTimeMillis() + "_p1";
        String token = obtainAccessToken("poster_" + suffix, "poster_" + suffix + "@medinex.health", "Pass123456!");

        CreatePostRequest postReq = CreatePostRequest.builder()
                .content("Announcing innovative research on grassroots clinic connectivity for E-Health 2026.")
                .visibility(PostVisibility.PUBLIC)
                .mediaUrls(List.of("https://example.org/images/demo.png"))
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/v1/community/posts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(postReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", containsString("Announcing innovative research")))
                .andExpect(jsonPath("$.data.media", hasSize(1)))
                .andExpect(jsonPath("$.data.isOwner").value(true))
                .andReturn();

        String postId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("data").get("id").asText();

        // Check public feed (anonymous access)
        mockMvc.perform(get("/api/v1/community/feed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", not(empty())))
                .andExpect(jsonPath("$.data.content[?(@.id == '" + postId + "')].authorUsername").value("poster_" + suffix));
    }

    @Test
    void shouldTogglePostLikeAndNotifyAuthor() throws Exception {
        String suffix = System.currentTimeMillis() + "_like";
        String tokenAuthor = obtainAccessToken("auth_" + suffix, "auth_" + suffix + "@medinex.health", "Pass123456!");
        String tokenLiker = obtainAccessToken("liker_" + suffix, "liker_" + suffix + "@medinex.health", "Pass123456!");

        CreatePostRequest postReq = CreatePostRequest.builder()
                .content("Evaluating HL7 FHIR standards for the ShasthoSetu protocol.")
                .visibility(PostVisibility.PUBLIC)
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/v1/community/posts")
                        .header("Authorization", "Bearer " + tokenAuthor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(postReq)))
                .andExpect(status().isOk())
                .andReturn();

        String postId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("data").get("id").asText();

        // 1. User likes the post
        mockMvc.perform(post("/api/v1/community/posts/" + postId + "/like")
                        .header("Authorization", "Bearer " + tokenLiker))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isLiked").value(true))
                .andExpect(jsonPath("$.data.likesCount").value(1));

        // 2. Author receives POST_LIKE notification
        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", "Bearer " + tokenAuthor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].type").value("POST_LIKE"))
                .andExpect(jsonPath("$.data.content[0].actorUsername").value("liker_" + suffix));

        // 3. User unlikes the post
        mockMvc.perform(post("/api/v1/community/posts/" + postId + "/like")
                        .header("Authorization", "Bearer " + tokenLiker))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isLiked").value(false))
                .andExpect(jsonPath("$.data.likesCount").value(0));
    }

    @Test
    void shouldAddCommentAndReplyToPost() throws Exception {
        String suffix = System.currentTimeMillis() + "_comm";
        String tokenAuthor = obtainAccessToken("cauth_" + suffix, "cauth_" + suffix + "@medinex.health", "Pass123456!");
        String tokenCommenter = obtainAccessToken("commenter_" + suffix, "comm_" + suffix + "@medinex.health", "Pass123456!");

        CreatePostRequest postReq = CreatePostRequest.builder()
                .content("Looking for healthcare clinical feedback on our rural triage system.")
                .visibility(PostVisibility.PUBLIC)
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/v1/community/posts")
                        .header("Authorization", "Bearer " + tokenAuthor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(postReq)))
                .andExpect(status().isOk())
                .andReturn();

        String postId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("data").get("id").asText();

        // 1. Commenter adds a top-level comment
        CreateCommentRequest commentReq = CreateCommentRequest.builder()
                .content("We tested low-bandwidth audio triage last week with positive findings.")
                .build();

        MvcResult commentResult = mockMvc.perform(post("/api/v1/community/posts/" + postId + "/comments")
                        .header("Authorization", "Bearer " + tokenCommenter)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(commentReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", containsString("low-bandwidth audio triage")))
                .andReturn();

        String parentCommentId = objectMapper.readTree(commentResult.getResponse().getContentAsString())
                .get("data").get("id").asText();

        // 2. Author replies to comment
        CreateCommentRequest replyReq = CreateCommentRequest.builder()
                .content("Thank you! Could you share the latency figures you observed?")
                .parentCommentId(java.util.UUID.fromString(parentCommentId))
                .build();

        mockMvc.perform(post("/api/v1/community/posts/" + postId + "/comments")
                        .header("Authorization", "Bearer " + tokenAuthor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(replyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.parentCommentId").value(parentCommentId));

        // 3. Commenter receives COMMENT_REPLY notification
        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", "Bearer " + tokenCommenter))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].type").value("COMMENT_REPLY"));
    }

    @Test
    void shouldSoftDeletePostByAuthor() throws Exception {
        String suffix = System.currentTimeMillis() + "_del";
        String token = obtainAccessToken("del_user_" + suffix, "del_" + suffix + "@medinex.health", "Pass123456!");

        CreatePostRequest postReq = CreatePostRequest.builder()
                .content("Temporary announcement to be removed.")
                .visibility(PostVisibility.PUBLIC)
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/v1/community/posts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(postReq)))
                .andExpect(status().isOk())
                .andReturn();

        String postId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("data").get("id").asText();

        // Delete post
        mockMvc.perform(delete("/api/v1/community/posts/" + postId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Verify post no longer returned by ID
        mockMvc.perform(get("/api/v1/community/posts/" + postId))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldPreventUnauthorizedPostUpdate() throws Exception {
        String suffix = System.currentTimeMillis() + "_unauth";
        String tokenOwner = obtainAccessToken("owner_" + suffix, "owner_" + suffix + "@medinex.health", "Pass123456!");
        String tokenAttacker = obtainAccessToken("attacker_" + suffix, "att_" + suffix + "@medinex.health", "Pass123456!");

        CreatePostRequest postReq = CreatePostRequest.builder()
                .content("Original legitimate content.")
                .visibility(PostVisibility.PUBLIC)
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/v1/community/posts")
                        .header("Authorization", "Bearer " + tokenOwner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(postReq)))
                .andExpect(status().isOk())
                .andReturn();

        String postId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("data").get("id").asText();

        UpdatePostRequest updateReq = UpdatePostRequest.builder()
                .content("Compromised malicious content.")
                .build();

        mockMvc.perform(put("/api/v1/community/posts/" + postId)
                        .header("Authorization", "Bearer " + tokenAttacker)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Unauthorized to modify")));
    }
}
