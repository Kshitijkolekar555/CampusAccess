package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.studentpass.*;
import com.pict.gatesecurity.entity.*;
import com.pict.gatesecurity.entity.enums.PassStatus;
import com.pict.gatesecurity.entity.enums.UserRole;
import com.pict.gatesecurity.exception.BadRequestException;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.mapper.StudentGatePassMapper;
import com.pict.gatesecurity.repository.GateRepository;
import com.pict.gatesecurity.repository.StudentGatePassRepository;
import com.pict.gatesecurity.repository.UserRepository;
import com.pict.gatesecurity.service.impl.StudentGatePassServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentGatePassServiceImplTest {

    @Mock private StudentGatePassRepository studentGatePassRepository;
    @Mock private GateRepository gateRepository;
    @Mock private UserRepository userRepository;
    @Mock private StudentGatePassMapper studentGatePassMapper;
    @Mock private AuditLogService auditLogService;
    @Mock private NotificationService notificationService;

    private StudentGatePassServiceImpl passService;

    private User testWarden;
    private Gate testGate;
    private StudentGatePass testPass;

    @BeforeEach
    void setUp() {
        passService = new StudentGatePassServiceImpl(
                studentGatePassRepository, userRepository, gateRepository,
                auditLogService, notificationService, studentGatePassMapper
        );

        testWarden = User.builder()
                .id(1L)
                .username("warden1")
                .fullName("Hostel Warden")
                .role(UserRole.HOSTEL_WARDEN)
                .active(true)
                .build();

        testGate = Gate.builder()
                .id(1L)
                .name("Main Gate")
                .active(true)
                .build();

        testPass = StudentGatePass.builder()
                .id(1L)
                .studentName("Test Student")
                .studentPrn("PICT2024001")
                .purpose("Emergency")
                .destination("Home")
                .departureTime(OffsetDateTime.now().plusHours(1))
                .expectedReturnTime(OffsetDateTime.now().plusHours(4))
                .status(PassStatus.PENDING)
                .createdBy(testWarden)
                .build();
    }

    @Test
    void createPass_shouldSucceed() {
        OffsetDateTime future = OffsetDateTime.now().plusHours(1);
        StudentGatePassRequest request = StudentGatePassRequest.builder()
                .studentName("Test Student")
                .studentPrn("pict2024001")
                .purpose("Emergency")
                .destination("Home")
                .departureTime(future)
                .expectedReturnTime(future.plusHours(3))
                .build();

        StudentGatePassResponse expectedResponse = StudentGatePassResponse.builder()
                .id(1L)
                .studentName("Test Student")
                .studentPrn("PICT2024001")
                .status(PassStatus.PENDING)
                .build();

        when(userRepository.findByUsername("warden1")).thenReturn(Optional.of(testWarden));
        when(studentGatePassRepository.save(any(StudentGatePass.class))).thenReturn(testPass);
        when(studentGatePassMapper.toResponse(testPass)).thenReturn(expectedResponse);

        StudentGatePassResponse response = passService.createPass(request, "warden1");

        assertNotNull(response);
        assertEquals("Test Student", response.getStudentName());
        assertEquals(PassStatus.PENDING, response.getStatus());
        verify(studentGatePassRepository).save(any(StudentGatePass.class));
    }

    @Test
    void createPass_shouldFailWhenDepartureInPast() {
        StudentGatePassRequest request = StudentGatePassRequest.builder()
                .studentName("Test")
                .studentPrn("PRN001")
                .purpose("Test")
                .destination("Home")
                .departureTime(OffsetDateTime.now().minusHours(1))
                .expectedReturnTime(OffsetDateTime.now().plusHours(2))
                .build();

        when(userRepository.findByUsername("warden1")).thenReturn(Optional.of(testWarden));

        assertThrows(BadRequestException.class, () -> passService.createPass(request, "warden1"));
    }

    @Test
    void approvePass_shouldSucceed() {
        StudentGatePassApprovalRequest request = StudentGatePassApprovalRequest.builder()
                .approved(true)
                .notes("Approved for emergency")
                .build();

        when(studentGatePassRepository.findById(1L)).thenReturn(Optional.of(testPass));
        when(userRepository.findByUsername("warden1")).thenReturn(Optional.of(testWarden));
        when(studentGatePassRepository.save(any(StudentGatePass.class))).thenReturn(testPass);
        when(studentGatePassMapper.toResponse(any())).thenReturn(StudentGatePassResponse.builder()
                .id(1L).status(PassStatus.APPROVED).build());

        StudentGatePassResponse response = passService.approvePass(1L, request, "warden1");

        assertNotNull(response);
        assertEquals(PassStatus.APPROVED, response.getStatus());
    }

    @Test
    void approvePass_shouldFailWhenNotPending() {
        testPass.setStatus(PassStatus.ACTIVE);
        StudentGatePassApprovalRequest request = StudentGatePassApprovalRequest.builder()
                .approved(true).build();

        when(studentGatePassRepository.findById(1L)).thenReturn(Optional.of(testPass));

        assertThrows(BadRequestException.class, () -> passService.approvePass(1L, request, "warden1"));
    }

    @Test
    void rejectPass_shouldSucceed() {
        StudentGatePassApprovalRequest request = StudentGatePassApprovalRequest.builder()
                .approved(false)
                .rejectionReason("Not authorized")
                .build();

        when(studentGatePassRepository.findById(1L)).thenReturn(Optional.of(testPass));
        when(userRepository.findByUsername("warden1")).thenReturn(Optional.of(testWarden));
        when(studentGatePassRepository.save(any(StudentGatePass.class))).thenReturn(testPass);
        when(studentGatePassMapper.toResponse(any())).thenReturn(StudentGatePassResponse.builder()
                .id(1L).status(PassStatus.REJECTED).build());

        StudentGatePassResponse response = passService.approvePass(1L, request, "warden1");

        assertNotNull(response);
        assertEquals(PassStatus.REJECTED, response.getStatus());
    }

    @Test
    void recordGateExit_shouldSucceed() {
        testPass.setStatus(PassStatus.APPROVED);

        when(studentGatePassRepository.findById(1L)).thenReturn(Optional.of(testPass));
        when(gateRepository.findById(1L)).thenReturn(Optional.of(testGate));
        when(userRepository.findByUsername("guard1")).thenReturn(Optional.of(TEST_USER_GUARD()));
        when(studentGatePassRepository.save(any(StudentGatePass.class))).thenReturn(testPass);
        when(studentGatePassMapper.toResponse(any())).thenReturn(StudentGatePassResponse.builder()
                .id(1L).status(PassStatus.ACTIVE).build());

        StudentGatePassResponse response = passService.recordGateExit(1L, 1L, "guard1");

        assertNotNull(response);
        assertEquals(PassStatus.ACTIVE, response.getStatus());
    }

    @Test
    void recordGateExit_shouldFailWhenNotApproved() {
        when(studentGatePassRepository.findById(1L)).thenReturn(Optional.of(testPass));

        assertThrows(BadRequestException.class, () -> passService.recordGateExit(1L, 1L, "guard1"));
    }

    @Test
    void recordGateEntry_shouldSucceed() {
        testPass.setStatus(PassStatus.ACTIVE);

        when(studentGatePassRepository.findById(1L)).thenReturn(Optional.of(testPass));
        when(userRepository.findByUsername("guard1")).thenReturn(Optional.of(TEST_USER_GUARD()));
        when(studentGatePassRepository.save(any(StudentGatePass.class))).thenReturn(testPass);
        when(studentGatePassMapper.toResponse(any())).thenReturn(StudentGatePassResponse.builder()
                .id(1L).status(PassStatus.COMPLETED).build());

        StudentGatePassResponse response = passService.recordGateEntry(1L, "guard1");

        assertNotNull(response);
        assertEquals(PassStatus.COMPLETED, response.getStatus());
    }

    @Test
    void recordGateEntry_shouldFailWhenNotActive() {
        when(studentGatePassRepository.findById(1L)).thenReturn(Optional.of(testPass));

        assertThrows(BadRequestException.class, () -> passService.recordGateEntry(1L, "guard1"));
    }

    @Test
    void getPassById_shouldSucceed() {
        when(studentGatePassRepository.findById(1L)).thenReturn(Optional.of(testPass));
        when(userRepository.findByUsername("guard1")).thenReturn(Optional.of(TEST_USER_GUARD()));
        when(studentGatePassMapper.toResponse(testPass)).thenReturn(StudentGatePassResponse.builder()
                .id(1L).studentName("Test Student").build());

        StudentGatePassResponse response = passService.getPassById(1L, "guard1");

        assertNotNull(response);
        assertEquals("Test Student", response.getStudentName());
    }

    @Test
    void getPassById_shouldFailWhenNotFound() {
        when(studentGatePassRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> passService.getPassById(99L, "guard1"));
    }

    private User TEST_USER_GUARD() {
        return User.builder()
                .id(2L)
                .username("guard1")
                .fullName("Security Guard")
                .role(UserRole.SECURITY_GUARD)
                .active(true)
                .build();
    }
}
