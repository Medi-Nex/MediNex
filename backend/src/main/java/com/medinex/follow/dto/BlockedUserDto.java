package com.medinex.follow.dto;

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
public class BlockedUserDto {
    private UUID id;
    private UUID blockedUserId;
    private String username;
    private String fullName;
    private String reason;
    private Instant blockedAt;
}
