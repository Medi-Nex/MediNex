package com.medinex.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsernameAvailabilityDto {
    private String username;
    private boolean valid;
    private boolean available;
    private boolean current;
    private String reason;
    private String message;
    private String profilePath;
}
