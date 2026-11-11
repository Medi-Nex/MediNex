package com.medinex.follow.service;

import com.medinex.auth.dto.UserDto;
import com.medinex.common.exception.BadRequestException;
import com.medinex.common.exception.ResourceNotFoundException;
import com.medinex.follow.dto.*;
import com.medinex.follow.entity.*;
import com.medinex.follow.repository.*;
import com.medinex.notification.entity.NotificationType;
import com.medinex.notification.service.NotificationService;
import com.medinex.team.entity.Team;
import com.medinex.team.repository.TeamRepository;
import com.medinex.user.entity.User;
import com.medinex.user.entity.UserProfile;
import com.medinex.user.repository.UserRepository;
import com.medinex.user.service.AvatarUrlHelper;
import com.medinex.user.service.ProfileAccessGuard;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FollowService {

    private final UserFollowRepository userFollowRepository;
    private final TeamFollowRepository teamFollowRepository;
    private final FollowRequestRepository followRequestRepository;
    private final BlockRepository blockRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final NotificationService notificationService;
    private final ProfileAccessGuard profileAccessGuard;

    // --------------------------------------------------------------------------
    // USER FOLLOW OPERATIONS
    // --------------------------------------------------------------------------

    @Transactional
    public FollowStatsDto followUser(UUID followerId, String targetUsername) {
        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new ResourceNotFoundException("Follower not found"));

        User target = userRepository.findByUsernameIgnoreCase(targetUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found: " + targetUsername));

        if (follower.getId().equals(target.getId())) {
            throw new BadRequestException("You cannot follow your own profile");
        }

        if (blockRepository.areMutuallyBlocked(follower.getId(), target.getId())) {
            throw new BadRequestException("Interaction not permitted due to an active block");
        }

        // Check if already following
        if (userFollowRepository.existsByFollowerIdAndFollowingId(follower.getId(), target.getId())) {
            return getUserFollowStats(follower.getId(), targetUsername);
        }

        UserProfile targetProfile = target.getProfile();
        boolean isPrivate = targetProfile != null && !targetProfile.isPublicVisible();

        if (isPrivate) {
            // Private account requires a Follow Request
            boolean hasPending = followRequestRepository.existsByRequesterIdAndTargetIdAndStatus(
                    follower.getId(), target.getId(), FollowRequestStatus.PENDING);

            if (!hasPending) {
                FollowRequest request = FollowRequest.builder()
                        .requester(follower)
                        .target(target)
                        .status(FollowRequestStatus.PENDING)
                        .build();
                followRequestRepository.save(request);

                notificationService.createNotification(
                        target,
                        follower,
                        NotificationType.FOLLOW_REQUEST,
                        "USER",
                        follower.getId(),
                        follower.getFullName() + " requested to follow your private profile"
                );
            }

            return FollowStatsDto.builder()
                    .followerCount(userFollowRepository.countByFollowingId(target.getId()))
                    .followingCount(userFollowRepository.countByFollowerId(target.getId()))
                    .isFollowing(false)
                    .hasPendingRequest(true)
                    .isBlocked(false)
                    .isSelf(false)
                    .build();
        }

        // Public profile -> direct follow
        UserFollow follow = UserFollow.builder()
                .follower(follower)
                .following(target)
                .build();
        userFollowRepository.save(follow);

        // Remove any stale follow request
        followRequestRepository.deleteMutualRequests(follower.getId(), target.getId());

        notificationService.createNotification(
                target,
                follower,
                NotificationType.NEW_FOLLOWER,
                "USER",
                follower.getId(),
                follower.getFullName() + " started following you"
        );

        log.info("[FOLLOW] User {} is now following {}", follower.getUsername(), target.getUsername());
        return getUserFollowStats(follower.getId(), targetUsername);
    }

    @Transactional
    public FollowStatsDto unfollowUser(UUID followerId, String targetUsername) {
        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new ResourceNotFoundException("Follower not found"));

        User target = userRepository.findByUsernameIgnoreCase(targetUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found: " + targetUsername));

        userFollowRepository.deleteByFollowerIdAndFollowingId(follower.getId(), target.getId());

        // Also clean up any pending follow request
        followRequestRepository.findByRequesterIdAndTargetId(follower.getId(), target.getId())
                .ifPresent(followRequestRepository::delete);

        log.info("[UNFOLLOW] User {} unfollowed {}", follower.getUsername(), target.getUsername());
        return getUserFollowStats(follower.getId(), targetUsername);
    }

    @Transactional(readOnly = true)
    public FollowStatsDto getUserFollowStats(UUID currentUserId, String targetUsername) {
        User target = userRepository.findByUsernameIgnoreCase(targetUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUsername));

        long followerCount = userFollowRepository.countByFollowingId(target.getId());
        long userFollowingCount = userFollowRepository.countByFollowerId(target.getId());
        long teamFollowingCount = teamFollowRepository.countByFollowerId(target.getId());
        long totalFollowingCount = userFollowingCount + teamFollowingCount;

        boolean isSelf = currentUserId != null && currentUserId.equals(target.getId());
        boolean isFollowing = false;
        boolean hasPendingRequest = false;
        boolean isBlocked = false;

        if (currentUserId != null && !isSelf) {
            isFollowing = userFollowRepository.existsByFollowerIdAndFollowingId(currentUserId, target.getId());
            hasPendingRequest = followRequestRepository.existsByRequesterIdAndTargetIdAndStatus(
                    currentUserId, target.getId(), FollowRequestStatus.PENDING);
            isBlocked = blockRepository.areMutuallyBlocked(currentUserId, target.getId());
        }

        return FollowStatsDto.builder()
                .followerCount(followerCount)
                .followingCount(totalFollowingCount)
                .isFollowing(isFollowing)
                .hasPendingRequest(hasPendingRequest)
                .isBlocked(isBlocked)
                .isSelf(isSelf)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<FollowUserDto> getUserFollowers(String username, UUID currentUserId, Pageable pageable) {
        User target = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        profileAccessGuard.requireProfileViewAccess(
                target,
                currentUserId,
                "Followers list is private. Only the profile owner and accepted followers can view it."
        );

        return userFollowRepository.findByFollowingIdOrderByCreatedAtDesc(target.getId(), pageable)
                .map(uf -> mapUserToFollowDto(uf.getFollower(), uf.getCreatedAt(), currentUserId));
    }

    @Transactional(readOnly = true)
    public Page<FollowUserDto> getUserFollowing(String username, UUID currentUserId, Pageable pageable) {
        User target = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        profileAccessGuard.requireProfileViewAccess(
                target,
                currentUserId,
                "Following list is private. Only the profile owner and accepted followers can view it."
        );

        return userFollowRepository.findByFollowerIdOrderByCreatedAtDesc(target.getId(), pageable)
                .map(uf -> mapUserToFollowDto(uf.getFollowing(), uf.getCreatedAt(), currentUserId));
    }

    // --------------------------------------------------------------------------
    // TEAM FOLLOW OPERATIONS
    // --------------------------------------------------------------------------

    @Transactional
    public TeamFollowStatsDto followTeam(UUID followerId) {
        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Team team = getOfficialTeam();

        if (!teamFollowRepository.existsByFollowerIdAndTeamId(follower.getId(), team.getId())) {
            TeamFollow teamFollow = TeamFollow.builder()
                    .follower(follower)
                    .team(team)
                    .build();
            teamFollowRepository.save(teamFollow);
            log.info("[TEAM FOLLOW] User {} followed official team {}", follower.getUsername(), team.getName());
        }

        long followerCount = teamFollowRepository.countByTeamId(team.getId());
        return TeamFollowStatsDto.builder()
                .followerCount(followerCount)
                .isFollowing(true)
                .build();
    }

    @Transactional
    public TeamFollowStatsDto unfollowTeam(UUID followerId) {
        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Team team = getOfficialTeam();
        teamFollowRepository.deleteByFollowerIdAndTeamId(follower.getId(), team.getId());

        log.info("[TEAM UNFOLLOW] User {} unfollowed official team {}", follower.getUsername(), team.getName());
        long followerCount = teamFollowRepository.countByTeamId(team.getId());
        return TeamFollowStatsDto.builder()
                .followerCount(followerCount)
                .isFollowing(false)
                .build();
    }

    @Transactional(readOnly = true)
    public TeamFollowStatsDto getTeamFollowStats(UUID currentUserId) {
        Team team = getOfficialTeam();
        long followerCount = teamFollowRepository.countByTeamId(team.getId());
        boolean isFollowing = currentUserId != null &&
                teamFollowRepository.existsByFollowerIdAndTeamId(currentUserId, team.getId());

        return TeamFollowStatsDto.builder()
                .followerCount(followerCount)
                .isFollowing(isFollowing)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<FollowUserDto> getTeamFollowers(UUID currentUserId, Pageable pageable) {
        Team team = getOfficialTeam();
        return teamFollowRepository.findByTeamIdOrderByCreatedAtDesc(team.getId(), pageable)
                .map(tf -> mapUserToFollowDto(tf.getFollower(), tf.getCreatedAt(), currentUserId));
    }

    // --------------------------------------------------------------------------
    // BLOCKING & UNBLOCKING
    // --------------------------------------------------------------------------

    @Transactional
    public void blockUser(UUID blockerId, String targetUsername, String reason) {
        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new ResourceNotFoundException("Blocker not found"));

        User blocked = userRepository.findByUsernameIgnoreCase(targetUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found: " + targetUsername));

        if (blocker.getId().equals(blocked.getId())) {
            throw new BadRequestException("You cannot block your own profile");
        }

        // Sever all existing follow relationships in both directions
        userFollowRepository.deleteMutualFollows(blocker.getId(), blocked.getId());
        followRequestRepository.deleteMutualRequests(blocker.getId(), blocked.getId());

        if (!blockRepository.existsByBlockerIdAndBlockedId(blocker.getId(), blocked.getId())) {
            Block block = Block.builder()
                    .blocker(blocker)
                    .blocked(blocked)
                    .reason(reason)
                    .build();
            blockRepository.save(block);
        }

        log.info("[BLOCK] User {} blocked user {}", blocker.getUsername(), blocked.getUsername());
    }

    @Transactional
    public void unblockUser(UUID blockerId, String targetUsername) {
        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new ResourceNotFoundException("Blocker not found"));

        User blocked = userRepository.findByUsernameIgnoreCase(targetUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found: " + targetUsername));

        blockRepository.deleteByBlockerIdAndBlockedId(blocker.getId(), blocked.getId());
        log.info("[UNBLOCK] User {} unblocked user {}", blocker.getUsername(), blocked.getUsername());
    }

    @Transactional(readOnly = true)
    public java.util.List<BlockedUserDto> getBlockedUsers(UUID blockerId) {
        return blockRepository.findByBlockerIdOrderByCreatedAtDesc(blockerId).stream()
                .map(b -> BlockedUserDto.builder()
                        .id(b.getId())
                        .blockedUserId(b.getBlocked().getId())
                        .username(b.getBlocked().getUsername())
                        .fullName(b.getBlocked().getFullName())
                        .reason(b.getReason())
                        .blockedAt(b.getCreatedAt())
                        .build())
                .toList();
    }

    // --------------------------------------------------------------------------
    // FOLLOW REQUEST MANAGEMENT
    // --------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Page<FollowRequestDto> getPendingFollowRequests(UUID currentUserId, Pageable pageable) {
        return followRequestRepository.findByTargetIdAndStatusOrderByCreatedAtDesc(
                currentUserId, FollowRequestStatus.PENDING, pageable
        ).map(fr -> FollowRequestDto.builder()
                .id(fr.getId())
                .requester(UserDto.fromPublicEntity(fr.getRequester()))
                .status(fr.getStatus().name())
                .createdAt(fr.getCreatedAt())
                .build());
    }

    @Transactional
    public void acceptFollowRequest(UUID currentUserId, UUID requestId) {
        FollowRequest request = followRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Follow request not found"));

        if (!request.getTarget().getId().equals(currentUserId)) {
            throw new BadRequestException("Unauthorized to resolve this follow request");
        }

        request.setStatus(FollowRequestStatus.ACCEPTED);
        followRequestRepository.save(request);

        // Add follow
        if (!userFollowRepository.existsByFollowerIdAndFollowingId(request.getRequester().getId(), currentUserId)) {
            UserFollow follow = UserFollow.builder()
                    .follower(request.getRequester())
                    .following(request.getTarget())
                    .build();
            userFollowRepository.save(follow);
        }

        notificationService.createNotification(
                request.getRequester(),
                request.getTarget(),
                NotificationType.FOLLOW_ACCEPTED,
                "USER",
                currentUserId,
                request.getTarget().getFullName() + " accepted your follow request"
        );

        log.info("[FOLLOW REQUEST] Request {} accepted by {}", requestId, request.getTarget().getUsername());
    }

    @Transactional
    public void rejectFollowRequest(UUID currentUserId, UUID requestId) {
        FollowRequest request = followRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Follow request not found"));

        if (!request.getTarget().getId().equals(currentUserId)) {
            throw new BadRequestException("Unauthorized to resolve this follow request");
        }

        request.setStatus(FollowRequestStatus.REJECTED);
        followRequestRepository.save(request);
        log.info("[FOLLOW REQUEST] Request {} rejected by {}", requestId, request.getTarget().getUsername());
    }

    // --------------------------------------------------------------------------
    // HELPERS
    // --------------------------------------------------------------------------

    private Team getOfficialTeam() {
        return teamRepository.findBySlug("medinex-official")
                .or(() -> teamRepository.findAll().stream().findFirst())
                .orElseThrow(() -> new ResourceNotFoundException("Official MediNex team entity not initialized"));
    }

    private FollowUserDto mapUserToFollowDto(User user, Instant followedAt, UUID currentUserId) {
        UserProfile profile = user.getProfile();
        boolean isFollowing = currentUserId != null &&
                userFollowRepository.existsByFollowerIdAndFollowingId(currentUserId, user.getId());

        String avatarUrl = profile != null ? profile.getAvatarUrl() : null;

        return FollowUserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .headline(profile != null ? profile.getHeadline() : null)
                .designation(profile != null ? profile.getDesignation() : null)
                .avatarUrl(avatarUrl)
                .avatarSmUrl(AvatarUrlHelper.deriveVariant(avatarUrl, AvatarUrlHelper.VARIANT_SM))
                .avatarLgUrl(AvatarUrlHelper.deriveVariant(avatarUrl, AvatarUrlHelper.VARIANT_LG))
                .isVerifiedContributor(profile != null && profile.isVerifiedContributor())
                .isFollowing(isFollowing)
                .followedAt(followedAt)
                .build();
    }
}
