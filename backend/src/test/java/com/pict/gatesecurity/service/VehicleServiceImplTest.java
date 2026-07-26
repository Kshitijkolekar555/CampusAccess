package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.vehicle.*;
import com.pict.gatesecurity.entity.*;
import com.pict.gatesecurity.entity.enums.UserRole;
import com.pict.gatesecurity.entity.enums.VehicleCategory;
import com.pict.gatesecurity.exception.BadRequestException;
import com.pict.gatesecurity.exception.DuplicateResourceException;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.mapper.VehicleMapper;
import com.pict.gatesecurity.repository.GateRepository;
import com.pict.gatesecurity.repository.UserRepository;
import com.pict.gatesecurity.repository.VehicleLogRepository;
import com.pict.gatesecurity.repository.VehicleRepository;
import com.pict.gatesecurity.service.impl.VehicleServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VehicleServiceImplTest {

    @Mock private VehicleRepository vehicleRepository;
    @Mock private VehicleLogRepository vehicleLogRepository;
    @Mock private GateRepository gateRepository;
    @Mock private UserRepository userRepository;
    @Mock private VehicleMapper vehicleMapper;
    @Mock private AuditLogService auditLogService;

    private VehicleServiceImpl vehicleService;

    private User testUser;
    private Gate testGate;
    private Vehicle testVehicle;

    @BeforeEach
    void setUp() {
        vehicleService = new VehicleServiceImpl(
                vehicleRepository, vehicleLogRepository, gateRepository,
                userRepository, vehicleMapper, auditLogService
        );

        testUser = User.builder()
                .id(1L)
                .username("guard1")
                .fullName("Guard One")
                .role(UserRole.SECURITY_GUARD)
                .active(true)
                .build();

        testGate = Gate.builder()
                .id(1L)
                .name("Main Gate")
                .location("Main Entrance")
                .active(true)
                .build();

        testVehicle = Vehicle.builder()
                .id(1L)
                .registrationNumber("MH12AB1234")
                .vehicleType("Car")
                .category(VehicleCategory.STUDENT)
                .ownerName("Test Owner")
                .ownerContact("9876543210")
                .color("Red")
                .isBlacklisted(false)
                .createdBy(testUser)
                .build();
    }

    @Test
    void registerVehicle_shouldSucceed() {
        VehicleRegisterRequest request = VehicleRegisterRequest.builder()
                .registrationNumber("mh12ab1234")
                .vehicleType("Car")
                .category(VehicleCategory.STUDENT)
                .ownerName("Test Owner")
                .ownerContact("9876543210")
                .color("Red")
                .build();

        VehicleResponse expectedResponse = VehicleResponse.builder()
                .id(1L)
                .registrationNumber("MH12AB1234")
                .vehicleType("Car")
                .category(VehicleCategory.STUDENT)
                .ownerName("Test Owner")
                .build();

        when(vehicleRepository.existsByRegistrationNumber("MH12AB1234")).thenReturn(false);
        when(userRepository.findByUsername("guard1")).thenReturn(Optional.of(testUser));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(testVehicle);
        when(vehicleMapper.toResponse(testVehicle)).thenReturn(expectedResponse);

        VehicleResponse response = vehicleService.registerVehicle(request, "guard1");

        assertNotNull(response);
        assertEquals("MH12AB1234", response.getRegistrationNumber());
        verify(vehicleRepository).save(any(Vehicle.class));
        verify(auditLogService).logAction(any(), anyString(), anyString(), anyLong(), any(), any());
    }

    @Test
    void registerVehicle_shouldFailWhenDuplicate() {
        VehicleRegisterRequest request = VehicleRegisterRequest.builder()
                .registrationNumber("MH12AB1234")
                .category(VehicleCategory.STUDENT)
                .build();

        when(vehicleRepository.existsByRegistrationNumber("MH12AB1234")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> vehicleService.registerVehicle(request, "guard1"));
    }

    @Test
    void recordEntry_shouldSucceed() {
        VehicleEntryRequest request = VehicleEntryRequest.builder()
                .gateId(1L)
                .driverName("Test Driver")
                .driverContact("9876543210")
                .purpose("Class")
                .build();

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(testVehicle));
        when(gateRepository.findById(1L)).thenReturn(Optional.of(testGate));
        when(userRepository.findByUsername("guard1")).thenReturn(Optional.of(testUser));
        when(vehicleLogRepository.findActiveEntryByVehicleId(1L)).thenReturn(Optional.empty());
        when(vehicleLogRepository.save(any(VehicleLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(vehicleMapper.toLogResponse(any(VehicleLog.class))).thenReturn(VehicleLogResponse.builder()
                .vehicleId(1L)
                .registrationNumber("MH12AB1234")
                .gateId(1L)
                .gateName("Main Gate")
                .driverName("Test Driver")
                .build());

        VehicleLogResponse response = vehicleService.recordEntry(1L, request, "guard1");

        assertNotNull(response);
        assertEquals("MH12AB1234", response.getRegistrationNumber());
        assertEquals("Main Gate", response.getGateName());
        verify(vehicleLogRepository).save(any(VehicleLog.class));
    }

    @Test
    void recordEntry_shouldFailWhenVehicleBlacklisted() {
        testVehicle.setIsBlacklisted(true);
        VehicleEntryRequest request = VehicleEntryRequest.builder().gateId(1L).build();

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(testVehicle));

        assertThrows(BadRequestException.class, () -> vehicleService.recordEntry(1L, request, "guard1"));
    }

    @Test
    void recordEntry_shouldFailWhenAlreadyInside() {
        VehicleEntryRequest request = VehicleEntryRequest.builder().gateId(1L).build();

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(testVehicle));
        when(gateRepository.findById(1L)).thenReturn(Optional.of(testGate));
        when(userRepository.findByUsername("guard1")).thenReturn(Optional.of(testUser));
        when(vehicleLogRepository.findActiveEntryByVehicleId(1L)).thenReturn(Optional.of(VehicleLog.builder().id(5L).build()));

        assertThrows(BadRequestException.class, () -> vehicleService.recordEntry(1L, request, "guard1"));
    }

    @Test
    void recordExit_shouldSucceed() {
        VehicleLog vehicleLog = VehicleLog.builder()
                .id(1L)
                .vehicle(testVehicle)
                .gate(testGate)
                .entryTime(java.time.OffsetDateTime.now())
                .exitTime(null)
                .createdBy(testUser)
                .build();

        VehicleExitRequest request = VehicleExitRequest.builder()
                .exitNote("Exited safely")
                .build();

        when(vehicleLogRepository.findById(1L)).thenReturn(Optional.of(vehicleLog));
        when(userRepository.findByUsername("guard1")).thenReturn(Optional.of(testUser));
        when(vehicleLogRepository.save(any(VehicleLog.class))).thenReturn(vehicleLog);
        when(vehicleMapper.toLogResponse(any(VehicleLog.class))).thenReturn(VehicleLogResponse.builder()
                .id(1L)
                .vehicleId(1L)
                .exitTime(java.time.OffsetDateTime.now())
                .build());

        VehicleLogResponse response = vehicleService.recordExit(1L, request, "guard1");

        assertNotNull(response);
        verify(vehicleLogRepository).save(any(VehicleLog.class));
    }

    @Test
    void recordExit_shouldFailWhenAlreadyExited() {
        VehicleLog vehicleLog = VehicleLog.builder()
                .id(1L)
                .vehicle(testVehicle)
                .exitTime(java.time.OffsetDateTime.now())
                .build();

        when(vehicleLogRepository.findById(1L)).thenReturn(Optional.of(vehicleLog));

        assertThrows(BadRequestException.class, () -> vehicleService.recordExit(1L, VehicleExitRequest.builder().build(), "guard1"));
    }

    @Test
    void blacklistVehicle_shouldSucceed() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(testVehicle));
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(testUser));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(testVehicle);
        when(vehicleMapper.toResponse(any(Vehicle.class))).thenReturn(VehicleResponse.builder().id(1L).isBlacklisted(true).build());

        VehicleResponse response = vehicleService.blacklistVehicle(1L, "Stolen vehicle", "admin");

        assertNotNull(response);
        assertTrue(response.getIsBlacklisted());
        verify(vehicleRepository).save(any(Vehicle.class));
    }

    @Test
    void blacklistVehicle_shouldFailWhenAlreadyBlacklisted() {
        testVehicle.setIsBlacklisted(true);
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(testVehicle));

        assertThrows(BadRequestException.class, () -> vehicleService.blacklistVehicle(1L, "Reason", "admin"));
    }

    @Test
    void unblacklistVehicle_shouldSucceed() {
        testVehicle.setIsBlacklisted(true);
        testVehicle.setBlacklistReason("Stolen");

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(testVehicle));
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(testUser));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(testVehicle);
        when(vehicleMapper.toResponse(any(Vehicle.class))).thenReturn(VehicleResponse.builder().id(1L).isBlacklisted(false).build());

        VehicleResponse response = vehicleService.unblacklistVehicle(1L, "Recovered", "admin");

        assertNotNull(response);
        assertFalse(response.getIsBlacklisted());
    }

    @Test
    void unblacklistVehicle_shouldFailWhenNotBlacklisted() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(testVehicle));

        assertThrows(BadRequestException.class, () -> vehicleService.unblacklistVehicle(1L, "Reason", "admin"));
    }

    @Test
    void getVehicleById_shouldSucceed() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(testVehicle));
        when(vehicleMapper.toResponse(testVehicle)).thenReturn(VehicleResponse.builder().id(1L).registrationNumber("MH12AB1234").build());

        VehicleResponse response = vehicleService.getVehicleById(1L);

        assertNotNull(response);
        assertEquals("MH12AB1234", response.getRegistrationNumber());
    }

    @Test
    void getVehicleById_shouldFailWhenNotFound() {
        when(vehicleRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> vehicleService.getVehicleById(99L));
    }

    @Test
    void getVehicleByRegistrationNumber_shouldSucceed() {
        when(vehicleRepository.findByRegistrationNumber("MH12AB1234")).thenReturn(Optional.of(testVehicle));
        when(vehicleMapper.toResponse(testVehicle)).thenReturn(VehicleResponse.builder().id(1L).registrationNumber("MH12AB1234").build());

        VehicleResponse response = vehicleService.getVehicleByRegistrationNumber("mh12ab1234");

        assertNotNull(response);
        assertEquals("MH12AB1234", response.getRegistrationNumber());
    }
}
