package com.pict.gatesecurity.scheduler;

import com.pict.gatesecurity.entity.enums.NotificationStatus;
import com.pict.gatesecurity.entity.enums.OutpassStatus;
import com.pict.gatesecurity.entity.enums.PassStatus;
import com.pict.gatesecurity.repository.*;
import com.pict.gatesecurity.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledTasks {

    private final StudentGatePassRepository studentGatePassRepository;
    private final HostelOutpassRepository hostelOutpassRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final VisitorRepository visitorRepository;
    private final VehicleLogRepository vehicleLogRepository;
    private final VendorVisitRepository vendorVisitRepository;
    private final ShiftRepository shiftRepository;

    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void expireOverdueGatePasses() {
        OffsetDateTime now = OffsetDateTime.now();
        int expired = 0;
        for (var pass : studentGatePassRepository.findOverdueApprovedPasses(now)) {
            pass.setStatus(PassStatus.EXPIRED);
            studentGatePassRepository.save(pass);
            expired++;
        }
        if (expired > 0) {
            log.info("Expired {} overdue approved gate passes", expired);
        }
    }

    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void expireOverdueHostelOutpasses() {
        OffsetDateTime now = OffsetDateTime.now();
        int approved = 0;
        for (var outpass : hostelOutpassRepository.findOverdueApprovedOutpasses(now)) {
            outpass.setStatus(OutpassStatus.EXPIRED);
            hostelOutpassRepository.save(outpass);
            approved++;
        }
        int exited = 0;
        for (var outpass : hostelOutpassRepository.findOverdueExitedOutpasses(now)) {
            if (outpass.getExpectedReturnTime().plusHours(24).isBefore(now)) {
                outpass.setStatus(OutpassStatus.EXPIRED);
                hostelOutpassRepository.save(outpass);
                exited++;
            }
        }
        if (approved > 0 || exited > 0) {
            log.info("Expired {} approved + {} exited hostel outpasses", approved, exited);
        }
    }

    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupExpiredPasswordResetTokens() {
        OffsetDateTime now = OffsetDateTime.now();
        passwordResetTokenRepository.deleteByExpiresAtBefore(now);
        log.info("Cleaned up expired password reset tokens");
    }

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupExpiredRefreshTokens() {
        OffsetDateTime now = OffsetDateTime.now();
        refreshTokenRepository.deleteByExpiresAtBefore(now);
        log.info("Cleaned up expired refresh tokens");
    }

    @Scheduled(cron = "0 */15 * * * *")
    @Transactional
    public void retryFailedNotifications() {
        OffsetDateTime now = OffsetDateTime.now();
        var failedNotifications = notificationRepository.findByStatusAndRetryCountLessThan(
                NotificationStatus.FAILED, 3,
                org.springframework.data.domain.PageRequest.of(0, 50));

        int retried = 0;
        for (var notification : failedNotifications.getContent()) {
            try {
                notificationService.resendNotification(notification.getId());
                retried++;
            } catch (Exception e) {
                log.warn("Failed to retry notification {}: {}", notification.getId(), e.getMessage());
            }
        }
        if (retried > 0) {
            log.info("Retried {} failed notifications", retried);
        }
    }

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional(readOnly = true)
    public void generateDailyOperationalSummary() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime dayStart = now.toLocalDate().atStartOfDay().atOffset(now.getOffset());
        OffsetDateTime dayEnd = now.toLocalDate().atTime(23, 59, 59).atOffset(now.getOffset());

        long todayVisitors = visitorRepository.countByTimeInBetween(dayStart, dayEnd);
        long visitorsInside = visitorRepository.countByTimeOutIsNull();
        long todayVehicleEntries = vehicleLogRepository.countByEntryTimeBetween(dayStart, dayEnd);
        long vehiclesInside = vehicleLogRepository.countByExitTimeIsNull();
        long todayVendorVisits = vendorVisitRepository.countByEntryTimeBetween(dayStart, dayEnd);
        long vendorsInside = vendorVisitRepository.countByExitTimeIsNull();
        long activeShifts = shiftRepository.countByStatus(
                com.pict.gatesecurity.entity.enums.ShiftStatus.ONGOING);
        long todayGatePasses = studentGatePassRepository.countByCreatedAtBetween(dayStart, dayEnd);
        long todayOutpasses = hostelOutpassRepository.countByCreatedAtBetween(dayStart, dayEnd);
        long failedNotifications = notificationRepository.countByStatusAndCreatedAtBetween(
                NotificationStatus.FAILED, dayStart, dayEnd);

        log.info("=== Daily Summary ({}) ===", now.toLocalDate());
        log.info("  Visitors: {} checked-in, {} inside campus", todayVisitors, visitorsInside);
        log.info("  Vehicles: {} entered, {} inside campus", todayVehicleEntries, vehiclesInside);
        log.info("  Vendors: {} visited, {} inside campus", todayVendorVisits, vendorsInside);
        log.info("  Gate Passes: {} issued today", todayGatePasses);
        log.info("  Hostel Outpasses: {} issued today", todayOutpasses);
        log.info("  Active Shifts: {}", activeShifts);
        log.info("  Failed Notifications: {}", failedNotifications);
        log.info("=== End Summary ===");
    }
}
