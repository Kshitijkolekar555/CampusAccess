package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.dto.gate.GateCreateRequest;
import com.pict.gatesecurity.dto.gate.GateResponse;
import com.pict.gatesecurity.service.GateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/gates")
@RequiredArgsConstructor
@Tag(name = "Gate Management", description = "Campus Entry/Exit Gate Management APIs")
public class GateController {

    private final GateService gateService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create Campus Gate", description = "Creates a new physical entry/exit gate (ADMIN only)")
    public ResponseEntity<ApiResponse<GateResponse>> createGate(
            @Valid @RequestBody GateCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        GateResponse response = gateService.createGate(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Gate created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update Campus Gate", description = "Updates gate name, location, or active status (ADMIN only)")
    public ResponseEntity<ApiResponse<GateResponse>> updateGate(
            @PathVariable Long id,
            @Valid @RequestBody GateCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        GateResponse response = gateService.updateGate(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Gate updated successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_OFFICER', 'SECURITY_GUARD', 'GUARD')")
    @Operation(summary = "Get Gate Details", description = "Fetches gate information by ID")
    public ResponseEntity<ApiResponse<GateResponse>> getGateById(@PathVariable Long id) {
        GateResponse response = gateService.getGateById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_OFFICER', 'SECURITY_GUARD', 'GUARD')")
    @Operation(summary = "List Campus Gates", description = "Returns all campus gates (optionally filter active gates only)")
    public ResponseEntity<ApiResponse<List<GateResponse>>> getAllGates(
            @RequestParam(required = false, defaultValue = "false") Boolean activeOnly) {
        List<GateResponse> responses = gateService.getAllGates(activeOnly);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}
