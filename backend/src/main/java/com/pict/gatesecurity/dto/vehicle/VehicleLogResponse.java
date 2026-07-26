package com.pict.gatesecurity.dto.vehicle;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleLogResponse {

    private Long id;
    private Long vehicleId;
    private String registrationNumber;
    private Long gateId;
    private String gateName;
    private OffsetDateTime entryTime;
    private OffsetDateTime exitTime;
    private String driverName;
    private String driverContact;
    private String purpose;
    private String entryNote;
    private String exitNote;
    private OffsetDateTime createdAt;
    private String createdByUsername;
}
