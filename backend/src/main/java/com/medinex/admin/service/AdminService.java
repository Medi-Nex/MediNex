package com.medinex.admin.service;

import com.medinex.admin.dto.AdminDashboardStatsDto;
import com.medinex.admin.dto.AdminReportResolutionRequest;
import com.medinex.admin.dto.AdminUserUpdateDto;
import com.medinex.audit.entity.AuditLog;
import com.medinex.audit.repository.AuditLogRepository;
import com.medinex.auth.dto.UserDto;
import com.medinex.common.exception.BadRequestException;
import com.medinex.common.exception.ResourceNotFoundException;
import com.medinex.community.entity.Comment;
import com.medinex.community.entity.Post;
import com.medinex.community.repository.CommentRepository;
import com.medinex.community.repository.PostRepository;
import com.medinex.follow.repository.TeamFollowRepository;
import com.medinex.follow.repository.UserFollowRepository;
import com.medinex.moderation.dto.ReportDto;
import com.medinex.moderation.entity.Report;
import com.medinex.moderation.entity.ReportStatus;
import com.medinex.moderation.repository.ReportRepository;
import com.medinex.user.entity.Role;
import com.medinex.user.entity.User;
import com.medinex.user.model.UserStatus;
import com.medinex.user.repository.RoleRepository;
import com.medinex.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

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
    private final ReportRepository reportRepository;
    private final AuditLogRepository auditLogRepository;

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
}
