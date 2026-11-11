package com.medinex.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinex.auth.dto.AuthResponse;
import com.medinex.auth.dto.LoginRequest;
import com.medinex.auth.dto.RegisterRequest;
import com.medinex.community.dto.CreateCommentRequest;
import com.medinex.community.dto.CreatePostRequest;
import com.medinex.community.entity.PostVisibility;
import com.medinex.user.dto.UpdateProfileRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AvatarUploadIntegrationTest {

    @TempDir
    static Path tempUploadDir;

    @DynamicPropertySource
    static void registerUploadDir(DynamicPropertyRegistry registry) {
        registry.add("medinex.storage.upload-dir", () -> tempUploadDir.toAbsolutePath().toString());
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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

        AuthResponse authResponse = objectMapper.readValue(
                objectMapper.readTree(loginRes.getResponse().getContentAsString()).get("data").toString(),
                AuthResponse.class
        );
        return authResponse.getAccessToken();
    }

    private byte[] createSamplePng(int width, int height) throws Exception {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = img.createGraphics();
        g2d.setColor(new Color(13, 148, 136, 200));
        g2d.fillRect(0, 0, width, height);
        g2d.setColor(Color.WHITE);
        g2d.fillOval(width / 4, height / 4, width / 2, height / 2);
        g2d.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        return baos.toByteArray();
    }

    @Test
    void testUnauthenticatedAvatarUploadIsRejected() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.png",
                MediaType.IMAGE_PNG_VALUE,
                createSamplePng(128, 128)
        );

        mockMvc.perform(multipart("/api/v1/users/profile/avatar").file(file))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testInvalidImageAndTinyImageAreRejected() throws Exception {
        String token = registerAndLogin("avatar_bad_img", "avatarbad@medinex.local", "Password123!");

        MockMultipartFile spoofedFile = new MockMultipartFile(
                "file",
                "evil.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                "not a real jpeg".getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/v1/users/profile/avatar")
                        .file(spoofedFile)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());

        MockMultipartFile tinyFile = new MockMultipartFile(
                "file",
                "tiny.png",
                MediaType.IMAGE_PNG_VALUE,
                createSamplePng(8, 8)
        );

        mockMvc.perform(multipart("/api/v1/users/profile/avatar")
                        .file(tinyFile)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testMultiResolutionAvatarUploadPublicProfilePostsCommentsAndDelete() throws Exception {
        String username = "avatar_innovator";
        String token = registerAndLogin(username, "avataruser@medinex.local", "Password123!");

        // Update profile fields too
        UpdateProfileRequest updateReq = UpdateProfileRequest.builder()
                .headline("Clinical AI Researcher")
                .designation("Biomedical Data Scientist")
                .department("Health Informatics")
                .university("MediNex Research Lab")
                .bio("Working on multilingual triage pipelines.")
                .skills(List.of("Java", "Next.js", "Medical NLP"))
                .build();

        mockMvc.perform(put("/api/v1/users/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.headline").value("Clinical AI Researcher"))
                .andExpect(jsonPath("$.data.skills", hasItem("Medical NLP")));

        // Upload 800x600 PNG -> expects 64x64 (sm), 256x256 (md), 512x512 (lg) JPEGs
        MockMultipartFile avatarFile = new MockMultipartFile(
                "file",
                "profile-photo.png",
                MediaType.IMAGE_PNG_VALUE,
                createSamplePng(800, 600)
        );

        MvcResult uploadRes = mockMvc.perform(multipart("/api/v1/users/profile/avatar")
                        .file(avatarFile)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avatarUrl", endsWith("-md.jpg")))
                .andExpect(jsonPath("$.data.avatarSmUrl", endsWith("-sm.jpg")))
                .andExpect(jsonPath("$.data.avatarLgUrl", endsWith("-lg.jpg")))
                .andReturn();

        JsonNode dataNode = objectMapper.readTree(uploadRes.getResponse().getContentAsString()).get("data");
        String userId = dataNode.get("id").asText();
        String smUrl = dataNode.get("avatarSmUrl").asText();
        String mdUrl = dataNode.get("avatarUrl").asText();
        String lgUrl = dataNode.get("avatarLgUrl").asText();

        // Verify physical resolution of all 3 generated variants via static GET /uploads/**
        assertImageVariantResolution(smUrl, 64, 64);
        assertImageVariantResolution(mdUrl, 256, 256);
        assertImageVariantResolution(lgUrl, 512, 512);

        // Public user endpoint exposes profile & multi-res avatars WITHOUT leaking private email
        mockMvc.perform(get("/api/v1/users/" + username))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value(username))
                .andExpect(jsonPath("$.data.email").value(nullValue()))
                .andExpect(jsonPath("$.data.headline").value("Clinical AI Researcher"))
                .andExpect(jsonPath("$.data.avatarUrl").value(mdUrl))
                .andExpect(jsonPath("$.data.avatarSmUrl").value(smUrl))
                .andExpect(jsonPath("$.data.avatarLgUrl").value(lgUrl));

        // Create a post and comment to verify multi-res avatar propagation across community DTOs
        CreatePostRequest postReq = CreatePostRequest.builder()
                .content("Sharing multi-resolution avatar verification post.")
                .visibility(PostVisibility.PUBLIC)
                .build();

        MvcResult postRes = mockMvc.perform(post("/api/v1/community/posts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(postReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.authorAvatarUrl").value(mdUrl))
                .andExpect(jsonPath("$.data.authorAvatarSmUrl").value(smUrl))
                .andExpect(jsonPath("$.data.authorAvatarLgUrl").value(lgUrl))
                .andReturn();

        String postId = objectMapper.readTree(postRes.getResponse().getContentAsString())
                .get("data").get("id").asText();

        CreateCommentRequest commentReq = CreateCommentRequest.builder()
                .content("Comment should also carry small 64px avatar thumbnail.")
                .build();

        mockMvc.perform(post("/api/v1/community/posts/" + postId + "/comments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(commentReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.authorAvatarUrl").value(mdUrl))
                .andExpect(jsonPath("$.data.authorAvatarSmUrl").value(smUrl))
                .andExpect(jsonPath("$.data.authorAvatarLgUrl").value(lgUrl));

        // Remove avatar deletes files & nulls URLs
        mockMvc.perform(delete("/api/v1/users/profile/avatar")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.avatarUrl").value(nullValue()))
                .andExpect(jsonPath("$.data.avatarSmUrl").value(nullValue()))
                .andExpect(jsonPath("$.data.avatarLgUrl").value(nullValue()));

        Path userAvatarDir = tempUploadDir.resolve("avatars").resolve(userId);
        assertTrue(Files.list(userAvatarDir).findAny().isEmpty(), "Expected old avatar files to be cleaned up");
    }

    private void assertImageVariantResolution(String publicUrl, int expectedW, int expectedH) throws Exception {
        MvcResult result = mockMvc.perform(get(publicUrl))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("image/jpeg")))
                .andReturn();

        BufferedImage decoded = ImageIO.read(new ByteArrayInputStream(result.getResponse().getContentAsByteArray()));
        assertNotNull(decoded, "Decoded image for " + publicUrl + " should not be null");
        assertEquals(expectedW, decoded.getWidth(), "Width mismatch for " + publicUrl);
        assertEquals(expectedH, decoded.getHeight(), "Height mismatch for " + publicUrl);
    }
}
