package com.medinex.community.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.medinex.community.entity.PostVisibility;
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
public class PostDto {

    private UUID id;
    private String authorId;
    private String authorUsername;
    private String authorFullName;
    private String authorAvatarUrl;
    private String authorAvatarSmUrl;
    private String authorAvatarLgUrl;
    private String authorDesignation;

    @JsonProperty("isAuthorVerified")
    private boolean isAuthorVerified;

    private String content;
    private PostVisibility visibility;

    @JsonProperty("isPinned")
    private boolean isPinned;

    @JsonProperty("isHidden")
    private boolean isHidden;

    @JsonProperty("isOfficialAnnouncement")
    private boolean isOfficialAnnouncement;

    private int likesCount;
    private int commentsCount;

    @Builder.Default
    private List<PostMediaDto> media = new ArrayList<>();

    @JsonProperty("isLiked")
    private boolean isLiked;

    @JsonProperty("isOwner")
    private boolean isOwner;

    private Instant createdAt;
    private Instant updatedAt;
}
