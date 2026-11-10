package com.medinex.admin.service;

import com.medinex.admin.dto.*;
import com.medinex.audit.entity.AuditLog;
import com.medinex.audit.repository.AuditLogRepository;
import com.medinex.auth.dto.UserDto;
import com.medinex.common.exception.BadRequestException;
import com.medinex.common.exception.ResourceNotFoundException;
import com.medinex.community.entity.Comment;
import com.medinex.community.entity.Post;
import com.medinex.community.entity.PostMedia;
import com.medinex.community.repository.CommentRepository;
import com.medinex.community.repository.PostMediaRepository;
import com.medinex.community.repository.PostRepository;
import com.medinex.follow.repository.TeamFollowRepository;
import com.medinex.follow.repository.UserFollowRepository;
import com.medinex.moderation.dto.ReportDto;
import com.medinex.moderation.entity.Report;
import com.medinex.moderation.entity.ReportStatus;
import com.medinex.moderation.repository.ReportRepository;
import com.medinex.team.dto.TeamMemberDto;
import com.medinex.team.entity.TeamMember;
import com.medinex.team.repository.TeamMemberRepository;
import com.medinex.user.entity.Role;
import com.medinex.user.entity.User;
import com.medinex.user.entity.UserProfile;
import com.medinex.user.model.UserStatus;
import com.medinex.user.repository.RoleRepository;
import com.medinex.user.repository.UserProfileRepository;
import com.medinex.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final TeamFollowRepository teamFollowRepository;
    private final UserFollowRepository userFollowRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final PostMediaRepository postMediaRepository;
    private final ReportRepository reportRepository;
    private final AuditLogRepository auditLogRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserProfileRepository userProfileRepository;

    private final AtomicReference<AdminSettingsDto> settingsHolder =
            new AtomicReference<>(
                    AdminSettingsDto.builder()
                            .maintenanceMode(false)
                            .allowUserRegistration(true)
                            .requireEmailVerification(true)
                            .phiWarningBannerEnabled(true)
                            .allowedDomains("medinex.health, healthhack2026.org")
                            .platformNotice("Welcome to MediNex. Strictly zero PHI allowed on public feeds.")
                            .build()
            );

    @Transactional(readOnly = true)
    public AdminDashboardStatsDto getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalTeamFollowers = teamFollowRepository.count();
        long totalMemberFollowers = userFollowRepository.count();
        long totalPosts = postRepository.count();
        long pendingReports = reportRepository.countByStatus(ReportStatus.PENDING);
        long totalAuditLogs = auditLogRepository.count();

        return AdminDashboardStatsDto.builder()
                .totalUsers(totalUsers)
                .totalTeamFollowers(totalTeamFollowers)
                .totalMemberFollowers(totalMemberFollowers)
                .totalPosts(totalPosts)
                .pendingReportsCount(pendingReports)
                .totalAuditLogs(totalAuditLogs)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<UserDto> getUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(UserDto::fromEntity);
    }

    @Transactional
    public UserDto updateUser(UUID targetUserId, AdminUserUpdateDto request, UUID adminId) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found"));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        // If target is super admin and current admin is not, prevent demotion
        boolean targetIsSuperAdmin = target.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_SUPER_ADMIN"));
        boolean adminIsSuperAdmin = admin.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_SUPER_ADMIN"));

        if (targetIsSuperAdmin && !adminIsSuperAdmin) {
            throw new BadRequestException("Only SUPER_ADMIN can modify a SUPER_ADMIN account");
        }

        if (request.getStatus() != null) {
            target.setStatus(request.getStatus());
        }

        if (request.getIsTeamMember() != null) {
            target.setTeamMember(request.getIsTeamMember());
        }

        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            Set<Role> newRoles = new HashSet<>();
            for (String roleName : request.getRoles()) {
                String normalized = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
                roleRepository.findByName(normalized)
                        .ifPresent(newRoles::add);
            }
            if (!newRoles.isEmpty()) {
                target.setRoles(newRoles);
            }
        }

        target.setUpdatedAt(Instant.now());
        User saved = userRepository.save(target);

        // Audit log
        AuditLog logEntry = AuditLog.builder()
                .actorId(admin.getId())
                .actorEmail(admin.getEmail())
                .action("ADMIN_USER_UPDATED")
                .targetEntity("USER")
                .targetId(target.getId().toString())
                .ipAddress("127.0.0.1")
                .build();
        auditLogRepository.save(logEntry);

        log.info("[ADMIN] Admin {} updated user {}", admin.getUsername(), target.getUsername());
        return UserDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @Transactional(readOnly = true)
    public Page<ReportDto> getReports(ReportStatus status, Pageable pageable) {
        Page<Report> reports;
        if (status != null) {
            reports = reportRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else {
            reports = reportRepository.findAll(pageable);
        }
        return reports.map(ReportDto::fromEntity);
    }

    @Transactional
    public void resolveReport(UUID reportId, AdminReportResolutionRequest request, UUID adminId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        report.setStatus(request.getStatus());
        report.setResolutionNotes(request.getResolutionNotes());
        report.setResolvedBy(admin);
        report.setResolvedAt(Instant.now());

        if (request.getAction() != null) {
            switch (request.getAction()) {
                case "HIDE_POST":
                    if (report.getReportedPostId() != null) {
                        postRepository.findById(report.getReportedPostId())
                                .ifPresent(p -> {
                                    p.setHidden(true);
                                    postRepository.save(p);
                                });
                    }
                    break;
                case "HIDE_COMMENT":
                    if (report.getReportedCommentId() != null) {
                        commentRepository.findById(report.getReportedCommentId())
                                .ifPresent(c -> {
                                    c.setHidden(true);
                                    commentRepository.save(c);
                                });
                    }
                    break;
                case "SUSPEND_USER":
                    if (report.getReportedUser() != null) {
                        User user = report.getReportedUser();
                        user.setStatus(UserStatus.SUSPENDED);
                        userRepository.save(user);
                    }
                    break;
                default:
                    break;
            }
        }

        reportRepository.save(report);

        AuditLog logEntry = AuditLog.builder()
                .actorId(admin.getId())
                .actorEmail(admin.getEmail())
                .action("REPORT_RESOLVED")
                .targetEntity("REPORT")
                .targetId(report.getId().toString())
                .ipAddress("127.0.0.1")
                .build();
        auditLogRepository.save(logEntry);

        log.info("[ADMIN] Admin {} resolved report {} with status {}",
                admin.getUsername(), report.getId(), request.getStatus());
    }

    @Transactional
    public void moderatePost(UUID postId, boolean isHidden, UUID adminId) {
        Post post = postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        post.setHidden(isHidden);
        postRepository.save(post);

        AuditLog logEntry = AuditLog.builder()
                .actorId(admin.getId())
                .actorEmail(admin.getEmail())
                .action(isHidden ? "POST_HIDDEN" : "POST_UNHIDDEN")
                .targetEntity("POST")
                .targetId(post.getId().toString())
                .ipAddress("127.0.0.1")
                .build();
        auditLogRepository.save(logEntry);

        log.info("[ADMIN] Admin {} set post {} isHidden={}", admin.getUsername(), postId, isHidden);
    }

    @Transactional
    public void moderateComment(UUID commentId, boolean isHidden, UUID adminId) {
        Comment comment = commentRepository.findByIdAndDeletedAtIsNull(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        comment.setHidden(isHidden);
        commentRepository.save(comment);

        AuditLog logEntry = AuditLog.builder()
                .actorId(admin.getId())
                .actorEmail(admin.getEmail())
                .action(isHidden ? "COMMENT_HIDDEN" : "COMMENT_UNHIDDEN")
                .targetEntity("COMMENT")
                .targetId(comment.getId().toString())
                .ipAddress("127.0.0.1")
                .build();
        auditLogRepository.save(logEntry);

        log.info("[ADMIN] Admin {} set comment {} isHidden={}", admin.getUsername(), commentId, isHidden);
    }

    @Transactional(readOnly = true)
    public Page<AdminPostDto> getPosts(Boolean hidden, Pageable pageable) {
        Page<Post> posts;
        if (hidden != null) {
            posts = postRepository.findByDeletedAtIsNullAndIsHidden(hidden, pageable);
        } else {
            posts = postRepository.findByDeletedAtIsNull(pageable);
        }
        return posts.map(this::mapToAdminPostDto);
    }

    @Transactional(readOnly = true)
    public Page<AdminCommentDto> getComments(Boolean hidden, Pageable pageable) {
        Page<Comment> comments;
        if (hidden != null) {
            comments = commentRepository.findByDeletedAtIsNullAndIsHidden(hidden, pageable);
        } else {
            comments = commentRepository.findByDeletedAtIsNull(pageable);
        }
        return comments.map(this::mapToAdminCommentDto);
    }

    @Transactional(readOnly = true)
    public Page<AdminMediaDto> getMedia(Pageable pageable) {
        return postMediaRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::mapToAdminMediaDto);
    }

    @Transactional(readOnly = true)
    public AdminAnalyticsDto getAnalytics() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);
        long suspendedUsers = userRepository.countByStatus(UserStatus.SUSPENDED);
        long pendingVerificationUsers = userRepository.countByStatus(UserStatus.PENDING_VERIFICATION);
        long totalPosts = postRepository.count();
        long hiddenPosts = postRepository.countByDeletedAtIsNullAndIsHiddenTrue();
        long totalComments = commentRepository.count();
        long hiddenComments = commentRepository.countByDeletedAtIsNullAndIsHiddenTrue();
        long totalMedia = postMediaRepository.count();
        long pendingReports = reportRepository.countByStatus(ReportStatus.PENDING);
        long resolvedReports = reportRepository.countByStatus(ReportStatus.RESOLVED);
        long dismissedReports = reportRepository.countByStatus(ReportStatus.DISMISSED);
        long totalAuditLogs = auditLogRepository.count();
        long totalFollows = teamFollowRepository.count() + userFollowRepository.count();

        return AdminAnalyticsDto.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .suspendedUsers(suspendedUsers)
                .pendingVerificationUsers(pendingVerificationUsers)
                .totalPosts(totalPosts)
                .hiddenPosts(hiddenPosts)
                .totalComments(totalComments)
                .hiddenComments(hiddenComments)
                .totalMedia(totalMedia)
                .pendingReports(pendingReports)
                .resolvedReports(resolvedReports)
                .dismissedReports(dismissedReports)
                .totalAuditLogs(totalAuditLogs)
                .totalFollows(totalFollows)
                .build();
    }

    public AdminSettingsDto getSettings() {
        return settingsHolder.get();
    }

    @Transactional
    public AdminSettingsDto updateSettings(AdminSettingsDto request, UUID adminId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        settingsHolder.set(request);

        AuditLog logEntry = AuditLog.builder()
                .actorId(admin.getId())
                .actorEmail(admin.getEmail())
                .action("SITE_SETTINGS_UPDATED")
                .targetEntity("SETTINGS")
                .targetId("PLATFORM_CONFIG")
                .ipAddress("127.0.0.1")
                .build();
        auditLogRepository.save(logEntry);

        log.info("[ADMIN] Admin {} updated platform site settings", admin.getUsername());
        return settingsHolder.get();
    }

    @Transactional(readOnly = true)
    public List<TeamMemberDto> getTeamMembers() {
        return teamMemberRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(this::mapTeamMemberToDto)
                .toList();
    }

    @Transactional
    public TeamMemberDto updateTeamMember(String username, TeamMemberDto updated, UUID adminId) {
        TeamMember member = teamMemberRepository.findByUserUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("Contributor", "username", username));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        if (updated.getDesignation() != null) {
            member.setOfficialDesignation(updated.getDesignation());
        }
        if (updated.getDepartment() != null) {
            member.setDepartment(updated.getDepartment());
        }
        if (updated.getUniversity() != null) {
            member.setUniversity(updated.getUniversity());
        }
        if (updated.getDisplayOrder() > 0) {
            member.setDisplayOrder(updated.getDisplayOrder());
        }
        member.setPlaceholder(false);
        teamMemberRepository.save(member);

        userProfileRepository.findByUserId(member.getUser().getId()).ifPresent(profile -> {
            if (updated.getFullName() != null) member.getUser().setFullName(updated.getFullName());
            if (updated.getBio() != null) profile.setBio(updated.getBio());
            if (updated.getSkills() != null) profile.setSkills(updated.getSkills());
            if (updated.getResponsibilities() != null) profile.setResponsibilities(updated.getResponsibilities());
            if (updated.getGithubUrl() != null) profile.setGithubUrl(updated.getGithubUrl());
            if (updated.getLinkedinUrl() != null) profile.setLinkedinUrl(updated.getLinkedinUrl());
            profile.setVerifiedContributor(true);
            userProfileRepository.save(profile);
        });

        AuditLog logEntry = AuditLog.builder()
                .actorId(admin.getId())
                .actorEmail(admin.getEmail())
                .action("TEAM_MEMBER_UPDATED")
                .targetEntity("TEAM_MEMBER")
                .targetId(member.getId().toString())
                .ipAddress("127.0.0.1")
                .build();
        auditLogRepository.save(logEntry);

        log.info("[ADMIN] Admin {} updated team member {}", admin.getUsername(), username);
        return mapTeamMemberToDto(member);
    }

    private AdminPostDto mapToAdminPostDto(Post post) {
        return AdminPostDto.builder()
                .id(post.getId())
                .authorUsername(post.getAuthor().getUsername())
                .authorFullName(post.getAuthor().getFullName())
                .content(post.getContent())
                .visibility(post.getVisibility().name())
                .isHidden(post.isHidden())
                .isPinned(post.isPinned())
                .isOfficialAnnouncement(post.isOfficialAnnouncement())
                .likesCount(post.getLikesCount())
                .commentsCount(post.getCommentsCount())
                .mediaCount(post.getMedia() != null ? post.getMedia().size() : 0)
                .createdAt(post.getCreatedAt())
                .build();
    }

    private AdminCommentDto mapToAdminCommentDto(Comment comment) {
        return AdminCommentDto.builder()
                .id(comment.getId())
                .postId(comment.getPost().getId())
                .authorUsername(comment.getAuthor().getUsername())
                .authorFullName(comment.getAuthor().getFullName())
                .content(comment.getContent())
                .isHidden(comment.isHidden())
                .likesCount(comment.getLikesCount())
                .repliesCount(comment.getReplies() != null ? comment.getReplies().size() : 0)
                .createdAt(comment.getCreatedAt())
                .build();
    }

    private AdminMediaDto mapToAdminMediaDto(PostMedia media) {
        return AdminMediaDto.builder()
                .id(media.getId())
                .postId(media.getPost().getId())
                .authorUsername(media.getPost().getAuthor().getUsername())
                .mediaUrl(media.getMediaUrl())
                .mediaType(media.getMediaType())
                .fileSizeBytes(media.getFileSizeBytes())
                .isPostHidden(media.getPost().isHidden())
                .createdAt(media.getCreatedAt())
                .build();
    }

    private TeamMemberDto mapTeamMemberToDto(TeamMember member) {
        UserProfile profile = userProfileRepository.findByUserId(member.getUser().getId()).orElse(null);

        return TeamMemberDto.builder()
                .id(member.getId().toString())
                .username(member.getUser().getUsername())
                .fullName(member.getUser().getFullName())
                .designation(member.getOfficialDesignation())
                .department(member.getDepartment())
                .university(member.getUniversity())
                .bio(profile != null ? profile.getBio() : null)
                .skills(profile != null ? profile.getSkills() : List.of())
                .responsibilities(profile != null ? profile.getResponsibilities() : List.of())
                .portfolioUrl(profile != null ? profile.getPortfolioUrl() : null)
                .githubUrl(profile != null ? profile.getGithubUrl() : null)
                .linkedinUrl(profile != null ? profile.getLinkedinUrl() : null)
                .avatarUrl(profile != null ? profile.getAvatarUrl() : null)
                .isLead(member.isLead())
                .isPlaceholder(member.isPlaceholder())
                .publicVisibility(profile == null || profile.isPublicVisible())
                .verifiedJoinDate(profile != null ? profile.getVerifiedJoinDate() : null)
                .displayOrder(member.getDisplayOrder())
                .build();
    }
}
