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
    @Pattern(regexp = "^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$", message = "Please enter a valid Indian vehicle registration number (e.g. MH12AB1234)")
    private String registrationNumber;

    @Size(max = 50, message = "Vehicle type must be at most 50 characters")
    private String vehicleType;

    @NotNull(message = "Vehicle category is required")
    private VehicleCategory category;

    @Size(max = 150, message = "Owner name must be at most 150 characters")
    @Pattern(regexp = "^([a-zA-Z\\s.']{2,150})?$", message = "Owner name must contain letters and spaces only")
    private String ownerName;

    @Pattern(regexp = "^([6-9][0-9]{9})?$", message = "Owner contact must be a valid 10-digit Indian mobile number")
    private String ownerContact;

    private Long ownerUserId;

    @Size(max = 50, message = "Color must be at most 50 characters")
    private String color;
}
