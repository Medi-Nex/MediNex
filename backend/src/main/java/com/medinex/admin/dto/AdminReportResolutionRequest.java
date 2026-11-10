package com.medinex.admin.dto;

import com.medinex.moderation.entity.ReportStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminReportResolutionRequest {

    @NotNull(message = "Resolution status is required")
    private ReportStatus status;

    private String resolutionNotes;

    private String action; // HIDE_POST, HIDE_COMMENT, SUSPEND_USER, NONE
}
