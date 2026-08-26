package com.pict.gatesecurity.dto.user;

import com.pict.gatesecurity.entity.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCreateRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @jakarta.validation.constraints.Pattern(regexp = "^[a-zA-Z0-9._-]{3,50}$", message = "Username can only contain alphanumeric characters, dots, underscores, and hyphens")
    private String username;

    @NotBlank(message = "Password is required")
    @jakarta.validation.constraints.Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$", message = "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number")
    private String password;

    @NotNull(message = "User role is required")
    private UserRole role;

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 150, message = "Full name must be between 2 and 150 characters")
    @jakarta.validation.constraints.Pattern(regexp = "^[a-zA-Z\\s.']{2,150}$", message = "Full name must contain letters and spaces only")
    private String fullName;

    @jakarta.validation.constraints.Pattern(regexp = "^[6-9][0-9]{9}$", message = "Phone number must be a valid 10-digit Indian mobile number")
    private String phone;

    @Email(message = "Email must be valid")
    @jakarta.validation.constraints.Pattern(regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", message = "Email format is invalid")
    private String email;
}
