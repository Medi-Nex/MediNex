package com.medinex.follow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinex.auth.dto.AuthResponse;
import com.medinex.auth.dto.LoginRequest;
import com.medinex.auth.dto.RegisterRequest;
import com.medinex.follow.repository.BlockRepository;
import com.medinex.follow.repository.FollowRequestRepository;
import com.medinex.follow.repository.TeamFollowRepository;
import com.medinex.follow.repository.UserFollowRepository;
import com.medinex.notification.repository.NotificationRepository;
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

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class FollowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private UserFollowRepository userFollowRepository;

    @Autowired
    private TeamFollowRepository teamFollowRepository;

    @Autowired
    private FollowRequestRepository followRequestRepository;

    @Autowired
    private BlockRepository blockRepository;

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
    void shouldFollowAndUnfollowOfficialTeam() throws Exception {
        String suffix = System.currentTimeMillis() + "_tf";
        String token = obtainAccessToken("tf_user_" + suffix, "tf_" + suffix + "@medinex.health", "Pass123456!");

        // 1. Initial team stats
        mockMvc.perform(get("/api/v1/team/follow-stats")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFollowing").value(false));

        // 2. Follow official team
        mockMvc.perform(post("/api/v1/team/follow")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFollowing").value(true))
                .andExpect(jsonPath("$.data.followerCount", greaterThanOrEqualTo(1)));

        // 3. Verify in team stats
        mockMvc.perform(get("/api/v1/team/follow-stats")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFollowing").value(true));

        // 4. Unfollow official team
        mockMvc.perform(delete("/api/v1/team/follow")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFollowing").value(false));
    }

    @Test
    void shouldFollowAndUnfollowPublicUser() throws Exception {
        String suffix = System.currentTimeMillis() + "_uf";
        String tokenA = obtainAccessToken("alice_" + suffix, "alice_" + suffix + "@medinex.health", "Pass123456!");
        String tokenB = obtainAccessToken("bob_" + suffix, "bob_" + suffix + "@medinex.health", "Pass123456!");

        String targetUsername = "bob_" + suffix;

        // 1. Initial stats: Alice not following Bob
        mockMvc.perform(get("/api/v1/users/" + targetUsername + "/follow-stats")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.followerCount").value(0))
                .andExpect(jsonPath("$.data.isFollowing").value(false));

        // 2. Alice follows Bob
        mockMvc.perform(post("/api/v1/users/" + targetUsername + "/follow")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFollowing").value(true))
                .andExpect(jsonPath("$.data.followerCount").value(1));

        // 3. Bob receives NEW_FOLLOWER notification
        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].type").value("NEW_FOLLOWER"))
                .andExpect(jsonPath("$.data.content[0].actorUsername").value("alice_" + suffix));

        // 4. Check Bob's followers endpoint
        mockMvc.perform(get("/api/v1/users/" + targetUsername + "/followers")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].username").value("alice_" + suffix));

        // 5. Alice unfollows Bob
        mockMvc.perform(delete("/api/v1/users/" + targetUsername + "/follow")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFollowing").value(false))
                .andExpect(jsonPath("$.data.followerCount").value(0));
    }

    @Test
    void shouldRejectSelfFollow() throws Exception {
        String suffix = System.currentTimeMillis() + "_sf";
        String token = obtainAccessToken("self_" + suffix, "self_" + suffix + "@medinex.health", "Pass123456!");

        mockMvc.perform(post("/api/v1/users/self_" + suffix + "/follow")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("cannot follow your own profile")));
    }

    @Test
    void shouldHandlePrivateAccountFollowRequest() throws Exception {
        String suffix = System.currentTimeMillis() + "_pr";
        String tokenRequester = obtainAccessToken("req_" + suffix, "req_" + suffix + "@medinex.health", "Pass123456!");
        String tokenTarget = obtainAccessToken("private_" + suffix, "private_" + suffix + "@medinex.health", "Pass123456!");

        // Make target private
        User targetUser = userRepository.findByUsername("private_" + suffix).orElseThrow();
        UserProfile profile = targetUser.getProfile();
        profile.setPublicVisible(false);
        userProfileRepository.save(profile);

        // 1. Requester attempts to follow private target -> creates follow request
        mockMvc.perform(post("/api/v1/users/private_" + suffix + "/follow")
                        .header("Authorization", "Bearer " + tokenRequester))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFollowing").value(false))
                .andExpect(jsonPath("$.data.hasPendingRequest").value(true));

        // 2. Target checks pending follow requests
        MvcResult requestsResult = mockMvc.perform(get("/api/v1/users/follow-requests")
                        .header("Authorization", "Bearer " + tokenTarget))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].requester.username").value("req_" + suffix))
                .andReturn();

        String requestId = objectMapper.readTree(requestsResult.getResponse().getContentAsString())
                .get("data").get("content").get(0).get("id").asText();

        // 3. Target accepts follow request
        mockMvc.perform(post("/api/v1/users/follow-requests/" + requestId + "/accept")
                        .header("Authorization", "Bearer " + tokenTarget))
                .andExpect(status().isOk());

        // 4. Now Requester is officially following target
        mockMvc.perform(get("/api/v1/users/private_" + suffix + "/follow-stats")
                        .header("Authorization", "Bearer " + tokenRequester))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFollowing").value(true))
                .andExpect(jsonPath("$.data.hasPendingRequest").value(false));
    }

    @Test
    void shouldSeverFollowsAndPreventInteractionsOnBlock() throws Exception {
        String suffix = System.currentTimeMillis() + "_bl";
        String tokenA = obtainAccessToken("user_a_" + suffix, "user_a_" + suffix + "@medinex.health", "Pass123456!");
        String tokenB = obtainAccessToken("user_b_" + suffix, "user_b_" + suffix + "@medinex.health", "Pass123456!");

        // Alice follows Bob
        mockMvc.perform(post("/api/v1/users/user_b_" + suffix + "/follow")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFollowing").value(true));

        // Bob blocks Alice
        mockMvc.perform(post("/api/v1/users/user_a_" + suffix + "/block")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk());

        // Verify follow relationship is severed
        mockMvc.perform(get("/api/v1/users/user_b_" + suffix + "/follow-stats")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isFollowing").value(false))
                .andExpect(jsonPath("$.data.isBlocked").value(true));

        // Alice attempts to follow Bob while blocked -> 400 Bad Request
        mockMvc.perform(post("/api/v1/users/user_b_" + suffix + "/follow")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("active block")));
    }
}
