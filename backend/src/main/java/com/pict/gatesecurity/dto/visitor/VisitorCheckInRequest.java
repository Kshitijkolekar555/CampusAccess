package com.pict.gatesecurity.dto.visitor;

import com.pict.gatesecurity.entity.enums.HostDepartment;
import com.pict.gatesecurity.entity.enums.HostType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class VisitorCheckInRequest {

    @NotBlank(message = "Visitor name is required")
    @Size(min = 2, max = 150, message = "Visitor name must be between 2 and 150 characters")
    @Pattern(regexp = "^[a-zA-Z\\s.']{2,150}$", message = "Visitor name must contain letters and spaces only")
    private String name;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Please enter a valid 10-digit Indian mobile number")
    private String mobile;

    @NotBlank(message = "Purpose of visit is required")
    @Size(min = 3, max = 255, message = "Purpose must be between 3 and 255 characters")
    private String purpose;

    @NotBlank(message = "Host name is required")
    @Size(min = 2, max = 150, message = "Host name must be between 2 and 150 characters")
    @Pattern(regexp = "^[a-zA-Z\\s.']{2,150}$", message = "Host name must contain letters and spaces only")
    private String hostName;

    @NotNull(message = "Host type is required")
    private HostType hostType;

    @NotNull(message = "Host department is required")
    private HostDepartment hostDepartment;

    @Pattern(regexp = "^([A-Z0-9]{8,20})?$", message = "Student PRN must be 8 to 20 alphanumeric characters")
    private String studentPrn;

    @NotNull(message = "Gate ID is required")
    private Long gateId;

    @Pattern(regexp = "^([A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4})?$", message = "Please enter a valid Indian vehicle registration number (e.g. MH12AB1234)")
    private String vehicleNumber;

    @NotBlank(message = "ID proof type is required")
    @Size(min = 2, max = 50, message = "ID proof type must be between 2 and 50 characters")
    private String idProofType;

    @NotBlank(message = "ID proof number is required")
    @Size(min = 2, max = 50, message = "ID proof number must be between 2 and 50 characters")
    private String idProofNumber;

    private String photoUrl;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;
}
