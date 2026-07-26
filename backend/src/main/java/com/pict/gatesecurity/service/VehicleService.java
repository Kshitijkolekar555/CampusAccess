package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.vehicle.*;
import com.pict.gatesecurity.entity.enums.VehicleCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface VehicleService {

    VehicleResponse registerVehicle(VehicleRegisterRequest request, String performingUsername);

    VehicleLogResponse recordEntry(Long vehicleId, VehicleEntryRequest request, String performingUsername);

    VehicleLogResponse recordExit(Long logId, VehicleExitRequest request, String performingUsername);

    VehicleResponse getVehicleById(Long id);

    VehicleResponse getVehicleByRegistrationNumber(String registrationNumber);

    Page<VehicleResponse> getVehicles(String query, VehicleCategory category, Boolean isBlacklisted, Pageable pageable);

    Page<VehicleLogResponse> getVehicleLogs(Long vehicleId, Long gateId, Boolean isInside, Pageable pageable);

    VehicleResponse blacklistVehicle(Long id, String reason, String performingUsername);

    VehicleResponse unblacklistVehicle(Long id, String reason, String performingUsername);
}
