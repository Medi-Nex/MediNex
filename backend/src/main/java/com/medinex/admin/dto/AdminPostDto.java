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
public class AdminPostDto {
    private UUID id;
    private String authorUsername;
    private String authorFullName;
    private String content;
    private String visibility;
    private boolean isHidden;
    private boolean isPinned;
    private boolean isOfficialAnnouncement;
    private int likesCount;
    private int commentsCount;
    private int mediaCount;
    private Instant createdAt;
}
