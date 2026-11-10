package com.medinex.admin.dto;

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
public class AdminMediaDto {
    private UUID id;
    private UUID postId;
    private String authorUsername;
    private String mediaUrl;
    private String mediaType;
    private long fileSizeBytes;
    private boolean isPostHidden;
    private Instant createdAt;
}
