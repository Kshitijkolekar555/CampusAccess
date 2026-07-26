package com.pict.gatesecurity.dto.vehicle;

import com.pict.gatesecurity.entity.enums.VehicleCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleResponse {

    private Long id;
    private String registrationNumber;
    private String vehicleType;
    private VehicleCategory category;
    private String ownerName;
    private String ownerContact;
    private Long ownerUserId;
    private String ownerUsername;
    private String color;
    private Boolean isBlacklisted;
    private String blacklistReason;
    private OffsetDateTime createdAt;
    private String createdByUsername;
}
