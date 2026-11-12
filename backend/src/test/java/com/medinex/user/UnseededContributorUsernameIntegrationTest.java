package com.medinex.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinex.auth.dto.AuthResponse;
import com.medinex.auth.dto.LoginRequest;
import com.medinex.auth.dto.RegisterRequest;
import com.medinex.user.dto.UpdateUsernameRequest;
import com.medinex.user.entity.User;
import com.medinex.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Verifies production configuration (demo-users-enabled=false) where contributor rows
 * are not pre-seeded in DB, ensuring official handles remain protected from spoofing
 * while remaining claimable by each contributor's verified email account.
 */
@SpringBootTest(properties = "medinex.seed.demo-users-enabled=false")
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class UnseededContributorUsernameIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    private String registerAndLogin(String username, String email) throws Exception {
        RegisterRequest register = RegisterRequest.builder()
                .username(username)
                .email(email)
                .fullName("Test " + username)
                .password("Password123!")
                .agreeTerms(true)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        MvcResult loginRes = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().emailOrUsername(email).password("Password123!").build()
                        )))
                .andExpect(status().isOk())
                .andReturn();

        AuthResponse auth = objectMapper.readValue(
                objectMapper.readTree(loginRes.getResponse().getContentAsString()).get("data").toString(),
                AuthResponse.class
        );
        return auth.getAccessToken();
    }

    @Test
    public void testUnseededOfficialHandlesBlockedForOthersAndClaimableByVerifiedOwner() throws Exception {
        String otherToken = registerAndLogin("outside_dev_1", "outside_dev_1@medinex.local");

        // Unseeded handle 'shopnil' must look unavailable to guest and other authenticated users
        mockMvc.perform(get("/api/v1/users/username-availability")
                        .param("username", "shopnil"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.available").value(false))
                .andExpect(jsonPath("$.data.reason").value("TAKEN"));

        mockMvc.perform(get("/api/v1/users/username-availability")
                        .header("Authorization", "Bearer " + otherToken)
                        .param("username", "shopnil"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.available").value(false))
                .andExpect(jsonPath("$.data.reason").value("TAKEN"));

        // Non-owner cannot register or rename to 'shopnil'
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(RegisterRequest.builder()
                                .username("shopnil")
                                .email("spoof_shopnil@medinex.local")
                                .fullName("Impostor")
                                .password("Password123!")
                                .agreeTerms(true)
                                .build())))
                .andExpect(status().isConflict());

        mockMvc.perform(put("/api/v1/users/profile/username")
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateUsernameRequest("shopnil"))))
                .andExpect(status().isConflict());

        // Official contributor email checks out for availability during signup
        mockMvc.perform(get("/api/v1/users/username-availability")
                        .param("username", "shopnil")
                        .param("email", "khairulanamshopnil@gmail.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.available").value(true))
                .andExpect(jsonPath("$.data.reason").value("OK"));

        // Owner starts with a temporary handle; unverified account cannot claim official handle via rename
        String shopnilToken = registerAndLogin("shopnil_temp", "khairulanamshopnil@gmail.com");

        mockMvc.perform(put("/api/v1/users/profile/username")
                        .header("Authorization", "Bearer " + shopnilToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateUsernameRequest("shopnil"))))
                .andExpect(status().isConflict());

        // Once email is verified, owner can claim 'shopnil', and no one else can overwrite it
        User owner = userRepository.findByEmailIgnoreCase("khairulanamshopnil@gmail.com").orElseThrow();
        owner.setEmailVerified(true);
        userRepository.save(owner);

        mockMvc.perform(get("/api/v1/users/username-availability")
                        .header("Authorization", "Bearer " + shopnilToken)
                        .param("username", "shopnil"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.available").value(true))
                .andExpect(jsonPath("$.data.reason").value("OK"));

        mockMvc.perform(put("/api/v1/users/profile/username")
                        .header("Authorization", "Bearer " + shopnilToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateUsernameRequest("shopnil"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value("shopnil"));
    }
}
