package com.medinex.admin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.medinex.user.model.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserUpdateDto {
    private UserStatus status;
    private List<String> roles;

    @JsonProperty("isTeamMember")
    private Boolean isTeamMember;
}
