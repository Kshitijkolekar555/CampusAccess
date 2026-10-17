package com.pict.gatesecurity.service;

import com.pict.gatesecurity.entity.Visitor;
import com.pict.gatesecurity.entity.enums.PassStatus;
import com.pict.gatesecurity.repository.VisitorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EndOfDayClosureServiceTest {

    @Mock
    private VisitorRepository visitorRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private EndOfDayClosureService endOfDayClosureService;

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(endOfDayClosureService, "campusTimezone", "Asia/Kolkata");
        ReflectionTestUtils.setField(endOfDayClosureService, "closingTimeStr", "22:00:00");
    }

    @Test
    @DisplayName("Scenario 1: Visitor unchecked out before closing is automatically closed with time_out left null")
    void testUncheckedOutVisitorIsAutoClosedSafely() {
        OffsetDateTime checkInTime = OffsetDateTime.now(IST).minusHours(5);
        Visitor visitor = Visitor.builder()
                .id(101L)
                .name("Unchecked Out Guest")
                .mobile("9876543210")
                .status(PassStatus.APPROVED)
                .timeIn(checkInTime)
                .timeOut(null) // Unchecked out
                .build();

        OffsetDateTime cutoff = OffsetDateTime.now(IST);
        when(visitorRepository.findEligibleForEodClosure(cutoff)).thenReturn(List.of(visitor));

        int closedCount = endOfDayClosureService.processClosures(cutoff, "END_OF_DAY_AUTO_CLOSURE", "SYSTEM_SCHEDULER");

        assertEquals(1, closedCount);
        assertEquals(PassStatus.AUTO_CLOSED_EOD, visitor.getStatus());
        assertNotNull(visitor.getClosedAt(), "closed_at must be populated with processing timestamp");
        assertEquals("END_OF_DAY_AUTO_CLOSURE", visitor.getClosureReason());
        assertEquals("SYSTEM_SCHEDULER", visitor.getClosedBy());
        assertNull(visitor.getTimeOut(), "time_out MUST remain null because physical exit was not verified!");
        verify(visitorRepository, times(1)).save(visitor);
    }

    @Test
    @DisplayName("Scenario 2: Already closed or checked-out visit is idempotent and skipped without re-closing")
    void testIdempotencySkippedAlreadyClosedOrExited() {
        Visitor alreadyClosed = Visitor.builder()
                .id(102L)
                .name("Already Closed")
                .mobile("9876543211")
                .status(PassStatus.AUTO_CLOSED_EOD)
                .timeIn(OffsetDateTime.now(IST).minusHours(6))
                .timeOut(null)
                .build();

        Visitor physicallyExited = Visitor.builder()
                .id(103L)
                .name("Exited Visitor")
                .mobile("9876543212")
                .status(PassStatus.COMPLETED)
                .timeIn(OffsetDateTime.now(IST).minusHours(7))
                .timeOut(OffsetDateTime.now(IST).minusHours(1))
                .build();

        OffsetDateTime cutoff = OffsetDateTime.now(IST);
        when(visitorRepository.findEligibleForEodClosure(cutoff)).thenReturn(List.of(alreadyClosed, physicallyExited));

        int closedCount = endOfDayClosureService.processClosures(cutoff, "END_OF_DAY_AUTO_CLOSURE", "SYSTEM_SCHEDULER");

        assertEquals(0, closedCount, "Idempotent: No already closed or exited records should be updated");
        verify(visitorRepository, never()).save(any(Visitor.class));
    }
}
