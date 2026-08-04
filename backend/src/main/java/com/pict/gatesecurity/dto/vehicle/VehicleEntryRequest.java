package com.pict.gatesecurity.dto.vehicle;

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
public class VehicleEntryRequest {

    @NotNull(message = "Gate ID is required")
    private Long gateId;

    @Size(max = 150, message = "Driver name must be at most 150 characters")
    private String driverName;

    @Pattern(regexp = "^[0-9]{10,15}$", message = "Driver contact must be between 10 and 15 digits")
    private String driverContact;

    @NotBlank(message = "Purpose is required")
    @Size(max = 255, message = "Purpose must be at most 255 characters")
    private String purpose;

    private String entryNote;
}
