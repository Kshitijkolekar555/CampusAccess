package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.common.PageResponse;
import com.pict.gatesecurity.dto.visitor.VisitorCheckInRequest;
import com.pict.gatesecurity.dto.visitor.VisitorCheckOutRequest;
import com.pict.gatesecurity.dto.visitor.VisitorResponse;
import com.pict.gatesecurity.entity.enums.HostDepartment;
import com.pict.gatesecurity.entity.enums.HostType;
import com.pict.gatesecurity.service.VisitorService;
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

import com.pict.gatesecurity.dto.visitor.VisitorRecognitionResponse;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/visitors", "/api/visitors"})
@RequiredArgsConstructor
@Tag(name = "Visitor Management", description = "Visitor Check-In, QR Pass Generation, Check-Out, and Face Recognition Tracking")
public class VisitorController {

    private final VisitorService visitorService;
    private final com.pict.gatesecurity.service.EndOfDayClosureService endOfDayClosureService;

    @PostMapping("/check-in")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Visitor Check-In", description = "Registers visitor, checks watchlist, and generates QR digital pass")
    public ResponseEntity<ApiResponse<VisitorResponse>> checkIn(
            @Valid @RequestBody VisitorCheckInRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        VisitorResponse response = visitorService.checkIn(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Visitor checked in successfully"));
    }

    @PostMapping("/check-out")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN')")
    @Operation(summary = "Visitor Check-Out", description = "Logs visitor checkout by visitor ID, pass code, or mobile number")
    public ResponseEntity<ApiResponse<VisitorResponse>> checkOut(
            @RequestBody VisitorCheckOutRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        VisitorResponse response = visitorService.checkOut(request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Visitor checked out successfully"));
    }

    @GetMapping("/inside")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN', 'STAFF', 'FACULTY')")
    @Operation(summary = "Active Visitors Inside", description = "Returns a list of all visitors currently on campus (not yet checked out)")
    public ResponseEntity<ApiResponse<List<VisitorResponse>>> getActiveVisitorsInside() {
        List<VisitorResponse> responses = visitorService.getActiveVisitorsInside();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get Visitor Details", description = "Fetches visitor record and QR pass details by ID")
    public ResponseEntity<ApiResponse<VisitorResponse>> getVisitorById(@PathVariable Long id) {
        VisitorResponse response = visitorService.getVisitorById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Search & Filter Visitor Logs", description = "Paginated list of visitors filtered by search query, department, host type, or blacklist status")
    public ResponseEntity<ApiResponse<PageResponse<VisitorResponse>>> getVisitors(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) HostDepartment department,
            @RequestParam(required = false) HostType hostType,
            @RequestParam(required = false) Boolean isBlacklisted,
            @RequestParam(required = false) Boolean activeInside,
            @RequestParam(required = false) com.pict.gatesecurity.entity.enums.PassStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "timeIn") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            @AuthenticationPrincipal UserDetails userDetails) {

        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<VisitorResponse> visitorPage = visitorService.getVisitors(query, department, hostType, isBlacklisted, activeInside, status, pageable, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(visitorPage)));
    }

    @PostMapping(value = "/recognize", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Recognize Visitor Face", description = "Uploads photo to Python service to match existing visitor")
    public ResponseEntity<VisitorRecognitionResponse> recognizeVisitor(
            @RequestParam("photo") MultipartFile photo) {
        VisitorRecognitionResponse response = visitorService.recognizeVisitorFace(photo);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = {"/request-token", "/generate-token"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Request Digital Token with Photo", description = "Generates a digital token with face capture awaiting guard approval")
    public ResponseEntity<ApiResponse<VisitorResponse>> requestDigitalToken(
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @Valid @RequestPart("data") VisitorCheckInRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "visitor_portal";
        VisitorResponse response = visitorService.requestToken(photo, request, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Digital token requested successfully. Pending guard clearance."));
    }

    @PostMapping(value = {"/request-token", "/generate-token"}, consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Request Digital Token (JSON)", description = "Generates a digital token awaiting guard approval")
    public ResponseEntity<ApiResponse<VisitorResponse>> requestDigitalTokenJson(
            @Valid @RequestBody VisitorCheckInRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "visitor_portal";
        VisitorResponse response = visitorService.requestToken(null, request, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Digital token requested successfully. Pending guard clearance."));
    }

    @GetMapping("/my-active-token")
    @PreAuthorize("hasAnyRole('VISITOR', 'USER', 'STUDENT', 'SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Get Visitor's Active/Pending Digital Token", description = "Fetches the current user's digital token pass")
    public ResponseEntity<ApiResponse<VisitorResponse>> getMyActiveToken(
            @AuthenticationPrincipal UserDetails userDetails) {
        VisitorResponse response = visitorService.getMyActiveToken(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/my-pending-requests")
    @PreAuthorize("hasAnyRole('FACULTY', 'STAFF', 'ADMIN', 'SECURITY_GUARD', 'GUARD')")
    @Operation(summary = "Get My Pending Visitor Requests", description = "Returns pending visitor requests addressed specifically to the authenticated faculty member")
    public ResponseEntity<ApiResponse<List<VisitorResponse>>> getMyPendingRequests(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<VisitorResponse> responses = visitorService.getMyPendingRequests(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/pending-tokens")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN', 'STAFF', 'FACULTY')")
    @Operation(summary = "Get Pending Digital Tokens", description = "Fetches all pending digital tokens awaiting guard approval")
    public ResponseEntity<ApiResponse<List<VisitorResponse>>> getPendingTokens() {
        List<VisitorResponse> responses = visitorService.getPendingTokens();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN', 'FACULTY', 'STAFF')")
    @Operation(summary = "Approve Digital Token", description = "Guard or Faculty approves visitor digital token and admits them to campus")
    public ResponseEntity<ApiResponse<VisitorResponse>> approveDigitalToken(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        VisitorResponse response = visitorService.approveToken(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Digital token approved and visitor admitted"));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN', 'FACULTY', 'STAFF')")
    @Operation(summary = "Reject Digital Token", description = "Guard or Faculty rejects visitor digital token pass")
    public ResponseEntity<ApiResponse<VisitorResponse>> rejectDigitalToken(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        VisitorResponse response = visitorService.rejectToken(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Digital token rejected"));
    }

    @PostMapping(value = "/register-with-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Register Visitor with Photo & Face Enrollment", description = "Saves visitor record, photo, and registers face embedding")
    public ResponseEntity<ApiResponse<VisitorResponse>> registerWithPhoto(
            @RequestPart(value = "photo", required = false) MultipartFile photo,
            @Valid @RequestPart("data") VisitorCheckInRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "visitor_portal";
        VisitorResponse response = visitorService.registerVisitorWithPhoto(photo, request, username);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Visitor registered and face enrolled successfully"));
    }

    @GetMapping("/lookup/mobile")
    @PreAuthorize("hasAnyRole('SECURITY_GUARD', 'GUARD', 'SECURITY_OFFICER', 'ADMIN', 'STAFF')")
    @Operation(summary = "Lookup Returning Visitor by Mobile", description = "Fetches previous visitor details by mobile number as fallback when face does not match")
    public ResponseEntity<ApiResponse<VisitorResponse>> lookupVisitorByMobile(@RequestParam("mobile") String mobile) {
        VisitorResponse response = visitorService.findLatestByMobile(mobile);
        return ResponseEntity.ok(ApiResponse.success(response, response != null ? "Visitor profile found" : "No previous record found"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_OFFICER', 'GUARD', 'SECURITY_GUARD')")
    @Operation(summary = "Delete Visitor Record", description = "Deletes visitor entry by ID")
    public ResponseEntity<ApiResponse<Void>> deleteVisitor(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        visitorService.deleteVisitor(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null, "Visitor deleted successfully"));
    }

    @PostMapping("/eod-closure")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_OFFICER', 'GUARD', 'SECURITY_GUARD')")
    @Operation(summary = "Trigger End-of-Day Closure", description = "Executes End-of-Day visitor closure sweep for active unclosed visits")
    public ResponseEntity<ApiResponse<Map<String, Object>>> triggerEodClosure() {
        int closedCount = endOfDayClosureService.triggerManualClosureNow();
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("closedCount", closedCount, "status", "EOD closure completed"),
                "End-of-day closure executed successfully: " + closedCount + " visits closed"
        ));
    }
}
