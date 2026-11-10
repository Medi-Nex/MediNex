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
public class AdminCommentDto {
    private UUID id;
    private UUID postId;
    private String authorUsername;
    private String authorFullName;
    private String content;
    private boolean isHidden;
    private int likesCount;
    private int repliesCount;
    private Instant createdAt;
}
