package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.meeting.*;
import com.pict.gatesecurity.entity.*;
import com.pict.gatesecurity.entity.enums.*;
import com.pict.gatesecurity.exception.ForbiddenException;
import com.pict.gatesecurity.repository.*;
import com.pict.gatesecurity.service.impl.VisitorMeetingRequestServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VisitorMeetingRequestServiceImplTest {

    @Mock private VisitorMeetingRequestRepository meetingRequestRepository;
    @Mock private MeetingResponseRepository meetingResponseRepository;
    @Mock private VisitorRepository visitorRepository;
    @Mock private UserRepository userRepository;
    @Mock private GateRepository gateRepository;
    @Mock private FacultyAvailabilityService facultyAvailabilityService;
    @Mock private NotificationService notificationService;

    private VisitorMeetingRequestServiceImpl meetingRequestService;

    private Visitor visitor;
    private Gate gate;
    private User faculty;
    private User otherFaculty;
    private VisitorMeetingRequest meetingRequest;

    @BeforeEach
    void setUp() {
        meetingRequestService = new VisitorMeetingRequestServiceImpl(
                meetingRequestRepository, meetingResponseRepository,
                visitorRepository, userRepository, gateRepository,
                facultyAvailabilityService, notificationService
        );

        gate = Gate.builder().id(1L).name("Gate 1 - Main Entrance").build();

        visitor = Visitor.builder()
                .id(100L)
                .name("Amit Patil")
                .mobile("9876543210")
                .purpose("Academic Discussion")
                .hostName("Dr. Sharma")
                .hostType(HostType.FACULTY)
                .hostDepartment(HostDepartment.CE)
                .gate(gate)
                .timeIn(OffsetDateTime.now())
                .idProofType("Aadhaar")
                .idProofNumber("123456789012")
                .build();

        faculty = User.builder()
                .id(10L)
                .username("faculty_ce")
                .fullName("Dr. Sharma")
                .role(UserRole.FACULTY)
                .email("sharma@pict.edu")
                .department(HostDepartment.CE)
                .active(true)
                .build();

        otherFaculty = User.builder()
                .id(11L)
                .username("faculty_it")
                .fullName("Prof. Verma")
                .role(UserRole.FACULTY)
                .email("verma@pict.edu")
                .active(true)
                .build();

        meetingRequest = VisitorMeetingRequest.builder()
                .id(500L)
                .visitor(visitor)
                .purposeType(PurposeType.MEET_FACULTY)
                .department(HostDepartment.CE)
                .faculty(faculty)
                .gate(gate)
                .requestTime(OffsetDateTime.now())
                .status(MeetingRequestStatus.PENDING)
                .build();
    }

    @Test
    void testCreateRequest_Success() {
        VisitorMeetingRequestCreateRequest req = VisitorMeetingRequestCreateRequest.builder()
                .visitorId(100L)
                .purposeType(PurposeType.MEET_FACULTY)
                .department(HostDepartment.CE)
                .facultyId(10L)
                .gateId(1L)
                .build();

        when(visitorRepository.findById(100L)).thenReturn(Optional.of(visitor));
        when(gateRepository.findById(1L)).thenReturn(Optional.of(gate));
        when(userRepository.findById(10L)).thenReturn(Optional.of(faculty));
        when(facultyAvailabilityService.checkAvailabilityStatus(eq(10L), any(LocalDate.class)))
                .thenReturn(FacultyAvailabilityStatus.AVAILABLE);
        when(meetingRequestRepository.save(any(VisitorMeetingRequest.class))).thenReturn(meetingRequest);

        VisitorMeetingRequestResponse response = meetingRequestService.createRequest(req, "guard1");

        assertNotNull(response);
        assertEquals(MeetingRequestStatus.PENDING, response.getStatus());
        assertEquals("Amit Patil", response.getVisitorName());
        assertEquals("Dr. Sharma", response.getFacultyName());
        verify(notificationService, times(1)).sendMeetingRequestToFaculty(any(), any(), any(), any(), any());
    }

    @Test
    void testApproveMeeting_Success() {
        MeetingApprovalRequest approval = MeetingApprovalRequest.builder()
                .meetingLocation("Department Building - Room 302")
                .building("Main Academic Block")
                .floor("3rd Floor")
                .roomNumber("302")
                .notes("Please wait in the reception")
                .build();

        when(meetingRequestRepository.findById(500L)).thenReturn(Optional.of(meetingRequest));
        when(userRepository.findByUsername("faculty_ce")).thenReturn(Optional.of(faculty));

        MeetingResponse meetingResponse = MeetingResponse.builder()
                .id(1L)
                .meetingRequest(meetingRequest)
                .respondedBy(faculty)
                .status(MeetingRequestStatus.APPROVED)
                .meetingLocation(approval.getMeetingLocation())
                .building(approval.getBuilding())
                .floor(approval.getFloor())
                .roomNumber(approval.getRoomNumber())
                .notes(approval.getNotes())
                .respondedAt(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .build();
        when(meetingResponseRepository.save(any(MeetingResponse.class))).thenReturn(meetingResponse);
        when(meetingRequestRepository.save(any(VisitorMeetingRequest.class))).thenReturn(meetingRequest);

        VisitorMeetingRequestResponse response = meetingRequestService.approveMeeting(500L, approval, "faculty_ce");

        assertNotNull(response);
        assertEquals(MeetingRequestStatus.APPROVED, response.getStatus());
        verify(notificationService, times(1)).sendMeetingApproved(eq(faculty), eq("Amit Patil"), eq(approval.getMeetingLocation()), eq(500L));
    }

    @Test
    void testApproveMeeting_ForbiddenForUnauthorizedUser() {
        MeetingApprovalRequest approval = MeetingApprovalRequest.builder()
                .meetingLocation("Room 101")
                .build();

        when(meetingRequestRepository.findById(500L)).thenReturn(Optional.of(meetingRequest));
        when(userRepository.findByUsername("faculty_it")).thenReturn(Optional.of(otherFaculty));

        assertThrows(ForbiddenException.class, () ->
                meetingRequestService.approveMeeting(500L, approval, "faculty_it"));

        verify(meetingResponseRepository, never()).save(any());
    }

    @Test
    void testRejectMeeting_Success() {
        MeetingRejectionRequest rej = MeetingRejectionRequest.builder()
                .reason("Faculty has an urgent meeting")
                .build();

        when(meetingRequestRepository.findById(500L)).thenReturn(Optional.of(meetingRequest));
        when(userRepository.findByUsername("faculty_ce")).thenReturn(Optional.of(faculty));

        MeetingResponse meetingResponse = MeetingResponse.builder()
                .id(2L)
                .meetingRequest(meetingRequest)
                .respondedBy(faculty)
                .status(MeetingRequestStatus.REJECTED)
                .rejectionReason(rej.getReason())
                .respondedAt(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .build();
        when(meetingResponseRepository.save(any(MeetingResponse.class))).thenReturn(meetingResponse);
        when(meetingRequestRepository.save(any(VisitorMeetingRequest.class))).thenReturn(meetingRequest);

        VisitorMeetingRequestResponse response = meetingRequestService.rejectMeeting(500L, rej, "faculty_ce");

        assertNotNull(response);
        assertEquals(MeetingRequestStatus.REJECTED, response.getStatus());
        verify(notificationService, times(1)).sendMeetingRejected(eq(faculty), eq("Amit Patil"), eq(rej.getReason()), eq(500L));
    }

    @Test
    void testRescheduleMeeting_Success() {
        MeetingRescheduleRequest resched = MeetingRescheduleRequest.builder()
                .suggestedDate(LocalDate.now().plusDays(1))
                .suggestedTime(LocalTime.of(14, 30))
                .reason("Available tomorrow afternoon")
                .build();

        when(meetingRequestRepository.findById(500L)).thenReturn(Optional.of(meetingRequest));
        when(userRepository.findByUsername("faculty_ce")).thenReturn(Optional.of(faculty));

        MeetingResponse meetingResponse = MeetingResponse.builder()
                .id(3L)
                .meetingRequest(meetingRequest)
                .respondedBy(faculty)
                .status(MeetingRequestStatus.RESCHEDULED)
                .suggestedDate(resched.getSuggestedDate())
                .suggestedTime(resched.getSuggestedTime())
                .rescheduleReason(resched.getReason())
                .respondedAt(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .build();
        when(meetingResponseRepository.save(any(MeetingResponse.class))).thenReturn(meetingResponse);
        when(meetingRequestRepository.save(any(VisitorMeetingRequest.class))).thenReturn(meetingRequest);

        VisitorMeetingRequestResponse response = meetingRequestService.rescheduleMeeting(500L, resched, "faculty_ce");

        assertNotNull(response);
        assertEquals(MeetingRequestStatus.RESCHEDULED, response.getStatus());
        verify(notificationService, times(1)).sendMeetingRescheduled(eq(faculty), any(), any(), eq(500L));
    }

    @Test
    void testLookupByMobile_Success() {
        when(meetingRequestRepository.findByVisitorMobile("9876543210"))
                .thenReturn(List.of(meetingRequest));

        List<VisitorMeetingRequestResponse> results = meetingRequestService.lookupByMobile("9876543210");

        assertEquals(1, results.size());
        assertEquals("Amit Patil", results.get(0).getVisitorName());
    }
}
