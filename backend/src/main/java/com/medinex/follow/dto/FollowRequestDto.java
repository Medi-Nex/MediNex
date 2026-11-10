package com.medinex.follow.dto;

import com.medinex.auth.dto.UserDto;
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
public class FollowRequestDto {
    private UUID id;
    private UserDto requester;
    private String status;
    private Instant createdAt;
}
