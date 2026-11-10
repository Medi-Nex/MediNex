package com.medinex.follow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowStatsDto {
    private long followerCount;
    private long followingCount;

    @JsonProperty("isFollowing")
    private boolean isFollowing;

    @JsonProperty("hasPendingRequest")
    private boolean hasPendingRequest;

    @JsonProperty("isBlocked")
    private boolean isBlocked;

    @JsonProperty("isSelf")
    private boolean isSelf;
}
