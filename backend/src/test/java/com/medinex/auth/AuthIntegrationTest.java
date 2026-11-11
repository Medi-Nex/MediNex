package com.medinex.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinex.auth.dto.*;
import com.medinex.auth.entity.EmailVerificationToken;
import com.medinex.auth.entity.PasswordResetToken;
import com.medinex.auth.repository.EmailVerificationTokenRepository;
import com.medinex.auth.repository.PasswordResetTokenRepository;
import com.medinex.user.entity.User;
import com.medinex.user.model.UserStatus;
import com.medinex.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@ExtendWith(OutputCaptureExtension.class)
public class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void shouldRegisterNewUserSuccessfully() throws Exception {
        String uniqueSuffix = System.currentTimeMillis() + "";
        RegisterRequest registerRequest = RegisterRequest.builder()
                .fullName("Test Innovator " + uniqueSuffix)
                .username("innovator_" + uniqueSuffix)
                .email("innovator_" + uniqueSuffix + "@medinex.health")
                .password("SecurePass2026!")
                .agreeTerms(true)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.username", is(registerRequest.getUsername())))
                .andExpect(jsonPath("$.data.status", is("PENDING_VERIFICATION")))
                .andExpect(jsonPath("$.data.emailVerified", is(false)));

        User user = userRepository.findByUsernameIgnoreCase(registerRequest.getUsername()).orElse(null);
        assertNotNull(user);
        assertEquals(UserStatus.PENDING_VERIFICATION, user.getStatus());
    }

    @Test
    void shouldFailRegistrationOnDuplicateEmail() throws Exception {
        RegisterRequest req1 = RegisterRequest.builder()
                .fullName("First User")
                .username("firstuser_duptest")
                .email("dup_email@medinex.health")
                .password("SecurePass2026!")
                .agreeTerms(true)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        RegisterRequest req2 = RegisterRequest.builder()
                .fullName("Second User")
                .username("seconduser_duptest")
                .email("dup_email@medinex.health")
                .password("SecurePass2026!")
                .agreeTerms(true)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Email address is already in use")));
    }

    @Test
    void shouldAuthenticateValidUserAndIssueTokens() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .emailOrUsername("admin@medinex.health")
                .password("Admin@SecurePass2026!")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.refreshToken", notNullValue()))
                .andExpect(jsonPath("$.data.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.data.user.email", is("admin@medinex.health")));
    }

    @Test
    void shouldRejectInvalidPassword() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .emailOrUsername("admin@medinex.health")
                .password("WrongPassword!")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void shouldRotateRefreshToken() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .emailOrUsername("admin@medinex.health")
                .password("Admin@SecurePass2026!")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = loginResult.getResponse().getContentAsString();
        String initialRefreshToken = objectMapper.readTree(responseBody).get("data").get("refreshToken").asText();

        RefreshTokenRequest refreshReq = RefreshTokenRequest.builder()
                .refreshToken(initialRefreshToken)
                .build();

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.refreshToken", not(equalTo(initialRefreshToken))));
    }

    @Test
    void shouldAccessAuthenticatedMeEndpoint() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .emailOrUsername("admin@medinex.health")
                .password("Admin@SecurePass2026!")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = loginResult.getResponse().getContentAsString();
        String accessToken = objectMapper.readTree(responseBody).get("data").get("accessToken").asText();

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("admin@medinex.health")))
                .andExpect(jsonPath("$.data.roles", hasItem("ROLE_SUPER_ADMIN")));
    }

    @Test
    void shouldChangePasswordSuccessfully() throws Exception {
        String suffix = System.currentTimeMillis() + "_pwd";
        RegisterRequest register = RegisterRequest.builder()
                .username("pwd_user_" + suffix)
                .email("pwd_user_" + suffix + "@medinex.health")
                .fullName("Password Test User")
                .password("OldSecurePass123!")
                .agreeTerms(true)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(register)));

        LoginRequest login = LoginRequest.builder()
                .emailOrUsername("pwd_user_" + suffix)
                .password("OldSecurePass123!")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("data").get("accessToken").asText();

        ChangePasswordRequest changeReq = ChangePasswordRequest.builder()
                .currentPassword("OldSecurePass123!")
                .newPassword("BrandNewSecurePass2026!")
                .build();

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(changeReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Login with old password fails
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized());

        // Login with new password succeeds
        LoginRequest newLogin = LoginRequest.builder()
                .emailOrUsername("pwd_user_" + suffix)
                .password("BrandNewSecurePass2026!")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLogin)))
                .andExpect(status().isOk());
    }

    @Test
    void shouldEnforceTwoMinuteCooldownAndAllowResendVerificationAfterExpiry() throws Exception {
        String suffix = System.currentTimeMillis() + "_resend";
        String email = "resend_" + suffix + "@medinex.health";
        RegisterRequest register = RegisterRequest.builder()
                .username("resend_" + suffix)
                .email(email)
                .fullName("Resend Test User")
                .password("SecurePass2026!")
                .agreeTerms(true)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        ResendVerificationRequest resendReq = ResendVerificationRequest.builder()
                .email(email)
                .build();

        // Immediate resend within 2-minute window must be rate-limited with 429
        mockMvc.perform(post("/api/v1/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resendReq)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Please wait")));

        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        EmailVerificationToken initialToken = emailVerificationTokenRepository
                .findAllByUserIdOrderByCreatedAtDesc(user.getId())
                .get(0);

        // Age token beyond 120 seconds and retry resend
        jdbcTemplate.update(
                "UPDATE email_verification_tokens SET created_at = ? WHERE id = ?",
                Timestamp.from(Instant.now().minusSeconds(130)),
                initialToken.getId()
        );

        mockMvc.perform(post("/api/v1/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resendReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        var updatedTokens = emailVerificationTokenRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId());
        assertEquals(1, updatedTokens.size());
        assertNotEquals(initialToken.getTokenHash(), updatedTokens.get(0).getTokenHash());
    }

    @Test
    void shouldVerifyEmailWithSixDigitOtpAndRejectNonDigitFormat(CapturedOutput output) throws Exception {
        String suffix = System.currentTimeMillis() + "_otp";
        String email = "otp_" + suffix + "@medinex.health";
        RegisterRequest register = RegisterRequest.builder()
                .username("otp_" + suffix)
                .email(email)
                .fullName("OTP Verification User")
                .password("SecurePass2026!")
                .agreeTerms(true)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        String realOtp = extractOtpForEmail(output, email);

        VerifyEmailRequest badFormat = VerifyEmailRequest.builder()
                .email(email)
                .otp("abc123")
                .build();
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badFormat)))
                .andExpect(status().isBadRequest());

        VerifyEmailRequest validReq = VerifyEmailRequest.builder()
                .email(email)
                .otp(realOtp)
                .build();
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        User verifiedUser = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        assertTrue(verifiedUser.isEmailVerified());
        assertEquals(UserStatus.ACTIVE, verifiedUser.getStatus());
    }

    @Test
    void shouldLockOtpAfterFiveFailedAttempts(CapturedOutput output) throws Exception {
        String suffix = System.currentTimeMillis() + "_lock";
        String email = "lock_" + suffix + "@medinex.health";
        RegisterRequest register = RegisterRequest.builder()
                .username("lock_" + suffix)
                .email(email)
                .fullName("Lockout Test User")
                .password("SecurePass2026!")
                .agreeTerms(true)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        String realOtp = extractOtpForEmail(output, email);
        String wrongOtp = realOtp.equals("000000") ? "999999" : "000000";

        VerifyEmailRequest wrongReq = VerifyEmailRequest.builder()
                .email(email)
                .otp(wrongOtp)
                .build();

        for (int attempt = 1; attempt <= 4; attempt++) {
            mockMvc.perform(post("/api/v1/auth/verify-email")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(wrongReq)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("attempt(s) remaining")));
        }

        // 5th incorrect attempt locks the OTP
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongReq)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message", containsString("Too many failed attempts")));

        // Real OTP must also be rejected once locked
        VerifyEmailRequest realReq = VerifyEmailRequest.builder()
                .email(email)
                .otp(realOtp)
                .build();
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(realReq)))
                .andExpect(status().isTooManyRequests());
    }

    private String extractOtpForEmail(CapturedOutput output, String email) {
        Pattern pattern = Pattern.compile("Dispatching verification OTP to " + Pattern.quote(email) + " \\(OTP: (\\d{6})\\)");
        Matcher matcher = pattern.matcher(output.getOut());
        assertTrue(matcher.find(), "Expected 6-digit OTP log entry for " + email);
        return matcher.group(1);
    }
}
