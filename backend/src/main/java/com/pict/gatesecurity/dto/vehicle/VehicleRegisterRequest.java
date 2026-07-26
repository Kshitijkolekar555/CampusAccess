package com.pict.gatesecurity.dto.vehicle;

import com.pict.gatesecurity.entity.enums.VehicleCategory;
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
public class VehicleRegisterRequest {

    @NotBlank(message = "Registration number is required")
    @Size(min = 3, max = 20, message = "Registration number must be between 3 and 20 characters")
    private String registrationNumber;

    @Size(max = 50, message = "Vehicle type must be at most 50 characters")
    private String vehicleType;

    @NotNull(message = "Vehicle category is required")
    private VehicleCategory category;

    @Size(max = 150, message = "Owner name must be at most 150 characters")
    private String ownerName;

    @Pattern(regexp = "^[0-9]{10,15}$", message = "Owner contact must be between 10 and 15 digits")
    private String ownerContact;

    private Long ownerUserId;

    @Size(max = 50, message = "Color must be at most 50 characters")
    private String color;
}
