package com.medinex.team;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinex.auth.dto.AuthResponse;
import com.medinex.auth.dto.LoginRequest;
import com.medinex.auth.dto.RegisterRequest;
import com.medinex.team.dto.TeamMemberDto;
import com.medinex.team.entity.TeamMember;
import com.medinex.team.repository.TeamMemberRepository;
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
public class TeamControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TeamMemberRepository teamMemberRepository;

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
                .fullName("Team Auth Tester")
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
    void shouldReturnSixContributors() throws Exception {
        mockMvc.perform(get("/api/v1/team/members")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(6)))
                .andExpect(jsonPath("$.data[0].username", is("contributor-01")))
                .andExpect(jsonPath("$.data[0].isPlaceholder", is(true)))
                .andExpect(jsonPath("$.data[5].username", is("contributor-06")));
    }

    @Test
    void shouldReturnIndividualContributor() throws Exception {
        mockMvc.perform(get("/api/v1/team/members/contributor-01")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.username", is("contributor-01")))
                .andExpect(jsonPath("$.data.isLead", is(true)));
    }

    @Test
    void shouldReturn404ForNonexistentContributor() throws Exception {
        mockMvc.perform(get("/api/v1/team/members/nonexistent-user")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void shouldRejectAnonymousContributorUpdateWith401() throws Exception {
        TeamMemberDto updatePayload = TeamMemberDto.builder()
                .designation("Tampered Designation")
                .build();

        mockMvc.perform(put("/api/v1/team/members/contributor-01")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatePayload)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void shouldRejectOrdinaryUserContributorIdorWith403() throws Exception {
        String userToken = registerAndLoginRegularUser("team_idor_user_" + System.currentTimeMillis());

        TeamMemberDto updatePayload = TeamMemberDto.builder()
                .designation("Unauthorized Hijack")
                .bio("Attempted IDOR overwrite")
                .build();

        mockMvc.perform(put("/api/v1/team/members/contributor-01")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatePayload)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void shouldAllowAdminToUpdateContributorProfile() throws Exception {
        String adminToken = loginAs("admin@medinex.health", "Admin@SecurePass2026!");

        TeamMember original = teamMemberRepository.findByUserUsernameIgnoreCase("contributor-06")
                .orElseThrow();
        String originalDesignation = original.getOfficialDesignation();

        TeamMemberDto updatePayload = TeamMemberDto.builder()
                .designation("Lead DevSecOps & Cloud Architect")
                .build();

        mockMvc.perform(put("/api/v1/team/members/contributor-06")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatePayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.designation", is("Lead DevSecOps & Cloud Architect")));

        // Restore pristine seed state
        TeamMember modified = teamMemberRepository.findByUserUsernameIgnoreCase("contributor-06")
                .orElseThrow();
        modified.setOfficialDesignation(originalDesignation);
        modified.setPlaceholder(true);
        teamMemberRepository.save(modified);
    }
}
