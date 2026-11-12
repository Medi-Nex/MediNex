package com.medinex.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medinex.auth.dto.*;
import com.medinex.auth.entity.EmailVerificationToken;
import com.medinex.auth.entity.PasswordResetToken;
import com.medinex.auth.repository.EmailVerificationTokenRepository;
import com.medinex.auth.repository.PasswordResetTokenRepository;
import com.medinex.common.email.EmailService;
import com.medinex.user.entity.User;
import com.medinex.user.model.UserStatus;
import com.medinex.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
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

    @MockitoSpyBean
    private EmailService emailService;

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

        String realOtp = captureOtpForEmail(email);
        assertFalse(output.getAll().contains(realOtp), "Raw verification OTP must never be logged");

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

        String realOtp = captureOtpForEmail(email);
        assertFalse(output.getAll().contains(realOtp), "Raw verification OTP must never be logged");
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

    @Test
    void shouldRedactOtpAndResetTokenFromLogs(CapturedOutput output) throws Exception {
        String suffix = System.currentTimeMillis() + "_redact";
        String email = "redact_" + suffix + "@medinex.health";
        RegisterRequest register = RegisterRequest.builder()
                .username("redact_" + suffix)
                .email(email)
                .fullName("Log Redaction Tester")
                .password("SecurePass2026!")
                .agreeTerms(true)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        String rawOtp = captureOtpForEmail(email);

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ForgotPasswordRequest.builder()
                                .email(email)
                                .build())))
                .andExpect(status().isOk());

        String rawResetOtp = captureResetTokenForEmail(email);
        assertTrue(rawResetOtp.matches("^\\d{6}$"), "Password reset OTP must be a 6-digit numeric code");

        String logs = output.getAll();
        assertFalse(logs.contains(rawOtp), "Verification OTP must never appear in application logs");
        assertFalse(logs.contains(rawResetOtp), "Password reset OTP must never appear in application logs");
        assertFalse(logs.contains("(OTP:"), "Logs must not include plaintext OTP markers");
        assertFalse(logs.contains("(Token:"), "Logs must not include plaintext Token markers");

        // Confirm captured values were real active credentials
        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(VerifyEmailRequest.builder()
                                .email(email)
                                .otp(rawOtp)
                                .build())))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ResetPasswordRequest.builder()
                                .email(email)
                                .otp(rawResetOtp)
                                .newPassword("ResetPass2026!")
                                .build())))
                .andExpect(status().isOk());

        // Replaying the same password reset OTP must fail
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ResetPasswordRequest.builder()
                                .email(email)
                                .otp(rawResetOtp)
                                .newPassword("AnotherPass2026!")
                                .build())))
                .andExpect(status().isBadRequest());

        // Confirm login succeeds with the updated password
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(LoginRequest.builder()
                                .emailOrUsername(email)
                                .password("ResetPass2026!")
                                .build())))
                .andExpect(status().isOk());
    }

    @Test
    void shouldLockPasswordResetOtpAfterFiveFailedAttemptsAndEnforceCooldown() throws Exception {
        String suffix = System.currentTimeMillis() + "_reset_otp_lock";
        String email = "resetlock_" + suffix + "@medinex.health";
        RegisterRequest register = RegisterRequest.builder()
                .username("resetlock_" + suffix)
                .email(email)
                .fullName("Reset Lockout User")
                .password("InitialPass2026!")
                .agreeTerms(true)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        ForgotPasswordRequest forgotReq = ForgotPasswordRequest.builder().email(email).build();
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forgotReq)))
                .andExpect(status().isOk());

        // Immediate duplicate forgot-password request must enforce 2-minute cooldown
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forgotReq)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message", containsString("Please wait")));

        String realOtp = captureResetTokenForEmail(email);
        String wrongOtp = realOtp.equals("000000") ? "999999" : "000000";

        // Reject malformed non-6-digit OTP
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ResetPasswordRequest.builder()
                                .email(email)
                                .otp("abc123")
                                .newPassword("NewPass2026!")
                                .build())))
                .andExpect(status().isBadRequest());

        ResetPasswordRequest wrongReq = ResetPasswordRequest.builder()
                .email(email)
                .otp(wrongOtp)
                .newPassword("NewPass2026!")
                .build();

        for (int attempt = 1; attempt <= 4; attempt++) {
            mockMvc.perform(post("/api/v1/auth/reset-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(wrongReq)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("attempt(s) remaining")));
        }

        // 5th failed attempt locks the OTP
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongReq)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message", containsString("Too many failed attempts")));

        // Real OTP is blocked while locked
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ResetPasswordRequest.builder()
                                .email(email)
                                .otp(realOtp)
                                .newPassword("NewPass2026!")
                                .build())))
                .andExpect(status().isTooManyRequests());

        // Age token past cooldown and request a fresh reset OTP
        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        PasswordResetToken lockedToken = passwordResetTokenRepository
                .findAllByUserIdOrderByCreatedAtDesc(user.getId())
                .get(0);
        jdbcTemplate.update(
                "UPDATE password_reset_tokens SET created_at = ? WHERE id = ?",
                Timestamp.from(Instant.now().minusSeconds(130)),
                lockedToken.getId()
        );

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forgotReq)))
                .andExpect(status().isOk());

        String freshOtp = captureResetTokenForEmail(email);
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ResetPasswordRequest.builder()
                                .email(email)
                                .otp(freshOtp)
                                .newPassword("RecoveredPass2026!")
                                .build())))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(LoginRequest.builder()
                                .emailOrUsername(email)
                                .password("RecoveredPass2026!")
                                .build())))
                .andExpect(status().isOk());
    }

    @Test
    void shouldRejectPrivilegedRolesOnPublicRegistration() throws Exception {
        String suffix = System.currentTimeMillis() + "_pubreg";
        String payload = """
                {
                  "fullName": "Self Escalator",
                  "username": "pubreg_%s",
                  "email": "pubreg_%s@medinex.health",
                  "password": "SecurePass2026!",
                  "agreeTerms": true,
                  "roles": ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MODERATOR"]
                }
                """.formatted(suffix, suffix);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.roles", contains("ROLE_USER")))
                .andExpect(jsonPath("$.data.roles", hasSize(1)));

        User created = userRepository.findByUsernameIgnoreCase("pubreg_" + suffix).orElseThrow();
        List<String> persistedRoles = created.getRoles().stream().map(r -> r.getName()).toList();
        assertEquals(List.of("ROLE_USER"), persistedRoles);
    }

    @Test
    void shouldNotImposeCooldownAfterTransientResendEmailFailure() throws Exception {
        String suffix = System.currentTimeMillis() + "_failresend";
        String email = "failresend_" + suffix + "@medinex.health";
        RegisterRequest register = RegisterRequest.builder()
                .username("failresend_" + suffix)
                .email(email)
                .fullName("Resend Failure Tester")
                .password("SecurePass2026!")
                .agreeTerms(true)
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        EmailVerificationToken initialToken = emailVerificationTokenRepository
                .findAllByUserIdOrderByCreatedAtDesc(user.getId())
                .get(0);

        jdbcTemplate.update(
                "UPDATE email_verification_tokens SET created_at = ? WHERE id = ?",
                Timestamp.from(Instant.now().minusSeconds(130)),
                initialToken.getId()
        );

        ResendVerificationRequest resendReq = ResendVerificationRequest.builder()
                .email(email)
                .build();

        // Simulate transient SMTP failure during resend
        doReturn(false).when(emailService).sendVerificationEmail(eq(email), anyString(), anyString());

        mockMvc.perform(post("/api/v1/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resendReq)))
                .andExpect(status().isServiceUnavailable());

        // Restore real dispatch; immediate retry MUST succeed without waiting 120 seconds
        reset(emailService);

        mockMvc.perform(post("/api/v1/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resendReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    private String captureOtpForEmail(String email) {
        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService, atLeastOnce()).sendVerificationEmail(eq(email), anyString(), otpCaptor.capture());
        List<String> values = otpCaptor.getAllValues();
        assertFalse(values.isEmpty(), "Expected OTP dispatch to " + email);
        return values.get(values.size() - 1);
    }

    private String captureResetTokenForEmail(String email) {
        ArgumentCaptor<String> tokenCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService, atLeastOnce()).sendPasswordResetEmail(eq(email), anyString(), tokenCaptor.capture());
        List<String> values = tokenCaptor.getAllValues();
        assertFalse(values.isEmpty(), "Expected reset token dispatch to " + email);
        return values.get(values.size() - 1);
    }
}
