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
    private String name;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[0-9]{10,15}$", message = "Mobile number must be between 10 and 15 digits")
    private String mobile;

    @NotBlank(message = "Purpose of visit is required")
    @Size(min = 2, max = 255, message = "Purpose must be between 2 and 255 characters")
    private String purpose;

    @NotBlank(message = "Host name is required")
    @Size(min = 2, max = 150, message = "Host name must be between 2 and 150 characters")
    private String hostName;

    @NotNull(message = "Host type is required")
    private HostType hostType;

    @NotNull(message = "Host department is required")
    private HostDepartment hostDepartment;

    private String studentPrn;

    @NotNull(message = "Gate ID is required")
    private Long gateId;

    private String vehicleNumber;

    @NotBlank(message = "ID proof type is required")
    private String idProofType;

    @NotBlank(message = "ID proof number is required")
    private String idProofNumber;

    private String photoUrl;

    private String notes;
}
