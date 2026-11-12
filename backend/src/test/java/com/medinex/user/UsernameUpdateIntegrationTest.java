package com.medinex.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinex.audit.repository.AuditLogRepository;
import com.medinex.auth.dto.AuthResponse;
import com.medinex.auth.dto.LoginRequest;
import com.medinex.auth.dto.RegisterRequest;
import com.medinex.user.dto.UpdateUsernameRequest;
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
public class UsernameUpdateIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private String registerAndLogin(String username, String email, String password) throws Exception {
        RegisterRequest register = RegisterRequest.builder()
                .username(username)
                .email(email)
                .fullName("Dr. " + username)
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

        MvcResult loginRes = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        AuthResponse auth = objectMapper.readValue(
                objectMapper.readTree(loginRes.getResponse().getContentAsString()).get("data").toString(),
                AuthResponse.class
        );
        return auth.getAccessToken();
    }

    @Test
    public void testUnauthenticatedUsernameUpdateRejectedAndAvailabilityWorks() throws Exception {
        mockMvc.perform(put("/api/v1/users/profile/username")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateUsernameRequest("new_handle_1"))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/users/username-availability")
                        .param("username", "fresh_candidate_99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid").value(true))
                .andExpect(jsonPath("$.data.available").value(true))
                .andExpect(jsonPath("$.data.reason").value("OK"));

        mockMvc.perform(get("/api/v1/users/username-availability")
                        .param("username", "dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid").value(false))
                .andExpect(jsonPath("$.data.available").value(false))
                .andExpect(jsonPath("$.data.reason").value("RESERVED"));

        mockMvc.perform(get("/api/v1/users/username-availability")
                        .param("username", "_bad_handle"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.valid").value(false))
                .andExpect(jsonPath("$.data.available").value(false))
                .andExpect(jsonPath("$.data.reason").value("INVALID_FORMAT"));
    }

    @Test
    public void testAuthenticatedUsernameAvailabilityAndRenameFlow() throws Exception {
        String suffix = String.valueOf(System.nanoTime());
        String oldHandle = "handle_old_" + suffix;
        String newHandle = "Handle_New_" + suffix; // verify mixed-case normalizes lowercase
        String normalizedNew = newHandle.toLowerCase();
        String otherHandle = "handle_other_" + suffix;

        String token = registerAndLogin(oldHandle, oldHandle + "@medinex.local", "Password123!");
        String otherToken = registerAndLogin(otherHandle, otherHandle + "@medinex.local", "Password123!");

        // Own current handle returns current=true
        mockMvc.perform(get("/api/v1/users/username-availability")
                        .header("Authorization", "Bearer " + token)
                        .param("username", oldHandle.toUpperCase()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.available").value(true))
                .andExpect(jsonPath("$.data.current").value(true))
                .andExpect(jsonPath("$.data.reason").value("CURRENT_USERNAME"));

        // Taken handle returns 409 on PUT
        mockMvc.perform(put("/api/v1/users/profile/username")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateUsernameRequest(otherHandle.toUpperCase()))))
                .andExpect(status().isConflict());

        // Same username returns 400
        mockMvc.perform(put("/api/v1/users/profile/username")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateUsernameRequest(oldHandle))))
                .andExpect(status().isBadRequest());

        // Reserved username returns 400
        mockMvc.perform(put("/api/v1/users/profile/username")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateUsernameRequest("settings"))))
                .andExpect(status().isBadRequest());

        // Perform valid username update
        MvcResult updateRes = mockMvc.perform(put("/api/v1/users/profile/username")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateUsernameRequest(newHandle))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value(normalizedNew))
                .andReturn();

        String userId = objectMapper.readTree(updateRes.getResponse().getContentAsString())
                .get("data").get("id").asText();

        // Existing token still authenticates via UUID userId and reflects new username on /auth/me
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value(normalizedNew));

        // New profile route works, old profile route returns 404
        mockMvc.perform(get("/api/v1/users/" + normalizedNew))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value(normalizedNew));

        mockMvc.perform(get("/api/v1/users/" + oldHandle))
                .andExpect(status().isNotFound());

        // Audit log persisted
        assertTrue(
                auditLogRepository.findAll().stream()
                        .anyMatch(a -> "USERNAME_CHANGED".equals(a.getAction()) && userId.equals(a.getTargetId())),
                "Expected USERNAME_CHANGED audit log for user"
        );

        // Login fails with old username and succeeds with new username
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().emailOrUsername(oldHandle).password("Password123!").build()
                        )))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                LoginRequest.builder().emailOrUsername(normalizedNew).password("Password123!").build()
                        )))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.username").value(normalizedNew));

        // Old handle is freed and can be claimed by the other user
        mockMvc.perform(put("/api/v1/users/profile/username")
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateUsernameRequest(oldHandle))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value(oldHandle));
    }

    @Test
    public void testOfficialContributorHandlesAreProtectedFromThirdPartyClaimingAndSwapping() throws Exception {
        String suffix = String.valueOf(System.nanoTime());
        String thirdPartyHandle = "community_user_" + suffix;
        String thirdPartyToken = registerAndLogin(thirdPartyHandle, thirdPartyHandle + "@medinex.local", "Password123!");

        // Availability endpoint must report official unseeded handle as TAKEN for non-owner and guest
        mockMvc.perform(get("/api/v1/users/username-availability")
                        .param("username", "shopnil"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.available").value(false))
                .andExpect(jsonPath("$.data.reason").value("TAKEN"));

        mockMvc.perform(get("/api/v1/users/username-availability")
                        .header("Authorization", "Bearer " + thirdPartyToken)
                        .param("username", "SHOPNIL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.available").value(false))
                .andExpect(jsonPath("$.data.reason").value("TAKEN"));

        // Non-contributor user cannot register or rename to an official contributor handle
        RegisterRequest spoofRegister = RegisterRequest.builder()
                .username("tarek")
                .email("impostor_" + suffix + "@medinex.local")
                .fullName("Impostor User")
                .password("Password123!")
                .agreeTerms(true)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(spoofRegister)))
                .andExpect(status().isConflict());

        mockMvc.perform(put("/api/v1/users/profile/username")
                        .header("Authorization", "Bearer " + thirdPartyToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateUsernameRequest("shopnil"))))
                .andExpect(status().isConflict());

        // Verify original handle was never modified or exchanged
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + thirdPartyToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value(thirdPartyHandle));

        // Reserved platform / admin aliases must also be rejected
        mockMvc.perform(get("/api/v1/users/username-availability")
                        .param("username", "medinex-admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.available").value(false))
                .andExpect(jsonPath("$.data.reason").value("RESERVED"));
    }
}
