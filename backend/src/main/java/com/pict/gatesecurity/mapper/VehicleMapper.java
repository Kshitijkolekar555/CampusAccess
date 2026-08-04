package com.pict.gatesecurity.mapper;

import com.pict.gatesecurity.dto.vehicle.VehicleLogResponse;
import com.pict.gatesecurity.dto.vehicle.VehicleResponse;
import com.pict.gatesecurity.entity.Vehicle;
import com.pict.gatesecurity.entity.VehicleLog;
import org.springframework.stereotype.Component;

@Component
public class VehicleMapper {

    public VehicleResponse toResponse(Vehicle vehicle) {
        if (vehicle == null) {
            return null;
        }

        return VehicleResponse.builder()
                .id(vehicle.getId())
                .registrationNumber(vehicle.getRegistrationNumber())
                .vehicleType(vehicle.getVehicleType())
                .category(vehicle.getCategory())
                .ownerName(vehicle.getOwnerName())
                .ownerContact(vehicle.getOwnerContact())
                .ownerUserId(vehicle.getOwnerUser() != null ? vehicle.getOwnerUser().getId() : null)
                .ownerUsername(vehicle.getOwnerUser() != null ? vehicle.getOwnerUser().getUsername() : null)
                .color(vehicle.getColor())
                .isBlacklisted(vehicle.getIsBlacklisted())
                .blacklistReason(vehicle.getBlacklistReason())
                .createdAt(vehicle.getCreatedAt())
                .createdByUsername(vehicle.getCreatedBy() != null ? vehicle.getCreatedBy().getUsername() : null)
                .build();
    }

    public VehicleLogResponse toLogResponse(VehicleLog vehicleLog) {
        if (vehicleLog == null) {
            return null;
        }

        return VehicleLogResponse.builder()
                .id(vehicleLog.getId())
                .vehicleId(vehicleLog.getVehicle().getId())
                .registrationNumber(vehicleLog.getVehicle().getRegistrationNumber())
                .gateId(vehicleLog.getGate().getId())
                .gateName(vehicleLog.getGate().getName())
                .entryTime(vehicleLog.getEntryTime())
                .exitTime(vehicleLog.getExitTime())
                .driverName(vehicleLog.getDriverName())
                .driverContact(vehicleLog.getDriverContact())
                .purpose(vehicleLog.getPurpose())
                .entryNote(vehicleLog.getEntryNote())
                .exitNote(vehicleLog.getExitNote())
                .actionTime(vehicleLog.getActionTime() != null ? vehicleLog.getActionTime() : vehicleLog.getCreatedAt())
                .processedByGuardId(vehicleLog.getProcessedByGuard() != null ? vehicleLog.getProcessedByGuard().getId() : null)
                .processedByGuardName(vehicleLog.getProcessedByGuard() != null ? vehicleLog.getProcessedByGuard().getFullName() : null)
                .createdAt(vehicleLog.getCreatedAt())
                .createdByUsername(vehicleLog.getCreatedBy() != null ? vehicleLog.getCreatedBy().getUsername() : null)
                .build();
    }
}
