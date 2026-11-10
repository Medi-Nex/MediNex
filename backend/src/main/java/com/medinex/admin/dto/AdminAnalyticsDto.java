package com.medinex.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAnalyticsDto {
    private long totalUsers;
    private long activeUsers;
    private long suspendedUsers;
    private long pendingVerificationUsers;
    private long totalPosts;
    private long hiddenPosts;
    private long totalComments;
    private long hiddenComments;
    private long totalMedia;
    private long pendingReports;
    private long resolvedReports;
    private long dismissedReports;
    private long totalAuditLogs;
    private long totalFollows;
}
