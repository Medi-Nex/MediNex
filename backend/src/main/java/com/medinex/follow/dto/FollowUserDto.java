package com.medinex.follow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class FollowUserDto {
    private UUID id;
    private String username;
    private String fullName;
    private String headline;
    private String designation;
    private String avatarUrl;
    private String avatarSmUrl;
    private String avatarLgUrl;

    @JsonProperty("isVerifiedContributor")
    private boolean isVerifiedContributor;

    @JsonProperty("isFollowing")
    private boolean isFollowing;

    private Instant followedAt;
}
