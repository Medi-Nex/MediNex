package com.medinex.moderation.dto;

import com.medinex.moderation.entity.Report;
import com.medinex.moderation.entity.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportDto {
    private UUID id;
    private UUID reporterId;
    private String reporterUsername;
    private String reporterFullName;

    private UUID reportedUserId;
    private String reportedUsername;
    private String reportedFullName;

    private UUID reportedPostId;
    private UUID reportedCommentId;

    private String reason;
    private String details;
    private ReportStatus status;

    private UUID resolvedById;
    private String resolvedByUsername;
    private String resolutionNotes;

    private Instant createdAt;
    private Instant resolvedAt;

    public static ReportDto fromEntity(Report report) {
        if (report == null) return null;
        return ReportDto.builder()
                .id(report.getId())
                .reporterId(report.getReporter() != null ? report.getReporter().getId() : null)
                .reporterUsername(report.getReporter() != null ? report.getReporter().getUsername() : null)
                .reporterFullName(report.getReporter() != null ? report.getReporter().getFullName() : null)
                .reportedUserId(report.getReportedUser() != null ? report.getReportedUser().getId() : null)
                .reportedUsername(report.getReportedUser() != null ? report.getReportedUser().getUsername() : null)
                .reportedFullName(report.getReportedUser() != null ? report.getReportedUser().getFullName() : null)
                .reportedPostId(report.getReportedPostId())
                .reportedCommentId(report.getReportedCommentId())
                .reason(report.getReason())
                .details(report.getDetails())
                .status(report.getStatus())
                .resolvedById(report.getResolvedBy() != null ? report.getResolvedBy().getId() : null)
                .resolvedByUsername(report.getResolvedBy() != null ? report.getResolvedBy().getUsername() : null)
                .resolutionNotes(report.getResolutionNotes())
                .createdAt(report.getCreatedAt())
                .resolvedAt(report.getResolvedAt())
                .build();
    }
}
