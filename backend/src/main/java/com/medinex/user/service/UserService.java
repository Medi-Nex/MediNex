package com.medinex.user.service;

import com.medinex.auth.dto.UserDto;
import com.medinex.common.exception.ResourceNotFoundException;
import com.medinex.user.dto.UpdateProfileRequest;
import com.medinex.user.entity.User;
import com.medinex.user.entity.UserProfile;
import com.medinex.user.repository.UserProfileRepository;
import com.medinex.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final AvatarImageService avatarImageService;
    private final ProfileAccessGuard profileAccessGuard;

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
