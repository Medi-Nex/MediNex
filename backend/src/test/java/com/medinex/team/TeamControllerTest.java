package com.medinex.team;

import com.medinex.team.controller.TeamController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class TeamControllerTest {

    @Autowired
    private MockMvc mockMvc;

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
}
