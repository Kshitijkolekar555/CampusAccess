package com.pict.gatesecurity.controller;

import com.pict.gatesecurity.common.ApiResponse;
import com.pict.gatesecurity.common.PageResponse;
import com.pict.gatesecurity.dto.notification.NotificationResponse;
import com.pict.gatesecurity.entity.enums.NotificationEventType;
import com.pict.gatesecurity.entity.enums.NotificationStatus;
import com.pict.gatesecurity.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SECURITY_OFFICER', 'SECURITY_GUARD', 'GUARD', 'STAFF', 'HOSTEL_WARDEN', 'STUDENT', 'FACULTY')")
@Tag(name = "Notification Management", description = "View and manage notification history across campus roles")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/my")
    @Operation(summary = "Get My Notifications", description = "Fetches recent in-app notifications for authenticated user")
    public ResponseEntity<ApiResponse<java.util.List<NotificationResponse>>> getMyNotifications(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        java.util.List<NotificationResponse> list = notificationService.getMyNotifications(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping
    @Operation(summary = "List Notifications", description = "Paginated list with filtering by recipient, event type, status, and date range")
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> getNotifications(
            @RequestParam(required = false) String recipient,
            @RequestParam(required = false) NotificationEventType eventType,
            @RequestParam(required = false) NotificationStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<NotificationResponse> notifications = notificationService
                .getNotifications(recipient, eventType, status, dateFrom, dateTo, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(notifications)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Notification by ID", description = "Returns details of a specific notification")
    public ResponseEntity<ApiResponse<NotificationResponse>> getNotificationById(@PathVariable Long id) {
        NotificationResponse response = notificationService.getNotificationById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "List Notifications by Status", description = "Paginated list filtered by delivery status")
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> getNotificationsByStatus(
            @PathVariable NotificationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<NotificationResponse> notifications = notificationService
                .getNotifications(null, null, status, null, null, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(notifications)));
    }

    @PostMapping("/resend/{id}")
    @Operation(summary = "Resend Notification", description = "Resets and retries sending a failed notification")
    public ResponseEntity<ApiResponse<NotificationResponse>> resendNotification(@PathVariable Long id) {
        NotificationResponse response = notificationService.resendNotification(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Notification resend initiated"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Notification", description = "Permanently removes a notification record")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable Long id) {
        notificationService.getNotificationById(id);
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Notification deleted successfully"));
    }
}
