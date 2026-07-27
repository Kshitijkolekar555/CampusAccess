package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.search.SearchFilterRequest;
import com.pict.gatesecurity.entity.*;
import com.pict.gatesecurity.entity.enums.*;
import com.pict.gatesecurity.repository.*;
import com.pict.gatesecurity.service.impl.SearchServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchServiceImplTest {

    @Mock private VisitorRepository visitorRepository;
    @Mock private VehicleLogRepository vehicleLogRepository;
    @Mock private StudentGatePassRepository studentGatePassRepository;
    @Mock private HostelOutpassRepository hostelOutpassRepository;
    @Mock private GuardRepository guardRepository;
    @Mock private VendorVisitRepository vendorVisitRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private ShiftRepository shiftRepository;
    @Mock private UserRepository userRepository;

    private SearchServiceImpl searchService;

    private User testUser;
    private Gate testGate;

    @BeforeEach
    void setUp() {
        searchService = new SearchServiceImpl(
                visitorRepository, vehicleLogRepository, studentGatePassRepository,
                hostelOutpassRepository, guardRepository, vendorVisitRepository,
                notificationRepository, auditLogRepository, shiftRepository, userRepository
        );

        testUser = User.builder()
                .id(1L).username("admin").fullName("Admin User").role(UserRole.ADMIN).active(true).build();

        testGate = Gate.builder()
                .id(1L).name("Main Gate").location("Front").active(true).build();
    }

    @Test
    void searchVisitors_withEmptyFilter_shouldReturnAll() {
        Visitor visitor = Visitor.builder()
                .id(1L).name("John Doe").mobile("9876543210").purpose("Meeting")
                .hostName("Prof. Smith").hostType(HostType.FACULTY)
                .hostDepartment(HostDepartment.IT).gate(testGate)
                .timeIn(OffsetDateTime.now().minusHours(2))
                .timeOut(OffsetDateTime.now().minusHours(1))
                .idProofType("AADHAR").idProofNumber("1234-5678-9012")
                .createdBy(testUser).build();

        Page<Visitor> page = new PageImpl<>(List.of(visitor), PageRequest.of(0, 20), 1);
        when(visitorRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        SearchFilterRequest filter = SearchFilterRequest.builder().build();
        Page<Object> result = searchService.searchVisitors(filter, PageRequest.of(0, 20));

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        verify(visitorRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void searchVisitors_withSearchText_shouldFilterByName() {
        Visitor visitor = Visitor.builder()
                .id(1L).name("John Doe").mobile("9876543210").purpose("Meeting")
                .hostName("Prof. Smith").hostType(HostType.FACULTY)
                .hostDepartment(HostDepartment.IT).gate(testGate)
                .timeIn(OffsetDateTime.now().minusHours(2))
                .idProofType("AADHAR").idProofNumber("1234-5678-9012")
                .createdBy(testUser).build();

        Page<Visitor> page = new PageImpl<>(List.of(visitor), PageRequest.of(0, 20), 1);
        when(visitorRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        SearchFilterRequest filter = SearchFilterRequest.builder().search("John").build();
        Page<Object> result = searchService.searchVisitors(filter, PageRequest.of(0, 20));

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
    }

    @Test
    void searchVisitors_withDateRangeAndGate_shouldFilter() {
        Page<Visitor> page = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
        when(visitorRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        SearchFilterRequest filter = SearchFilterRequest.builder()
                .fromDate(LocalDate.now().minusDays(7))
                .toDate(LocalDate.now())
                .gateId(1L)
                .build();

        Page<Object> result = searchService.searchVisitors(filter, PageRequest.of(0, 20));
        assertNotNull(result);
        assertEquals(0, result.getContent().size());
    }

    @Test
    void searchVisitors_withActiveInside_shouldFilterInsideVisitors() {
        Page<Visitor> page = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
        when(visitorRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        SearchFilterRequest filter = SearchFilterRequest.builder().activeInside(true).build();
        Page<Object> result = searchService.searchVisitors(filter, PageRequest.of(0, 20));
        assertNotNull(result);
    }

    @Test
    void searchVehicles_withCategory_shouldFilter() {
        Page<VehicleLog> page = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
        when(vehicleLogRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        SearchFilterRequest filter = SearchFilterRequest.builder()
                .vehicleCategory(VehicleCategory.STUDENT).build();

        Page<Object> result = searchService.searchVehicles(filter, PageRequest.of(0, 20));
        assertNotNull(result);
    }

    @Test
    void searchStudentGatePasses_withStatus_shouldFilter() {
        Page<StudentGatePass> page = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
        when(studentGatePassRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        SearchFilterRequest filter = SearchFilterRequest.builder()
                .passStatus(PassStatus.PENDING).build();

        Page<Object> result = searchService.searchStudentGatePasses(filter, PageRequest.of(0, 20));
        assertNotNull(result);
    }

    @Test
    void searchHostelOutpasses_withHostelAndStatus_shouldFilter() {
        Page<HostelOutpass> page = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
        when(hostelOutpassRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        SearchFilterRequest filter = SearchFilterRequest.builder()
                .hostel("Hostel-A")
                .outpassStatus(OutpassStatus.PENDING)
                .build();

        Page<Object> result = searchService.searchHostelOutpasses(filter, PageRequest.of(0, 20));
        assertNotNull(result);
    }

    @Test
    void searchGuards_withGateFilter_shouldFilter() {
        Page<Guard> page = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
        when(guardRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        SearchFilterRequest filter = SearchFilterRequest.builder().gateId(1L).build();
        Page<Object> result = searchService.searchGuards(filter, PageRequest.of(0, 20));
        assertNotNull(result);
    }

    @Test
    void searchVendors_withCompanyName_shouldFilter() {
        Page<VendorVisit> page = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
        when(vendorVisitRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        SearchFilterRequest filter = SearchFilterRequest.builder()
                .companyName("TechCorp").build();

        Page<Object> result = searchService.searchVendors(filter, PageRequest.of(0, 20));
        assertNotNull(result);
    }

    @Test
    void searchNotifications_withTypeAndStatus_shouldFilter() {
        Page<Notification> page = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
        when(notificationRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        SearchFilterRequest filter = SearchFilterRequest.builder()
                .notificationType(NotificationType.EMAIL)
                .notificationStatus(NotificationStatus.SENT)
                .build();

        Page<Object> result = searchService.searchNotifications(filter, PageRequest.of(0, 20));
        assertNotNull(result);
    }

    @Test
    void searchAuditLogs_withEntityTypeAndAction_shouldFilter() {
        Page<AuditLog> page = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
        when(auditLogRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        SearchFilterRequest filter = SearchFilterRequest.builder()
                .entityType("Visitor")
                .action("CREATE")
                .build();

        Page<Object> result = searchService.searchAuditLogs(filter, PageRequest.of(0, 20));
        assertNotNull(result);
    }

    @Test
    void searchShifts_withStatusAndGate_shouldFilter() {
        Page<Shift> page = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
        when(shiftRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        SearchFilterRequest filter = SearchFilterRequest.builder()
                .shiftStatus(ShiftStatus.ONGOING)
                .gateId(1L)
                .build();

        Page<Object> result = searchService.searchShifts(filter, PageRequest.of(0, 20));
        assertNotNull(result);
    }
}
