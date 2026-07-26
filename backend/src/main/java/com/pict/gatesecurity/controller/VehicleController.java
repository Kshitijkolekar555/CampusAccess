package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.common.PageResponse;
import com.pict.gatesecurity.dto.vehicle.*;
import com.pict.gatesecurity.entity.enums.VehicleCategory;
import com.pict.gatesecurity.service.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
@Tag(name = "Vehicle Management", description = "Vehicle Registration, Entry/Exit Logging, and Blacklist Management")
public class VehicleController {

    private final VehicleService vehicleService;

    @PostMapping("/register")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Register Vehicle", description = "Registers a vehicle in the system")
    public ResponseEntity<ApiResponse<VehicleResponse>> registerVehicle(
            @Valid @RequestBody VehicleRegisterRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        VehicleResponse response = vehicleService.registerVehicle(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Vehicle registered successfully"));
    }

    @PostMapping("/{vehicleId}/entry")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Record Vehicle Entry", description = "Records vehicle entry through a gate")
    public ResponseEntity<ApiResponse<VehicleLogResponse>> recordEntry(
            @PathVariable Long vehicleId,
            @Valid @RequestBody VehicleEntryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        VehicleLogResponse response = vehicleService.recordEntry(vehicleId, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Vehicle entry recorded successfully"));
    }

    @PutMapping("/logs/{logId}/exit")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Record Vehicle Exit", description = "Records vehicle exit")
    public ResponseEntity<ApiResponse<VehicleLogResponse>> recordExit(
            @PathVariable Long logId,
            @RequestBody VehicleExitRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        VehicleLogResponse response = vehicleService.recordExit(logId, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Vehicle exit recorded successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Get Vehicle by ID", description = "Fetches vehicle details by ID")
    public ResponseEntity<ApiResponse<VehicleResponse>> getVehicleById(@PathVariable Long id) {
        VehicleResponse response = vehicleService.getVehicleById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/registration/{registrationNumber}")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Get Vehicle by Registration", description = "Fetches vehicle details by registration number")
    public ResponseEntity<ApiResponse<VehicleResponse>> getVehicleByRegistrationNumber(
            @PathVariable String registrationNumber) {
        VehicleResponse response = vehicleService.getVehicleByRegistrationNumber(registrationNumber);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Search & Filter Vehicles", description = "Paginated list of vehicles filtered by search query, category, or blacklist status")
    public ResponseEntity<ApiResponse<PageResponse<VehicleResponse>>> getVehicles(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) VehicleCategory category,
            @RequestParam(required = false) Boolean isBlacklisted,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<VehicleResponse> vehiclePage = vehicleService.getVehicles(query, category, isBlacklisted, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(vehiclePage)));
    }

    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Search & Filter Vehicle Logs", description = "Paginated list of vehicle entry/exit logs")
    public ResponseEntity<ApiResponse<PageResponse<VehicleLogResponse>>> getVehicleLogs(
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) Long gateId,
            @RequestParam(required = false) Boolean isInside,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "entryTime") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<VehicleLogResponse> logPage = vehicleService.getVehicleLogs(vehicleId, gateId, isInside, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(logPage)));
    }

    @PutMapping("/{id}/blacklist")
    @PreAuthorize("hasAnyRole('SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Blacklist Vehicle", description = "Blacklists a vehicle with a reason (Officer/Admin only)")
    public ResponseEntity<ApiResponse<VehicleResponse>> blacklistVehicle(
            @PathVariable Long id,
            @RequestParam String reason,
            @AuthenticationPrincipal UserDetails userDetails) {
        VehicleResponse response = vehicleService.blacklistVehicle(id, reason, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Vehicle blacklisted successfully"));
    }

    @PutMapping("/{id}/unblacklist")
    @PreAuthorize("hasAnyRole('SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Unblacklist Vehicle", description = "Removes blacklist status from a vehicle (Officer/Admin only)")
    public ResponseEntity<ApiResponse<VehicleResponse>> unblacklistVehicle(
            @PathVariable Long id,
            @RequestParam(defaultValue = "Cleared by authority") String reason,
            @AuthenticationPrincipal UserDetails userDetails) {
        VehicleResponse response = vehicleService.unblacklistVehicle(id, reason, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Vehicle unblacklisted successfully"));
    }
}
