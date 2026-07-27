package com.pict.gatesecurity.dto.report;

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
public class VehicleReportRow {

    private Long id;
    private Long vehicleId;
    private String registrationNumber;
    private String vehicleType;
    private VehicleCategory category;
    private String ownerName;
    private String ownerContact;
    private Long gateId;
    private String gateName;
    private OffsetDateTime entryTime;
    private OffsetDateTime exitTime;
    private String driverName;
    private String purpose;
    private Boolean isBlacklisted;
    private String createdByUsername;
    private Long durationMinutes;
}
