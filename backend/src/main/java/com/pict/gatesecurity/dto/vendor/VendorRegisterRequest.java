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
    @Size(max = 200)
    private String companyName;

    @NotBlank(message = "Contact person is required")
    @Size(max = 150)
    private String contactPerson;

    @NotBlank(message = "Contact phone is required")
    @Pattern(regexp = "^[0-9]{10,15}$", message = "Contact phone must be between 10 and 15 digits")
    private String contactPhone;

    @Email(message = "Invalid email format")
    @Size(max = 100)
    private String contactEmail;

    private String workDescription;

    @Size(max = 50)
    private String assignedDepartment;
}
