package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.common.PageResponse;
import com.pict.gatesecurity.dto.vendor.*;
import com.pict.gatesecurity.service.VendorService;
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
@RequestMapping("/api/v1/vendors")
@RequiredArgsConstructor
@Tag(name = "Vendor & Contractor Management", description = "Vendor/Contractor registration, visit entry/exit, and blacklist management")
public class VendorController {

    private final VendorService vendorService;

    @PostMapping("/register")
    @PreAuthorize("hasAnyRole('SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Register Vendor/Contractor", description = "Registers a new vendor or contractor")
    public ResponseEntity<ApiResponse<VendorResponse>> registerVendor(
            @Valid @RequestBody VendorRegisterRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        VendorResponse response = vendorService.registerVendor(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Vendor registered successfully"));
    }

    @PostMapping("/{vendorId}/entry")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Record Vendor Entry", description = "Records vendor/contractor entry through a gate")
    public ResponseEntity<ApiResponse<VendorVisitResponse>> recordEntry(
            @PathVariable Long vendorId,
            @Valid @RequestBody VendorVisitEntryRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        VendorVisitResponse response = vendorService.recordEntry(vendorId, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Vendor entry recorded"));
    }

    @PutMapping("/visits/{visitId}/exit")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Record Vendor Exit", description = "Records vendor/contractor exit")
    public ResponseEntity<ApiResponse<VendorVisitResponse>> recordExit(
            @PathVariable Long visitId,
            @RequestBody VendorVisitExitRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        VendorVisitResponse response = vendorService.recordExit(visitId, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Vendor exit recorded"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Get Vendor by ID", description = "Fetches vendor details by ID")
    public ResponseEntity<ApiResponse<VendorResponse>> getVendorById(@PathVariable Long id) {
        VendorResponse response = vendorService.getVendorById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Search & Filter Vendors", description = "Paginated list of vendors filtered by query or blacklist status")
    public ResponseEntity<ApiResponse<PageResponse<VendorResponse>>> getVendors(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Boolean isBlacklisted,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<VendorResponse> vendorPage = vendorService.getVendors(query, isBlacklisted, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(vendorPage)));
    }

    @GetMapping("/visits")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Search & Filter Vendor Visits", description = "Paginated list of vendor visits")
    public ResponseEntity<ApiResponse<PageResponse<VendorVisitResponse>>> getVisits(
            @RequestParam(required = false) Long vendorId,
            @RequestParam(required = false) Long gateId,
            @RequestParam(required = false) Boolean isInside,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "entryTime") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<VendorVisitResponse> visitPage = vendorService.getVisits(vendorId, gateId, isInside, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(visitPage)));
    }

    @PutMapping("/{id}/blacklist")
    @PreAuthorize("hasAnyRole('SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Blacklist Vendor", description = "Blacklists a vendor (Officer/Admin only)")
    public ResponseEntity<ApiResponse<VendorResponse>> blacklistVendor(
            @PathVariable Long id,
            @RequestParam String reason,
            @AuthenticationPrincipal UserDetails userDetails) {
        VendorResponse response = vendorService.blacklistVendor(id, reason, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Vendor blacklisted"));
    }

    @PutMapping("/{id}/unblacklist")
    @PreAuthorize("hasAnyRole('SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Unblacklist Vendor", description = "Removes blacklist status from a vendor (Officer/Admin only)")
    public ResponseEntity<ApiResponse<VendorResponse>> unblacklistVendor(
            @PathVariable Long id,
            @RequestParam(defaultValue = "Cleared by authority") String reason,
            @AuthenticationPrincipal UserDetails userDetails) {
        VendorResponse response = vendorService.unblacklistVendor(id, reason, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Vendor unblacklisted"));
    }
}
