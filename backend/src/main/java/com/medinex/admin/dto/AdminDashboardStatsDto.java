package com.medinex.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsDto {
    private long totalUsers;
    private long totalTeamFollowers;
    private long totalMemberFollowers;
    private long totalPosts;
    private long pendingReportsCount;
    private long totalAuditLogs;
}
