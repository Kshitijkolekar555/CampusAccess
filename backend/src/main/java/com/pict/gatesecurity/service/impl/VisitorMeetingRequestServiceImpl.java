package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.meeting.*;
import com.pict.gatesecurity.entity.*;
import com.pict.gatesecurity.entity.enums.*;
import com.pict.gatesecurity.exception.BadRequestException;
import com.pict.gatesecurity.exception.ForbiddenException;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.repository.*;
import com.pict.gatesecurity.service.FacultyAvailabilityService;
import com.pict.gatesecurity.service.NotificationService;
import com.pict.gatesecurity.service.VisitorMeetingRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VisitorMeetingRequestServiceImpl implements VisitorMeetingRequestService {

    private final VisitorMeetingRequestRepository meetingRequestRepository;
    private final MeetingResponseRepository meetingResponseRepository;
    private final VisitorRepository visitorRepository;
    private final UserRepository userRepository;
    private final GateRepository gateRepository;
    private final FacultyAvailabilityService facultyAvailabilityService;
    private final NotificationService notificationService;

    @Value("${app.faculty.block-on-unavailable:false}")
    private boolean blockOnUnavailable;

    @Override
    @Transactional
    public VisitorMeetingRequestResponse createRequest(VisitorMeetingRequestCreateRequest request, String performingUsername) {
        Visitor visitor = visitorRepository.findById(request.getVisitorId())
                .orElseThrow(() -> new ResourceNotFoundException("Visitor not found with id: " + request.getVisitorId()));

        Gate gate = gateRepository.findById(request.getGateId())
                .orElseThrow(() -> new ResourceNotFoundException("Gate not found with id: " + request.getGateId()));

        User faculty = null;
        if (request.getPurposeType() == PurposeType.MEET_FACULTY) {
            if (request.getFacultyId() == null) {
                throw new BadRequestException("Faculty selection is required when purpose is Meet Faculty");
            }
            faculty = userRepository.findById(request.getFacultyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + request.getFacultyId()));

            FacultyAvailabilityStatus status = facultyAvailabilityService.checkAvailabilityStatus(faculty.getId(), LocalDate.now());
            if (blockOnUnavailable && (status == FacultyAvailabilityStatus.FULL_DAY_LEAVE || status == FacultyAvailabilityStatus.OUT_OF_CAMPUS)) {
                throw new BadRequestException("This faculty member is currently unavailable (" + status + "). Submission is blocked by policy.");
            }
        }

        VisitorMeetingRequest meetingRequest = VisitorMeetingRequest.builder()
                .visitor(visitor)
                .purposeType(request.getPurposeType())
                .department(request.getDepartment())
                .faculty(faculty)
                .gate(gate)
                .requestTime(OffsetDateTime.now())
                .status(MeetingRequestStatus.PENDING)
                .build();

        VisitorMeetingRequest saved = meetingRequestRepository.save(meetingRequest);
        log.info("Created meeting request #{} for visitor {} by {}", saved.getId(), visitor.getName(), performingUsername);

        if (faculty != null) {
            try {
                notificationService.sendMeetingRequestToFaculty(faculty, visitor.getName(), visitor.getPurpose(), gate.getName(), saved.getId());
            } catch (Exception e) {
                log.warn("Failed to send notification to faculty: {}", e.getMessage());
            }
        }

        return toResponse(saved, null);
    }

    @Override
    @Transactional
    public VisitorMeetingRequestResponse approveMeeting(Long requestId, MeetingApprovalRequest request, String facultyUsername) {
        VisitorMeetingRequest meetingRequest = getRequestEntity(requestId);
        User actor = getUser(facultyUsername);

        validateFacultyOrAdmin(meetingRequest, actor);

        MeetingResponse response = MeetingResponse.builder()
                .meetingRequest(meetingRequest)
                .respondedBy(actor)
                .status(MeetingRequestStatus.APPROVED)
                .meetingLocation(request.getMeetingLocation())
                .building(request.getBuilding())
                .floor(request.getFloor())
                .roomNumber(request.getRoomNumber())
                .notes(request.getNotes())
                .respondedAt(OffsetDateTime.now())
                .build();

        MeetingResponse savedResponse = meetingResponseRepository.save(response);

        meetingRequest.setStatus(MeetingRequestStatus.APPROVED);
        meetingRequest.setUpdatedAt(OffsetDateTime.now());
        VisitorMeetingRequest updatedRequest = meetingRequestRepository.save(meetingRequest);

        try {
            if (meetingRequest.getFaculty() != null) {
                notificationService.sendMeetingApproved(meetingRequest.getFaculty(), meetingRequest.getVisitor().getName(),
                        request.getMeetingLocation(), requestId);
            }
        } catch (Exception e) {
            log.warn("Failed to send approval notification: {}", e.getMessage());
        }

        return toResponse(updatedRequest, savedResponse);
    }

    @Override
    @Transactional
    public VisitorMeetingRequestResponse rejectMeeting(Long requestId, MeetingRejectionRequest request, String facultyUsername) {
        VisitorMeetingRequest meetingRequest = getRequestEntity(requestId);
        User actor = getUser(facultyUsername);

        validateFacultyOrAdmin(meetingRequest, actor);

        MeetingResponse response = MeetingResponse.builder()
                .meetingRequest(meetingRequest)
                .respondedBy(actor)
                .status(MeetingRequestStatus.REJECTED)
                .rejectionReason(request.getReason())
                .respondedAt(OffsetDateTime.now())
                .build();

        MeetingResponse savedResponse = meetingResponseRepository.save(response);

        meetingRequest.setStatus(MeetingRequestStatus.REJECTED);
        meetingRequest.setUpdatedAt(OffsetDateTime.now());
        VisitorMeetingRequest updatedRequest = meetingRequestRepository.save(meetingRequest);

        try {
            if (meetingRequest.getFaculty() != null) {
                notificationService.sendMeetingRejected(meetingRequest.getFaculty(), meetingRequest.getVisitor().getName(),
                        request.getReason(), requestId);
            }
        } catch (Exception e) {
            log.warn("Failed to send rejection notification: {}", e.getMessage());
        }

        return toResponse(updatedRequest, savedResponse);
    }

    @Override
    @Transactional
    public VisitorMeetingRequestResponse rescheduleMeeting(Long requestId, MeetingRescheduleRequest request, String facultyUsername) {
        VisitorMeetingRequest meetingRequest = getRequestEntity(requestId);
        User actor = getUser(facultyUsername);

        validateFacultyOrAdmin(meetingRequest, actor);

        MeetingResponse response = MeetingResponse.builder()
                .meetingRequest(meetingRequest)
                .respondedBy(actor)
                .status(MeetingRequestStatus.RESCHEDULED)
                .suggestedDate(request.getSuggestedDate())
                .suggestedTime(request.getSuggestedTime())
                .rescheduleReason(request.getReason())
                .respondedAt(OffsetDateTime.now())
                .build();

        MeetingResponse savedResponse = meetingResponseRepository.save(response);

        meetingRequest.setStatus(MeetingRequestStatus.RESCHEDULED);
        meetingRequest.setUpdatedAt(OffsetDateTime.now());
        VisitorMeetingRequest updatedRequest = meetingRequestRepository.save(meetingRequest);

        try {
            if (meetingRequest.getFaculty() != null) {
                String suggestedTimeStr = request.getSuggestedDate() + " at " + request.getSuggestedTime();
                notificationService.sendMeetingRescheduled(meetingRequest.getFaculty(), meetingRequest.getVisitor().getName(),
                        suggestedTimeStr, requestId);
            }
        } catch (Exception e) {
            log.warn("Failed to send reschedule notification: {}", e.getMessage());
        }

        return toResponse(updatedRequest, savedResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VisitorMeetingRequestResponse> getPendingRequestsForFaculty(String facultyUsername, Pageable pageable) {
        User faculty = getUser(facultyUsername);
        return meetingRequestRepository
                .findByFacultyIdAndStatusAndDeletedAtIsNullOrderByRequestTimeDesc(faculty.getId(), MeetingRequestStatus.PENDING, pageable)
                .map(this::toResponseWithLatest);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VisitorMeetingRequestResponse> getAllRequestsForFaculty(String facultyUsername, Pageable pageable) {
        User faculty = getUser(facultyUsername);
        return meetingRequestRepository
                .findByFacultyIdAndDeletedAtIsNullOrderByRequestTimeDesc(faculty.getId(), pageable)
                .map(this::toResponseWithLatest);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VisitorMeetingRequestResponse> getRequestsByVisitorId(Long visitorId) {
        return meetingRequestRepository.findByVisitorIdAndDeletedAtIsNullOrderByRequestTimeDesc(visitorId)
                .stream().map(this::toResponseWithLatest).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VisitorMeetingRequestResponse> lookupByMobile(String mobile) {
        if (mobile == null || mobile.trim().isEmpty()) {
            throw new BadRequestException("Mobile number is required for lookup");
        }
        return meetingRequestRepository.findByVisitorMobile(mobile.trim())
                .stream().map(this::toResponseWithLatest).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public VisitorMeetingRequestResponse getRequestById(Long requestId) {
        return toResponseWithLatest(getRequestEntity(requestId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VisitorMeetingRequestResponse> getRequestsByGate(Long gateId, Pageable pageable) {
        return meetingRequestRepository.findByGateIdAndDeletedAtIsNullOrderByRequestTimeDesc(gateId, pageable)
                .map(this::toResponseWithLatest);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VisitorMeetingRequestResponse> getAllRequests(Pageable pageable) {
        return meetingRequestRepository.findAllByDeletedAtIsNullOrderByRequestTimeDesc(pageable)
                .map(this::toResponseWithLatest);
    }

    private VisitorMeetingRequest getRequestEntity(Long id) {
        return meetingRequestRepository.findById(id)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting request not found with id: " + id));
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
    }

    private void validateFacultyOrAdmin(VisitorMeetingRequest meetingRequest, User actor) {
        if (actor.getRole() == UserRole.ADMIN) {
            return;
        }
        if (meetingRequest.getFaculty() == null || !meetingRequest.getFaculty().getId().equals(actor.getId())) {
            throw new ForbiddenException("Only the assigned faculty member can respond to this meeting request");
        }
    }

    private VisitorMeetingRequestResponse toResponseWithLatest(VisitorMeetingRequest entity) {
        MeetingResponse latest = meetingResponseRepository.findFirstByMeetingRequestIdOrderByRespondedAtDesc(entity.getId())
                .orElse(null);
        return toResponse(entity, latest);
    }

    private VisitorMeetingRequestResponse toResponse(VisitorMeetingRequest entity, MeetingResponse response) {
        Visitor v = entity.getVisitor();
        User f = entity.getFaculty();
        Gate g = entity.getGate();

        MeetingResponseDto responseDto = null;
        if (response != null) {
            responseDto = MeetingResponseDto.builder()
                    .id(response.getId())
                    .status(response.getStatus())
                    .meetingLocation(response.getMeetingLocation())
                    .building(response.getBuilding())
                    .floor(response.getFloor())
                    .roomNumber(response.getRoomNumber())
                    .notes(response.getNotes())
                    .rejectionReason(response.getRejectionReason())
                    .suggestedDate(response.getSuggestedDate())
                    .suggestedTime(response.getSuggestedTime())
                    .rescheduleReason(response.getRescheduleReason())
                    .respondedById(response.getRespondedBy().getId())
                    .respondedByName(response.getRespondedBy().getFullName())
                    .respondedByUsername(response.getRespondedBy().getUsername())
                    .respondedAt(response.getRespondedAt())
                    .createdAt(response.getCreatedAt())
                    .build();
        }

        return VisitorMeetingRequestResponse.builder()
                .id(entity.getId())
                .visitorId(v.getId())
                .visitorName(v.getName())
                .visitorMobile(v.getMobile())
                .visitorPurpose(v.getPurpose())
                .visitorIdProofType(v.getIdProofType())
                .visitorIdProofNumber(v.getIdProofNumber())
                .visitorVehicleNumber(v.getVehicleNumber())
                .purposeType(entity.getPurposeType())
                .department(entity.getDepartment())
                .facultyId(f != null ? f.getId() : null)
                .facultyName(f != null ? f.getFullName() : null)
                .facultyUsername(f != null ? f.getUsername() : null)
                .gateId(g != null ? g.getId() : null)
                .gateName(g != null ? g.getName() : null)
                .requestTime(entity.getRequestTime())
                .status(entity.getStatus())
                .latestResponse(responseDto)
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
