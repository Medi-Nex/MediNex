package com.medinex.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    @JsonAlias("token")
    @NotBlank(message = "Reset OTP is required")
    @Pattern(regexp = "^\\d{6}$", message = "Reset OTP must be a 6-digit numeric code")
    private String otp;

    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters long")
    private String newPassword;
}
