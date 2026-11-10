package com.medinex.community.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentDto {

    private UUID id;
    private UUID postId;
    private UUID parentCommentId;

    private String authorId;
    private String authorUsername;
    private String authorFullName;
    private String authorAvatarUrl;

    @JsonProperty("isAuthorVerified")
    private boolean isAuthorVerified;

    private String content;
    private int likesCount;
    private int repliesCount;

    @JsonProperty("isLiked")
    private boolean isLiked;

    @JsonProperty("isOwner")
    private boolean isOwner;

    @Builder.Default
    private List<CommentDto> replies = new ArrayList<>();

    private Instant createdAt;
    private Instant updatedAt;
}
