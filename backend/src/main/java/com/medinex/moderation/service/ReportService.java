package com.medinex.moderation.service;

import com.medinex.common.exception.ResourceNotFoundException;
import com.medinex.moderation.dto.ReportRequest;
import com.medinex.moderation.entity.Report;
import com.medinex.moderation.entity.ReportStatus;
import com.medinex.moderation.repository.ReportRepository;
import com.medinex.user.entity.User;
import com.medinex.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    @Transactional
    public void reportUser(UUID reporterId, String targetUsername, ReportRequest request) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new ResourceNotFoundException("Reporter user not found"));

        User reportedUser = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Reported user not found: " + targetUsername));

        if (reporter.getId().equals(reportedUser.getId())) {
            throw new IllegalArgumentException("Cannot report your own profile");
        }

        Report report = Report.builder()
                .reporter(reporter)
                .reportedUser(reportedUser)
                .reportedPostId(request.getReportedPostId())
                .reportedCommentId(request.getReportedCommentId())
                .reason(request.getReason())
                .details(request.getDetails())
                .status(ReportStatus.PENDING)
                .build();

        reportRepository.save(report);
        log.info("[MODERATION] User {} submitted report against {} for reason: {}",
                reporter.getUsername(), reportedUser.getUsername(), request.getReason());
    }
}
