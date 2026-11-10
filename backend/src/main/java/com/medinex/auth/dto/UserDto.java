package com.medinex.auth.dto;

import com.medinex.user.entity.User;
import com.medinex.user.model.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private UUID id;
    private String username;
    private String email;
    private String fullName;
    private UserStatus status;
    private boolean emailVerified;
    private boolean isTeamMember;
    private List<String> roles;
    private Instant createdAt;

    public static UserDto fromEntity(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .status(user.getStatus())
                .emailVerified(user.isEmailVerified())
                .isTeamMember(user.isTeamMember())
                .roles(user.getRoles().stream().map(r -> r.getName()).toList())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
