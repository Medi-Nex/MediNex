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
public class TeamFollowStatsDto {
    private long followerCount;

    @JsonProperty("isFollowing")
    private boolean isFollowing;
}
