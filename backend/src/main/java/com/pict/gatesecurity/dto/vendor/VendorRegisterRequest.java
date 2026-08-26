package com.pict.gatesecurity.dto.vendor;

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
public class VendorRegisterRequest {

    @NotBlank(message = "Company name is required")
    @Size(min = 2, max = 200, message = "Company name must be between 2 and 200 characters")
    private String companyName;

    @NotBlank(message = "Contact person is required")
    @Size(min = 2, max = 150, message = "Contact person must be between 2 and 150 characters")
    @Pattern(regexp = "^[a-zA-Z\\s.']{2,150}$", message = "Contact person name must contain letters and spaces only")
    private String contactPerson;

    @NotBlank(message = "Contact phone is required")
    @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Contact phone must be a valid 10-digit Indian mobile number")
    private String contactPhone;

    @Email(message = "Invalid email format")
    @Pattern(regexp = "^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})?$", message = "Email format is invalid")
    @Size(max = 100)
    private String contactEmail;

    @Size(max = 500, message = "Work description cannot exceed 500 characters")
    private String workDescription;

    @Size(max = 50, message = "Assigned department cannot exceed 50 characters")
    private String assignedDepartment;
}
