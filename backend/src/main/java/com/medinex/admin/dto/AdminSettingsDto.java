package com.medinex.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminSettingsDto {
    private boolean maintenanceMode;
    private boolean allowUserRegistration;
    private boolean requireEmailVerification;
    private boolean phiWarningBannerEnabled;
    private String allowedDomains;
    private String platformNotice;
}
