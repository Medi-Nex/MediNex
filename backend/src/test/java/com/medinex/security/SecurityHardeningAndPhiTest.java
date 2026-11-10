package com.medinex.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinex.auth.dto.AuthResponse;
import com.medinex.auth.dto.LoginRequest;
import com.medinex.auth.dto.RegisterRequest;
import com.medinex.common.exception.BadRequestException;
import com.medinex.common.security.PhiGuardService;
import com.medinex.community.dto.CreateCommentRequest;
import com.medinex.community.dto.CreatePostRequest;
import com.medinex.community.entity.PostVisibility;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SecurityHardeningAndPhiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PhiGuardService phiGuardService;

    private String obtainAccessToken(String username, String email) throws Exception {
        RegisterRequest register = RegisterRequest.builder()
                .username(username)
                .email(email)
                .fullName("Security Tester")
                .password("SecTest123!@#")
                .agreeTerms(true)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)));

        LoginRequest login = LoginRequest.builder()
                .emailOrUsername(username)
                .password("SecTest123!@#")
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
    @DisplayName("Zero-PHI Unit: Detects clinical patient identifiers and medical record numbers")
    void testPhiGuardDetectsViolations() {
        // Medical Record Numbers
        assertTrue(phiGuardService.containsPhi("Patient record MRN: 98472-A shows stable vitals."));
        assertTrue(phiGuardService.containsPhi("Hospital ID: H-88291 assigned in triage."));
        assertTrue(phiGuardService.containsPhi("Clinic ID# 20491 patient admitted."));

        // Clinical Prescriptions
        assertTrue(phiGuardService.containsPhi("Rx: Amoxicillin 500 mg tablets bid for 7 days"));

        // Diagnostic / Clinical admission headers
        assertTrue(phiGuardService.containsPhi("Chief Complaint: persistent dyspnea and tachycardia"));
        assertTrue(phiGuardService.containsPhi("Discharge Summary: patient recovered post laparoscopic appendectomy"));
        assertTrue(phiGuardService.containsPhi("Diagnostic Impression: acute bacterial pneumonia"));

        // Demographic pairings
        assertTrue(phiGuardService.containsPhi("Patient Name: John Doe with suspected malaria"));
        assertTrue(phiGuardService.containsPhi("Emergency case: Patient DOB: 14/05/1982"));

        // Throws BadRequestException on validation
        assertThrows(BadRequestException.class, () ->
                phiGuardService.validateContent("Please review MRN: 48291-K immediately.")
        );
    }

    @Test
    @DisplayName("Zero-PHI Unit: Allows legitimate health technology and community research discussions")
    void testPhiGuardPermitsLegitimateHealthTechDiscussions() {
        assertFalse(phiGuardService.containsPhi("Building a Fast Healthcare Interoperability Resources (FHIR) data pipeline."));
        assertFalse(phiGuardService.containsPhi("Our E-Health Hackathon 2026 solution integrates OpenMRS and HL7 standards."));
        assertFalse(phiGuardService.containsPhi("Telemedicine architecture requires end-to-end WebRTC encryption and strict zero-trust networks."));
        assertFalse(phiGuardService.containsPhi("Discussing rural community healthcare worker workflows and mobile usability."));

        // Validation should pass smoothly without exceptions
        assertDoesNotThrow(() ->
                phiGuardService.validateContent("MediNex fosters collaborative healthcare innovation without storing any patient records.")
        );
    }

    @Test
    @DisplayName("Zero-PHI API: Rejects community post containing Protected Health Information with 400 Bad Request")
    void testPostSubmissionRejectsPhi() throws Exception {
        String suffix = System.currentTimeMillis() + "_p";
        String token = obtainAccessToken("sec_phi_" + suffix, "sec_phi_" + suffix + "@example.com");

        CreatePostRequest phiPost = CreatePostRequest.builder()
                .content("Found this case file: Patient Name: Rahat Karim, MRN: BD-77491-X with fever.")
                .visibility(PostVisibility.PUBLIC)
                .build();

        mockMvc.perform(post("/api/v1/community/posts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(phiPost)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Zero-PHI Policy Violation")));
    }

    @Test
    @DisplayName("Zero-PHI API: Rejects community comment containing Protected Health Information with 400 Bad Request")
    void testCommentSubmissionRejectsPhi() throws Exception {
        String suffix = System.currentTimeMillis() + "_c";
        String token = obtainAccessToken("sec_comm_" + suffix, "sec_comm_" + suffix + "@example.com");

        // First create a clean valid post
        CreatePostRequest cleanPost = CreatePostRequest.builder()
                .content("Discussion on electronic health record interoperability across clinics.")
                .visibility(PostVisibility.PUBLIC)
                .build();

        MvcResult postResult = mockMvc.perform(post("/api/v1/community/posts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cleanPost)))
                .andExpect(status().isOk())
                .andReturn();

        String postId = objectMapper.readTree(postResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Attempt to comment with PHI
        CreateCommentRequest phiComment = CreateCommentRequest.builder()
                .content("In our clinic we saw Chief Complaint: acute respiratory distress syndrome with high fever")
                .build();

        mockMvc.perform(post("/api/v1/community/posts/" + postId + "/comments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(phiComment)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Zero-PHI Policy Violation")));
    }

    @Test
    @DisplayName("Security Headers: Verifies X-Content-Type-Options, X-Frame-Options DENY, and XSS Protection")
    void testSecurityHeadersPresent() throws Exception {
        mockMvc.perform(get("/api/v1/public/health"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().exists("X-XSS-Protection"));
    }
}
