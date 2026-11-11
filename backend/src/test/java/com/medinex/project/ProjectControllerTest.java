package com.medinex.project;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinex.auth.dto.AuthResponse;
import com.medinex.auth.dto.LoginRequest;
import com.medinex.auth.dto.RegisterRequest;
import com.medinex.project.dto.ProjectDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String loginAs(String emailOrUsername, String password) throws Exception {
        LoginRequest login = LoginRequest.builder()
                .emailOrUsername(emailOrUsername)
                .password(password)
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        AuthResponse authResponse = objectMapper.readValue(
                objectMapper.readTree(result.getResponse().getContentAsString()).get("data").toString(),
                AuthResponse.class
        );
        return authResponse.getAccessToken();
    }

    private String registerAndLoginRegularUser(String username) throws Exception {
        RegisterRequest register = RegisterRequest.builder()
                .username(username)
                .email(username + "@example.com")
                .fullName("Project Auth Tester")
                .password("Password123!")
                .agreeTerms(true)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        return loginAs(username, "Password123!");
    }

    @Test
    void shouldReturnShasthoSetuDetails() throws Exception {
        mockMvc.perform(get("/api/v1/projects/shasthosetu")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.slug", is("shasthosetu")))
                .andExpect(jsonPath("$.data.stage", is("DEVELOPMENT")))
                .andExpect(jsonPath("$.data.assignedMembers", hasSize(6)));
    }

    @Test
    void shouldRejectAnonymousProjectMutationWith401() throws Exception {
        ProjectDto updatePayload = ProjectDto.builder()
                .title("Tampered Title")
                .build();

        mockMvc.perform(put("/api/v1/projects/shasthosetu")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatePayload)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void shouldRejectOrdinaryUserProjectMutationWith403() throws Exception {
        String userToken = registerAndLoginRegularUser("proj_user_" + System.currentTimeMillis());

        ProjectDto updatePayload = ProjectDto.builder()
                .title("Unauthorized Update")
                .build();

        mockMvc.perform(put("/api/v1/projects/shasthosetu")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatePayload)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void shouldAllowAdminToUpdateProject() throws Exception {
        String adminToken = loginAs("admin@medinex.health", "Admin@SecurePass2026!");

        // Fetch existing project state so we can restore it cleanly
        MvcResult getRes = mockMvc.perform(get("/api/v1/projects/shasthosetu"))
                .andExpect(status().isOk())
                .andReturn();
        ProjectDto original = objectMapper.readValue(
                objectMapper.readTree(getRes.getResponse().getContentAsString()).get("data").toString(),
                ProjectDto.class
        );

        ProjectDto updatePayload = ProjectDto.builder()
                .shortSummary("Updated verified project summary by admin.")
                .build();

        mockMvc.perform(put("/api/v1/projects/shasthosetu")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatePayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.shortSummary", is("Updated verified project summary by admin.")));

        // Restore original summary
        ProjectDto restorePayload = ProjectDto.builder()
                .shortSummary(original.getShortSummary())
                .build();

        mockMvc.perform(put("/api/v1/projects/shasthosetu")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(restorePayload)))
                .andExpect(status().isOk());
    }
}
