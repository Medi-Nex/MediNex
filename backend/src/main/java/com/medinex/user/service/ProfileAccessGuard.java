package com.medinex.user.service;

import com.medinex.common.exception.ForbiddenException;
import com.medinex.follow.repository.BlockRepository;
import com.medinex.follow.repository.UserFollowRepository;
import com.medinex.user.entity.User;
import com.medinex.user.entity.UserProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Centralized enforcement of user privacy (`isPublicVisible`) and mutual blocks across
 * user profiles, follow lists, community posts, and team contributor endpoints.
 */
@Component
@RequiredArgsConstructor
public class ProfileAccessGuard {

    private final UserFollowRepository userFollowRepository;
    private final BlockRepository blockRepository;

    public boolean isPublicVisible(User target) {
        UserProfile profile = target.getProfile();
        return profile == null || profile.isPublicVisible();
    }

    public boolean isMutuallyBlocked(UUID viewerId, UUID targetUserId) {
        return viewerId != null
                && targetUserId != null
                && !viewerId.equals(targetUserId)
                && blockRepository.areMutuallyBlocked(viewerId, targetUserId);
    }

    public boolean canViewProfile(User target, UUID viewerId) {
        if (isMutuallyBlocked(viewerId, target.getId())) {
            return false;
        }
        if (isPublicVisible(target)) {
            return true;
        }
        return isOwnerOrAcceptedFollower(target.getId(), viewerId);
    }

    public boolean isOwnerOrAcceptedFollower(UUID targetUserId, UUID viewerId) {
        if (viewerId == null || targetUserId == null) {
            return false;
        }
        if (viewerId.equals(targetUserId)) {
            return true;
        }
        return userFollowRepository.existsByFollowerIdAndFollowingId(viewerId, targetUserId);
    }

    public void requireProfileViewAccess(User target, UUID viewerId, String privateDeniedMessage) {
        if (isMutuallyBlocked(viewerId, target.getId())) {
            throw new ForbiddenException("Content is unavailable due to an active block");
        }
        if (!canViewProfile(target, viewerId)) {
            throw new ForbiddenException(privateDeniedMessage);
        }
    }
}
