package com.medinex.user.service;

import com.medinex.audit.entity.AuditLog;
import com.medinex.audit.repository.AuditLogRepository;
import com.medinex.auth.dto.UserDto;
import com.medinex.common.exception.AppException;
import com.medinex.common.exception.BadRequestException;
import com.medinex.common.exception.ResourceNotFoundException;
import com.medinex.user.dto.UpdateProfileRequest;
import com.medinex.user.dto.UsernameAvailabilityDto;
import com.medinex.user.entity.User;
import com.medinex.user.entity.UserProfile;
import com.medinex.user.repository.UserProfileRepository;
import com.medinex.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final AvatarImageService avatarImageService;
    private final ProfileAccessGuard profileAccessGuard;
    private final AuditLogRepository auditLogRepository;

    @Transactional(readOnly = true)
    public UserDto getUserByUsername(String username, UUID viewerId) {
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        profileAccessGuard.requireProfileViewAccess(
                user,
                viewerId,
                "This user profile is private. Only the profile owner and accepted followers can view it."
        );
        return UserDto.fromPublicEntity(user);
    }

    @Transactional
    public UserDto updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
            userRepository.save(user);
        }

        UserProfile profile = getOrCreateProfile(user);

        if (request.getHeadline() != null) profile.setHeadline(request.getHeadline());
        if (request.getDesignation() != null) profile.setDesignation(request.getDesignation());
        if (request.getDepartment() != null) profile.setDepartment(request.getDepartment());
        if (request.getUniversity() != null) profile.setUniversity(request.getUniversity());
        if (request.getBio() != null) profile.setBio(request.getBio());
        if (request.getSkills() != null) profile.setSkills(request.getSkills());
        if (request.getResponsibilities() != null) profile.setResponsibilities(request.getResponsibilities());
        if (request.getPortfolioUrl() != null) profile.setPortfolioUrl(request.getPortfolioUrl());
        if (request.getGithubUrl() != null) profile.setGithubUrl(request.getGithubUrl());
        if (request.getLinkedinUrl() != null) profile.setLinkedinUrl(request.getLinkedinUrl());
        if (request.getIsPublicVisible() != null) profile.setPublicVisible(request.getIsPublicVisible());

        UserProfile savedProfile = userProfileRepository.save(profile);
        user.setProfile(savedProfile);

        return UserDto.fromEntity(user);
    }

    @Transactional
    public UserDto uploadAvatar(UUID userId, MultipartFile file) {
        User user = findUserOrThrow(userId);
        UserProfile profile = getOrCreateProfile(user);
        AvatarImageService.AvatarVariants variants = avatarImageService.processAndStoreAvatar(userId, file);
        profile.setAvatarUrl(variants.mdUrl());
        return saveProfileAndMap(user, profile);
    }

    @Transactional
    public UserDto removeAvatar(UUID userId) {
        User user = findUserOrThrow(userId);
        avatarImageService.deleteAvatarsForUser(userId);
        UserProfile profile = getOrCreateProfile(user);
        profile.setAvatarUrl(null);
        return saveProfileAndMap(user, profile);
    }

    @Transactional
    public UserDto uploadBanner(UUID userId, MultipartFile file) {
        User user = findUserOrThrow(userId);
        UserProfile profile = getOrCreateProfile(user);
        String bannerUrl = avatarImageService.processAndStoreBanner(userId, file);
        profile.setCoverImageUrl(bannerUrl);
        return saveProfileAndMap(user, profile);
    }

    @Transactional
    public UserDto removeBanner(UUID userId) {
        User user = findUserOrThrow(userId);
        avatarImageService.deleteBannerForUser(userId);
        UserProfile profile = getOrCreateProfile(user);
        profile.setCoverImageUrl(null);
        return saveProfileAndMap(user, profile);
    }

    @Transactional(readOnly = true)
    public UsernameAvailabilityDto checkUsernameAvailability(String rawUsername, UUID currentUserId) {
        String normalized = UsernamePolicy.normalize(rawUsername);

        if (currentUserId != null) {
            User currentUser = userRepository.findById(currentUserId).orElse(null);
            if (currentUser != null && normalized.equalsIgnoreCase(currentUser.getUsername())) {
                return buildAvailability(
                        normalized,
                        true,
                        true,
                        true,
                        "CURRENT_USERNAME",
                        "This is already your current username."
                );
            }
        }

        if (!UsernamePolicy.isValidSyntax(normalized)) {
            return buildAvailability(
                    normalized,
                    false,
                    false,
                    false,
                    "INVALID_FORMAT",
                    "Use 3-50 characters (a-z, 0-9, _, -), starting and ending with a letter or number."
            );
        }

        if (UsernamePolicy.isReserved(normalized)) {
            return buildAvailability(
                    normalized,
                    false,
                    false,
                    false,
                    "RESERVED",
                    "This username is reserved for platform navigation."
            );
        }

        if (userRepository.existsByUsernameIgnoreCase(normalized)) {
            return buildAvailability(
                    normalized,
                    true,
                    false,
                    false,
                    "TAKEN",
                    "@" + normalized + " is already taken."
            );
        }

        return buildAvailability(
                normalized,
                true,
                true,
                false,
                "OK",
                "@" + normalized + " is available."
        );
    }

    @Transactional
    public UserDto updateUsername(UUID userId, String rawUsername) {
        User user = findUserOrThrow(userId);
        String normalized = UsernamePolicy.normalize(rawUsername);

        if (normalized.equalsIgnoreCase(user.getUsername())) {
            throw new BadRequestException("New username must be different from your current username");
        }

        UsernamePolicy.validateOrThrow(normalized);

        if (userRepository.existsByUsernameIgnoreCase(normalized)) {
            throw new AppException("This username is already taken", HttpStatus.CONFLICT);
        }

        String previousUsername = user.getUsername();
        user.setUsername(normalized);
        try {
            User savedUser = userRepository.saveAndFlush(user);
            recordUsernameAudit(savedUser);
            log.info("[USER] Username updated for userId={}: {} -> {}", savedUser.getId(), previousUsername, normalized);
            return UserDto.fromEntity(savedUser);
        } catch (DataIntegrityViolationException ex) {
            throw new AppException("This username is already taken", HttpStatus.CONFLICT);
        }
    }

    private UsernameAvailabilityDto buildAvailability(
            String normalized,
            boolean valid,
            boolean available,
            boolean current,
            String reason,
            String message) {
        return UsernameAvailabilityDto.builder()
                .username(normalized)
                .valid(valid)
                .available(available)
                .current(current)
                .reason(reason)
                .message(message)
                .profilePath(normalized.isEmpty() ? null : "/users/" + normalized)
                .build();
    }

    private void recordUsernameAudit(User user) {
        try {
            auditLogRepository.save(AuditLog.builder()
                    .actorId(user.getId())
                    .actorEmail(user.getEmail())
                    .action("USERNAME_CHANGED")
                    .targetEntity("User")
                    .targetId(user.getId().toString())
                    .build());
        } catch (Exception e) {
            log.error("Failed to record USERNAME_CHANGED audit log: {}", e.getMessage());
        }
    }

    private User findUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    private UserDto saveProfileAndMap(User user, UserProfile profile) {
        UserProfile savedProfile = userProfileRepository.save(profile);
        user.setProfile(savedProfile);
        return UserDto.fromEntity(user);
    }

    private UserProfile getOrCreateProfile(User user) {
        return userProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> UserProfile.builder().user(user).isPublicVisible(true).build());
    }
}
