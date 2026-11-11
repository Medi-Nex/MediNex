package com.medinex.auth.service;

import com.medinex.audit.entity.AuditLog;
import com.medinex.audit.repository.AuditLogRepository;
import com.medinex.auth.dto.*;
import com.medinex.auth.entity.EmailVerificationToken;
import com.medinex.auth.entity.PasswordResetToken;
import com.medinex.auth.entity.RefreshToken;
import com.medinex.auth.repository.EmailVerificationTokenRepository;
import com.medinex.auth.repository.PasswordResetTokenRepository;
import com.medinex.auth.repository.RefreshTokenRepository;
import com.medinex.common.email.EmailService;
import com.medinex.common.exception.AppException;
import com.medinex.common.exception.BadRequestException;
import com.medinex.common.exception.ResourceNotFoundException;
import com.medinex.common.security.JwtTokenProvider;
import com.medinex.common.security.UserPrincipal;
import com.medinex.user.entity.Role;
import com.medinex.user.entity.User;
import com.medinex.user.entity.UserProfile;
import com.medinex.user.model.RoleType;
import com.medinex.user.model.UserStatus;
import com.medinex.user.repository.RoleRepository;
import com.medinex.user.repository.UserProfileRepository;
import com.medinex.user.repository.UserRepository;
import com.medinex.user.service.UsernamePolicy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final long RESEND_VERIFICATION_COOLDOWN_SECONDS = 120L;
    private static final int OTP_EXPIRATION_MINUTES = 10;
    private static final int MAX_OTP_FAILED_ATTEMPTS = 5;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserProfileRepository userProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final EmailService emailService;

    @Transactional
    public UserDto register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new AppException("Email address is already in use", HttpStatus.CONFLICT);
        }

        if (userRepository.existsByUsernameIgnoreCase(request.getUsername())) {
            throw new AppException("Username is already taken", HttpStatus.CONFLICT);
        }

        Role userRole = roleRepository.findById(RoleType.ROLE_USER.name())
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .id(RoleType.ROLE_USER.name())
                        .name(RoleType.ROLE_USER.name())
                        .description("Default community member")
                        .build()));

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .username(request.getUsername().trim().toLowerCase())
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .status(UserStatus.PENDING_VERIFICATION)
                .emailVerified(false)
                .isTeamMember(false)
                .roles(Set.of(userRole))
                .build();

        User savedUser = userRepository.save(user);

        UserProfile profile = UserProfile.builder()
                .user(savedUser)
                .isPublicVisible(true)
                .build();
        userProfileRepository.save(profile);

        boolean dispatched = issueAndDispatchVerificationToken(savedUser);
        if (!dispatched) {
            // Do not keep an un-dispatched verification token so user is never trapped behind a cooldown
            emailVerificationTokenRepository.deleteAll(
                    emailVerificationTokenRepository.findAllByUserIdOrderByCreatedAtDesc(savedUser.getId())
            );
        }

        recordAuditLog(savedUser.getId(), savedUser.getEmail(), "USER_REGISTERED", "User", savedUser.getId().toString());

        return UserDto.fromEntity(savedUser);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getEmailOrUsername().trim();
        User user = userRepository.findByEmailIgnoreCase(identifier)
                .or(() -> userRepository.findByUsernameIgnoreCase(identifier))
                .orElseThrow(() -> new AppException("Invalid username/email or password", HttpStatus.UNAUTHORIZED));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException("Invalid username/email or password", HttpStatus.UNAUTHORIZED);
        }

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new AppException("Account has been suspended. Please contact platform administrators.", HttpStatus.FORBIDDEN);
        }

        if (user.getStatus() == UserStatus.DELETED) {
            throw new AppException("Account has been deactivated.", HttpStatus.GONE);
        }

        UserPrincipal principal = UserPrincipal.create(user);
        String accessToken = tokenProvider.generateAccessToken(principal);
        String rawRefreshToken = tokenProvider.generateRawRefreshToken();
        String refreshTokenHash = tokenProvider.hashToken(rawRefreshToken);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(refreshTokenHash)
                .expiresAt(Instant.now().plus(tokenProvider.getRefreshTokenExpirationMs(), ChronoUnit.MILLIS))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        recordAuditLog(user.getId(), user.getEmail(), "USER_LOGIN", "User", user.getId().toString());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getAccessTokenExpirationMs() / 1000)
                .user(UserDto.fromEntity(user))
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String tokenHash = tokenProvider.hashToken(request.getRefreshToken());
        RefreshToken token = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new AppException("Invalid refresh token", HttpStatus.UNAUTHORIZED));

        if (token.isRevoked() || token.isExpired()) {
            throw new AppException("Refresh token is expired or revoked", HttpStatus.UNAUTHORIZED);
        }

        // Revoke the old token (Rotating refresh token policy)
        token.setRevoked(true);
        refreshTokenRepository.save(token);

        User user = token.getUser();
        UserPrincipal principal = UserPrincipal.create(user);
        String newAccessToken = tokenProvider.generateAccessToken(principal);
        String newRawRefreshToken = tokenProvider.generateRawRefreshToken();
        String newRefreshTokenHash = tokenProvider.hashToken(newRawRefreshToken);

        RefreshToken newRefreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(newRefreshTokenHash)
                .expiresAt(Instant.now().plus(tokenProvider.getRefreshTokenExpirationMs(), ChronoUnit.MILLIS))
                .revoked(false)
                .build();
        refreshTokenRepository.save(newRefreshToken);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRawRefreshToken)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getAccessTokenExpirationMs() / 1000)
                .user(UserDto.fromEntity(user))
                .build();
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            String tokenHash = tokenProvider.hashToken(rawRefreshToken);
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(t -> {
                t.setRevoked(true);
                refreshTokenRepository.save(t);
            });
        }
    }

    @Transactional(noRollbackFor = AppException.class)
    public void verifyEmail(VerifyEmailRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String otp = request.getOtp().trim();

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new AppException("Invalid or expired verification OTP", HttpStatus.BAD_REQUEST));

        if (user.isEmailVerified() && user.getStatus() == UserStatus.ACTIVE) {
            throw new AppException("Email address is already verified", HttpStatus.BAD_REQUEST);
        }

        List<EmailVerificationToken> tokens = emailVerificationTokenRepository
                .findAllByUserIdOrderByCreatedAtDesc(user.getId());

        if (tokens.isEmpty()) {
            throw new AppException("Invalid or expired verification OTP", HttpStatus.BAD_REQUEST);
        }

        EmailVerificationToken latestToken = tokens.get(0);

        if (latestToken.isExpired()) {
            throw new AppException("Verification OTP has expired. Please request a new one.", HttpStatus.BAD_REQUEST);
        }

        if (latestToken.getFailedAttempts() >= MAX_OTP_FAILED_ATTEMPTS) {
            throw new AppException(
                    "Too many failed attempts for this OTP. Please wait and request a new verification code.",
                    HttpStatus.TOO_MANY_REQUESTS
            );
        }

        String expectedHash = hashVerificationOtp(user.getId(), otp);
        if (!MessageDigest.isEqual(
                expectedHash.getBytes(StandardCharsets.UTF_8),
                latestToken.getTokenHash().getBytes(StandardCharsets.UTF_8))) {
            int updatedAttempts = latestToken.getFailedAttempts() + 1;
            latestToken.setFailedAttempts(updatedAttempts);
            emailVerificationTokenRepository.save(latestToken);

            if (updatedAttempts >= MAX_OTP_FAILED_ATTEMPTS) {
                throw new AppException(
                        "Too many failed attempts for this OTP. Please wait and request a new verification code.",
                        HttpStatus.TOO_MANY_REQUESTS
                );
            }
            int remainingAttempts = MAX_OTP_FAILED_ATTEMPTS - updatedAttempts;
            throw new AppException(
                    "Invalid verification OTP. " + remainingAttempts + " attempt(s) remaining.",
                    HttpStatus.BAD_REQUEST
            );
        }

        user.setEmailVerified(true);
        if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
            user.setStatus(UserStatus.ACTIVE);
        }
        userRepository.save(user);

        emailVerificationTokenRepository.deleteAll(tokens);
        recordAuditLog(user.getId(), user.getEmail(), "EMAIL_VERIFIED", "User", user.getId().toString());
    }

    @Transactional
    public void resendVerificationEmail(ResendVerificationRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
        if (userOpt.isEmpty()) {
            return;
        }

        User user = userOpt.get();
        if (user.isEmailVerified() || user.getStatus() != UserStatus.PENDING_VERIFICATION) {
            return;
        }

        List<EmailVerificationToken> existingTokens = emailVerificationTokenRepository
                .findAllByUserIdOrderByCreatedAtDesc(user.getId());

        if (!existingTokens.isEmpty()) {
            Instant cooldownUntil = existingTokens.get(0).getCreatedAt()
                    .plusSeconds(RESEND_VERIFICATION_COOLDOWN_SECONDS);
            Instant now = Instant.now();
            if (cooldownUntil.isAfter(now)) {
                long remainingMillis = Duration.between(now, cooldownUntil).toMillis();
                long remainingSeconds = Math.max(1L, (remainingMillis + 999L) / 1000L);
                throw new AppException(
                        "Please wait " + remainingSeconds + " seconds before requesting another verification code.",
                        HttpStatus.TOO_MANY_REQUESTS
                );
            }
            emailVerificationTokenRepository.deleteAll(existingTokens);
            emailVerificationTokenRepository.flush();
        }

        boolean dispatched = issueAndDispatchVerificationToken(user);
        if (!dispatched) {
            throw new AppException(
                    "Unable to dispatch verification code due to a temporary email service error. Please try again.",
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        }
        recordAuditLog(user.getId(), user.getEmail(), "VERIFICATION_EMAIL_RESENT", "User", user.getId().toString());
    }

    private boolean issueAndDispatchVerificationToken(User user) {
        String rawOtp = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        String tokenHash = hashVerificationOtp(user.getId(), rawOtp);

        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(Instant.now().plus(OTP_EXPIRATION_MINUTES, ChronoUnit.MINUTES))
                .failedAttempts(0)
                .build();
        emailVerificationTokenRepository.save(verificationToken);

        return emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), rawOtp);
    }

    private String hashVerificationOtp(UUID userId, String otp) {
        return tokenProvider.hashToken(userId.toString() + ":" + otp.trim());
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmailIgnoreCase(request.getEmail().trim()).ifPresent(user -> {
            String rawToken = tokenProvider.generateRawRefreshToken().substring(0, 24);
            String tokenHash = tokenProvider.hashToken(rawToken);

            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .user(user)
                    .tokenHash(tokenHash)
                    .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                    .used(false)
                    .build();
            passwordResetTokenRepository.save(resetToken);

            boolean dispatched = emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), rawToken);
            if (!dispatched) {
                throw new AppException(
                        "Unable to dispatch password reset instructions right now. Please try again later.",
                        HttpStatus.SERVICE_UNAVAILABLE
                );
            }
            recordAuditLog(user.getId(), user.getEmail(), "PASSWORD_RESET_REQUESTED", "User", user.getId().toString());
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String tokenHash = tokenProvider.hashToken(request.getToken());
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new AppException("Invalid or expired password reset token", HttpStatus.BAD_REQUEST));

        if (resetToken.isUsed() || resetToken.isExpired()) {
            throw new AppException("Password reset token is invalid or has already been used", HttpStatus.BAD_REQUEST);
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        // Revoke all existing sessions for security
        refreshTokenRepository.revokeAllByUserId(user.getId());

        recordAuditLog(user.getId(), user.getEmail(), "PASSWORD_RESET_COMPLETED", "User", user.getId().toString());
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return UserDto.fromEntity(user);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password does not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        refreshTokenRepository.revokeAllByUserId(user.getId());

        recordAuditLog(user.getId(), user.getEmail(), "PASSWORD_CHANGED", "User", user.getId().toString());
        log.info("[AUTH] User {} changed password successfully", user.getUsername());
    }

    private void recordAuditLog(UUID actorId, String email, String action, String targetEntity, String targetId) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .actorId(actorId)
                    .actorEmail(email)
                    .action(action)
                    .targetEntity(targetEntity)
                    .targetId(targetId)
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to persist audit log: {}", e.getMessage());
        }
    }
}
