package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.vendor.*;
import com.pict.gatesecurity.entity.*;
import com.pict.gatesecurity.entity.enums.UserRole;
import com.pict.gatesecurity.exception.BadRequestException;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.mapper.VendorMapper;
import com.pict.gatesecurity.repository.GateRepository;
import com.pict.gatesecurity.repository.UserRepository;
import com.pict.gatesecurity.repository.VendorRepository;
import com.pict.gatesecurity.repository.VendorVisitRepository;
import com.pict.gatesecurity.service.impl.VendorServiceImpl;
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
class VendorServiceImplTest {

    @Mock private VendorRepository vendorRepository;
    @Mock private VendorVisitRepository vendorVisitRepository;
    @Mock private GateRepository gateRepository;
    @Mock private UserRepository userRepository;
    @Mock private VendorMapper vendorMapper;
    @Mock private AuditLogService auditLogService;

    private VendorServiceImpl vendorService;

    private User testUser;
    private Gate testGate;
    private Vendor testVendor;

    @BeforeEach
    void setUp() {
        vendorService = new VendorServiceImpl(
                vendorRepository, vendorVisitRepository, gateRepository,
                userRepository, vendorMapper, auditLogService
        );

        testUser = User.builder().id(1L).username("officer1").fullName("Officer").role(UserRole.SECURITY_OFFICER).active(true).build();
        testGate = Gate.builder().id(1L).name("Main Gate").active(true).build();
        testVendor = Vendor.builder()
                .id(1L).companyName("ABC Supplies").contactPerson("John Doe")
                .contactPhone("9876543210").isBlacklisted(false).createdBy(testUser).build();
    }

    @Test
    void registerVendor_shouldSucceed() {
        VendorRegisterRequest request = VendorRegisterRequest.builder()
                .companyName("ABC Supplies").contactPerson("John Doe").contactPhone("9876543210").build();

        when(userRepository.findByUsername("officer1")).thenReturn(Optional.of(testUser));
        when(vendorRepository.save(any(Vendor.class))).thenReturn(testVendor);
        when(vendorMapper.toResponse(testVendor)).thenReturn(VendorResponse.builder().id(1L).companyName("ABC Supplies").build());

        VendorResponse response = vendorService.registerVendor(request, "officer1");
        assertNotNull(response);
        assertEquals("ABC Supplies", response.getCompanyName());
    }

    @Test
    void recordEntry_shouldSucceed() {
        VendorVisitEntryRequest request = VendorVisitEntryRequest.builder().gateId(1L).purpose("Delivery").build();
        when(vendorRepository.findById(1L)).thenReturn(Optional.of(testVendor));
        when(vendorVisitRepository.findActiveVisitByVendorId(1L)).thenReturn(Optional.empty());
        when(gateRepository.findById(1L)).thenReturn(Optional.of(testGate));
        when(userRepository.findByUsername("guard1")).thenReturn(Optional.of(TEST_GUARD()));
        when(vendorVisitRepository.save(any(VendorVisit.class))).thenAnswer(i -> i.getArgument(0));
        when(vendorMapper.toVisitResponse(any())).thenReturn(VendorVisitResponse.builder().vendorId(1L).companyName("ABC Supplies").build());

        VendorVisitResponse response = vendorService.recordEntry(1L, request, "guard1");
        assertNotNull(response);
        assertEquals(1L, response.getVendorId());
    }

    @Test
    void recordEntry_shouldFailWhenBlacklisted() {
        testVendor.setIsBlacklisted(true);
        when(vendorRepository.findById(1L)).thenReturn(Optional.of(testVendor));
        assertThrows(BadRequestException.class, () -> vendorService.recordEntry(1L, new VendorVisitEntryRequest(), "guard1"));
    }

    @Test
    void recordEntry_shouldFailWhenAlreadyActive() {
        when(vendorRepository.findById(1L)).thenReturn(Optional.of(testVendor));
        when(vendorVisitRepository.findActiveVisitByVendorId(1L)).thenReturn(Optional.of(VendorVisit.builder().id(5L).build()));
        assertThrows(BadRequestException.class, () -> vendorService.recordEntry(1L, new VendorVisitEntryRequest(), "guard1"));
    }

    @Test
    void recordExit_shouldSucceed() {
        VendorVisit visit = VendorVisit.builder().id(1L).vendor(testVendor).gate(testGate).build();
        when(vendorVisitRepository.findById(1L)).thenReturn(Optional.of(visit));
        when(userRepository.findByUsername("guard1")).thenReturn(Optional.of(TEST_GUARD()));
        when(vendorVisitRepository.save(any(VendorVisit.class))).thenReturn(visit);
        when(vendorMapper.toVisitResponse(any())).thenReturn(VendorVisitResponse.builder().id(1L).build());

        VendorVisitResponse response = vendorService.recordExit(1L, new VendorVisitExitRequest(), "guard1");
        assertNotNull(response);
    }

    @Test
    void recordExit_shouldFailWhenAlreadyExited() {
        VendorVisit visit = VendorVisit.builder().id(1L).exitTime(java.time.OffsetDateTime.now()).build();
        when(vendorVisitRepository.findById(1L)).thenReturn(Optional.of(visit));
        assertThrows(BadRequestException.class, () -> vendorService.recordExit(1L, new VendorVisitExitRequest(), "guard1"));
    }

    @Test
    void blacklistVendor_shouldSucceed() {
        when(vendorRepository.findById(1L)).thenReturn(Optional.of(testVendor));
        when(userRepository.findByUsername("officer1")).thenReturn(Optional.of(testUser));
        when(vendorRepository.save(any(Vendor.class))).thenReturn(testVendor);
        when(vendorMapper.toResponse(any())).thenReturn(VendorResponse.builder().id(1L).isBlacklisted(true).build());

        VendorResponse response = vendorService.blacklistVendor(1L, "Non-compliance", "officer1");
        assertTrue(response.getIsBlacklisted());
    }

    @Test
    void getVendorById_shouldFailWhenNotFound() {
        when(vendorRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> vendorService.getVendorById(99L));
    }

    private User TEST_GUARD() {
        return User.builder().id(2L).username("guard1").fullName("Guard").role(UserRole.SECURITY_GUARD).active(true).build();
    }
}
