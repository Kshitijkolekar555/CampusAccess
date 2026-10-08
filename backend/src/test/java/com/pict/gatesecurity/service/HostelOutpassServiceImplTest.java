package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.outpass.*;
import com.pict.gatesecurity.entity.*;
import com.pict.gatesecurity.entity.enums.OutpassStatus;
import com.pict.gatesecurity.entity.enums.UserRole;
import com.pict.gatesecurity.exception.BadRequestException;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.mapper.HostelOutpassMapper;
import com.pict.gatesecurity.repository.GateRepository;
import com.pict.gatesecurity.repository.HostelOutpassRepository;
import com.pict.gatesecurity.repository.UserRepository;
import com.pict.gatesecurity.service.impl.HostelOutpassServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HostelOutpassServiceImplTest {

    @Mock private HostelOutpassRepository hostelOutpassRepository;
    @Mock private GateRepository gateRepository;
    @Mock private UserRepository userRepository;
    @Mock private HostelOutpassMapper hostelOutpassMapper;
    @Mock private AuditLogService auditLogService;
    @Mock private NotificationService notificationService;

    private HostelOutpassServiceImpl outpassService;

    private User testWarden;
    private User testGuard;
    private Gate testGate;
    private HostelOutpass testOutpass;

    @BeforeEach
    void setUp() {
        outpassService = new HostelOutpassServiceImpl(
                hostelOutpassRepository, userRepository, gateRepository,
                auditLogService, notificationService, hostelOutpassMapper
        );

        testWarden = User.builder().id(1L).username("warden1").fullName("Hostel Warden").role(UserRole.HOSTEL_WARDEN).active(true).build();
        testGuard = User.builder().id(2L).username("guard1").fullName("Security Guard").role(UserRole.SECURITY_GUARD).active(true).build();
        testGate = Gate.builder().id(1L).name("Main Gate").active(true).build();

        testOutpass = HostelOutpass.builder()
                .id(1L)
                .studentName("Test Student")
                .studentPrn("PICT2024001")
                .reason("Family emergency")
                .destination("Home")
                .departureTime(OffsetDateTime.now().plusHours(1))
                .expectedReturnTime(OffsetDateTime.now().plusHours(4))
                .status(OutpassStatus.PENDING)
                .isLateReturn(false)
                .createdBy(testWarden)
                .build();
    }

    @Test
    void createOutpass_shouldSucceed() {
        OffsetDateTime future = OffsetDateTime.now().plusHours(1);
        HostelOutpassRequest request = HostelOutpassRequest.builder()
                .studentName("Test Student")
                .studentPrn("pict2024001")
                .reason("Family emergency")
                .destination("Home")
                .departureTime(future)
                .expectedReturnTime(future.plusHours(3))
                .build();

        when(userRepository.findByUsername("warden1")).thenReturn(Optional.of(testWarden));
        when(hostelOutpassRepository.findByStudentPrnAndStatusIn(anyString(), any())).thenReturn(List.of());
        when(hostelOutpassRepository.save(any(HostelOutpass.class))).thenReturn(testOutpass);
        when(hostelOutpassMapper.toResponse(testOutpass)).thenReturn(HostelOutpassResponse.builder()
                .id(1L).studentName("Test Student").status(OutpassStatus.PENDING).build());

        HostelOutpassResponse response = outpassService.createOutpass(request, "warden1");

        assertNotNull(response);
        assertEquals("Test Student", response.getStudentName());
        assertEquals(OutpassStatus.PENDING, response.getStatus());
    }

    @Test
    void createOutpass_shouldFailWhenActiveOutpassExists() {
        HostelOutpassRequest request = HostelOutpassRequest.builder()
                .studentName("Test")
                .studentPrn("PICT2024001")
                .reason("Reason")
                .destination("Home")
                .departureTime(OffsetDateTime.now().plusHours(1))
                .expectedReturnTime(OffsetDateTime.now().plusHours(4))
                .build();

        when(userRepository.findByUsername("warden1")).thenReturn(Optional.of(testWarden));
        when(hostelOutpassRepository.findByStudentPrnAndStatusIn(anyString(), any())).thenReturn(List.of(testOutpass));

        assertThrows(BadRequestException.class, () -> outpassService.createOutpass(request, "warden1"));
    }

    @Test
    void approveOutpass_shouldSucceed() {
        HostelOutpassApprovalRequest request = HostelOutpassApprovalRequest.builder()
                .approved(true).wardenRemarks("Approved").build();

        when(hostelOutpassRepository.findById(1L)).thenReturn(Optional.of(testOutpass));
        when(userRepository.findByUsername("warden1")).thenReturn(Optional.of(testWarden));
        when(hostelOutpassRepository.save(any(HostelOutpass.class))).thenReturn(testOutpass);
        when(hostelOutpassMapper.toResponse(any())).thenReturn(HostelOutpassResponse.builder().id(1L).status(OutpassStatus.APPROVED).build());

        HostelOutpassResponse response = outpassService.approveOutpass(1L, request, "warden1");

        assertEquals(OutpassStatus.APPROVED, response.getStatus());
    }

    @Test
    void rejectOutpass_shouldSucceed() {
        HostelOutpassApprovalRequest request = HostelOutpassApprovalRequest.builder()
                .approved(false).rejectionReason("Not allowed").build();

        when(hostelOutpassRepository.findById(1L)).thenReturn(Optional.of(testOutpass));
        when(userRepository.findByUsername("warden1")).thenReturn(Optional.of(testWarden));
        when(hostelOutpassRepository.save(any(HostelOutpass.class))).thenReturn(testOutpass);
        when(hostelOutpassMapper.toResponse(any())).thenReturn(HostelOutpassResponse.builder().id(1L).status(OutpassStatus.REJECTED).build());

        HostelOutpassResponse response = outpassService.approveOutpass(1L, request, "warden1");

        assertEquals(OutpassStatus.REJECTED, response.getStatus());
    }

    @Test
    void recordGateExit_shouldSucceed() {
        testOutpass.setStatus(OutpassStatus.APPROVED);

        when(hostelOutpassRepository.findById(1L)).thenReturn(Optional.of(testOutpass));
        when(gateRepository.findById(1L)).thenReturn(Optional.of(testGate));
        when(userRepository.findByUsername("guard1")).thenReturn(Optional.of(testGuard));
        when(hostelOutpassRepository.save(any(HostelOutpass.class))).thenReturn(testOutpass);
        when(hostelOutpassMapper.toResponse(any())).thenReturn(HostelOutpassResponse.builder().id(1L).status(OutpassStatus.EXITED).build());

        HostelOutpassResponse response = outpassService.recordGateExit(1L, 1L, "guard1");

        assertEquals(OutpassStatus.EXITED, response.getStatus());
    }

    @Test
    void recordGateEntry_shouldSucceed() {
        testOutpass.setStatus(OutpassStatus.EXITED);

        when(hostelOutpassRepository.findById(1L)).thenReturn(Optional.of(testOutpass));
        when(userRepository.findByUsername("guard1")).thenReturn(Optional.of(testGuard));
        when(hostelOutpassRepository.save(any(HostelOutpass.class))).thenReturn(testOutpass);
        when(hostelOutpassMapper.toResponse(any())).thenReturn(HostelOutpassResponse.builder().id(1L).status(OutpassStatus.RETURNED).isLateReturn(false).build());

        HostelOutpassResponse response = outpassService.recordGateEntry(1L, "guard1");

        assertEquals(OutpassStatus.RETURNED, response.getStatus());
    }

    @Test
    void recordGateEntry_shouldDetectLateReturn() {
        testOutpass.setStatus(OutpassStatus.EXITED);
        testOutpass.setExpectedReturnTime(OffsetDateTime.now().minusHours(1));

        when(hostelOutpassRepository.findById(1L)).thenReturn(Optional.of(testOutpass));
        when(userRepository.findByUsername("guard1")).thenReturn(Optional.of(testGuard));
        when(hostelOutpassRepository.save(any(HostelOutpass.class))).thenReturn(testOutpass);
        when(hostelOutpassMapper.toResponse(any())).thenReturn(HostelOutpassResponse.builder().id(1L).status(OutpassStatus.RETURNED).isLateReturn(true).build());

        HostelOutpassResponse response = outpassService.recordGateEntry(1L, "guard1");

        assertEquals(OutpassStatus.RETURNED, response.getStatus());
    }

    @Test
    void getOutpassById_shouldFailWhenNotFound() {
        when(hostelOutpassRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> outpassService.getOutpassById(99L, "warden1"));
    }
}
