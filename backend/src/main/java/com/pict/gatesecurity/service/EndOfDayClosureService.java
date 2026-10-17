package com.pict.gatesecurity.service;

import com.pict.gatesecurity.entity.Visitor;
import com.pict.gatesecurity.entity.enums.PassStatus;
import com.pict.gatesecurity.repository.VisitorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.List;
import java.util.Map;

/**
 * Service responsible for automatic End-of-Day (EOD) closure of unchecked-out visits.
 * Complies with Section 6 of the CampusAccess security specification:
 * - Timezone-aware (Asia/Kolkata default).
 * - Leaves time_out NULL (an administrative closure does NOT prove physical exit).
 * - Distinguishes AUTO_CLOSED_EOD from verified exits.
 * - Catch-up mechanism runs on startup to handle server downtime.
 * - Idempotent and safe against race conditions.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EndOfDayClosureService {

    private final VisitorRepository visitorRepository;
    private final AuditLogService auditLogService;

    @Value("${app.campus.timezone:Asia/Kolkata}")
    private String campusTimezone;

    @Value("${app.campus.closing-time:22:00:00}")
    private String closingTimeStr;

    /**
     * Scheduled nightly run at the configured campus closing time (default 22:00 IST).
     */
    @Scheduled(cron = "${app.campus.eod-cron:0 0 22 * * ?}", zone = "${app.campus.timezone:Asia/Kolkata}")
    public void scheduledEodClosure() {
        log.info("Starting scheduled End-of-Day (EOD) visitor closure sweep...");
        ZoneId zone = ZoneId.of(campusTimezone);
        LocalDate today = LocalDate.now(zone);
        LocalTime closingTime = LocalTime.parse(closingTimeStr);
        OffsetDateTime cutoff = ZonedDateTime.of(today, closingTime, zone).toOffsetDateTime();

        int closedCount = processClosures(cutoff, "END_OF_DAY_AUTO_CLOSURE", "SYSTEM_SCHEDULER");
        log.info("Scheduled EOD closure complete: {} eligible active visits closed safely.", closedCount);
    }

    /**
     * Catch-up mechanism on system startup.
     * Recovers from server downtime by closing any past unchecked-out visits whose cutoff has elapsed.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void catchUpEodClosureOnStartup() {
        try {
            ZoneId zone = ZoneId.of(campusTimezone);
            LocalDate today = LocalDate.now(zone);
            LocalTime closingTime = LocalTime.parse(closingTimeStr);
            OffsetDateTime cutoff = ZonedDateTime.of(today, closingTime, zone).toOffsetDateTime();

            // Catch-up closes any visits from prior days or before today's closing cutoff
            log.info("EOD Startup Catch-Up: Checking for unclosed visits prior to cutoff {} ({})", cutoff, campusTimezone);
            int closedCount = processClosures(cutoff, "CATCH_UP_EOD_CLOSURE", "SYSTEM_STARTUP_CATCHUP");
            if (closedCount > 0) {
                log.info("EOD Startup Catch-Up recovered {} unchecked-out visits from prior downtime.", closedCount);
            } else {
                log.info("EOD Startup Catch-Up complete: No past unclosed visits found.");
            }
        } catch (Exception e) {
            log.error("Failed during EOD startup catch-up execution: {}", e.getMessage(), e);
        }
    }

    /**
     * Executes idempotent closure on all eligible visits before cutoff.
     */
    @Transactional
    public int processClosures(OffsetDateTime cutoff, String reason, String actor) {
        List<Visitor> eligibleVisits = visitorRepository.findEligibleForEodClosure(cutoff);
        if (eligibleVisits.isEmpty()) {
            return 0;
        }

        int closedCount = 0;
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of(campusTimezone));

        for (Visitor visitor : eligibleVisits) {
            // Guard against concurrent checkouts: verify still unchecked out and active
            if (visitor.getTimeOut() != null || visitor.getStatus() == PassStatus.AUTO_CLOSED_EOD) {
                continue;
            }

            try {
                visitor.setStatus(PassStatus.AUTO_CLOSED_EOD);
                visitor.setClosedAt(now);
                visitor.setClosureReason(reason);
                visitor.setClosedBy(actor);
                // Note: visitor.timeOut intentionally remains NULL per requirements
                visitorRepository.save(visitor);

                auditLogService.logAction(
                        null,
                        "EOD_AUTO_CLOSURE",
                        "Visitor",
                        visitor.getId(),
                        null,
                        Map.of(
                                "visitorName", visitor.getName(),
                                "mobile", visitor.getMobile(),
                                "timeIn", visitor.getTimeIn().toString(),
                                "closedAt", now.toString(),
                                "reason", reason,
                                "closedBy", actor
                        )
                );
                closedCount++;
            } catch (Exception ex) {
                log.error("Failed to close visit ID {}: {}", visitor.getId(), ex.getMessage(), ex);
            }
        }

        return closedCount;
    }

    /**
     * Manual trigger for authorized security administrators / testing.
     */
    @Transactional
    public int triggerManualClosureNow() {
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of(campusTimezone));
        return processClosures(now, "MANUAL_EOD_CLOSURE", "SECURITY_ADMIN_TRIGGER");
    }
}
