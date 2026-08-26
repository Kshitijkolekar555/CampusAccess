package com.pict.gatesecurity.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {

    @NotBlank(message = "Current password is required")
    private String currentPassword;

    @NotBlank(message = "New password is required")
    @jakarta.validation.constraints.Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$", message = "New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number")
    private String newPassword;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;
}
