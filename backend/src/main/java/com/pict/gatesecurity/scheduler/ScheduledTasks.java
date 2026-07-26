package com.pict.gatesecurity.scheduler;

import com.pict.gatesecurity.entity.enums.OutpassStatus;
import com.pict.gatesecurity.entity.enums.PassStatus;
import com.pict.gatesecurity.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledTasks {

    private final StudentGatePassRepository studentGatePassRepository;
    private final HostelOutpassRepository hostelOutpassRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @Scheduled(cron = "0 */5 * * * *")
    @Transactional
    public void expireOverdueGatePasses() {
        OffsetDateTime now = OffsetDateTime.now();
        int expired = studentGatePassRepository.findOverdueApprovedPasses(now).size();
        studentGatePassRepository.findOverdueApprovedPasses(now).forEach(pass -> {
            pass.setStatus(PassStatus.EXPIRED);
            studentGatePassRepository.save(pass);
        });
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

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional(readOnly = true)
    public void generateDailyOperationalSummary() {
        long activeGatePasses = studentGatePassRepository.count();
        long activeOutpasses = hostelOutpassRepository.count();
        log.info("Daily Summary — Total gate passes: {}, Total outpasses: {}", activeGatePasses, activeOutpasses);
    }
}
