package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.outpass.*;
import com.pict.gatesecurity.entity.*;
import com.pict.gatesecurity.entity.enums.OutpassStatus;
import com.pict.gatesecurity.entity.enums.UserRole;
import com.pict.gatesecurity.exception.BadRequestException;
import com.pict.gatesecurity.exception.ForbiddenException;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.mapper.HostelOutpassMapper;
import com.pict.gatesecurity.repository.*;
import com.pict.gatesecurity.service.AuditLogService;
import com.pict.gatesecurity.service.HostelOutpassService;
import com.pict.gatesecurity.service.NotificationService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class HostelOutpassServiceImpl implements HostelOutpassService {

    private final HostelOutpassRepository hostelOutpassRepository;
    private final UserRepository userRepository;
    private final GateRepository gateRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final HostelOutpassMapper hostelOutpassMapper;

    @Override
    @Transactional
    public HostelOutpassResponse createOutpass(HostelOutpassRequest request, String performingUsername) {
        User createdBy = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        if (createdBy.getRole() == UserRole.STUDENT && !Boolean.TRUE.equals(createdBy.getIsLateComerPermitted())) {
            throw new BadRequestException("Student is not eligible for hostel outpass creation. Permitted category required.");
        }

        if (request.getDepartureTime().isBefore(OffsetDateTime.now().minusMinutes(15))) {
            throw new BadRequestException("Departure time cannot be in the past");
        }

        if (request.getExpectedReturnTime().isBefore(request.getDepartureTime())) {
            throw new BadRequestException("Expected return time must be after departure time");
        }

        String prn = (createdBy.getRole() == UserRole.STUDENT) ? createdBy.getUsername().toUpperCase() : request.getStudentPrn().toUpperCase();

        List<OutpassStatus> activeStatuses = List.of(OutpassStatus.PENDING, OutpassStatus.APPROVED, OutpassStatus.EXITED);
        List<HostelOutpass> active = hostelOutpassRepository.findByStudentPrnAndStatusIn(prn, activeStatuses);
        if (!active.isEmpty()) {
            throw new BadRequestException("Student already has an active outpass (ID: " + active.get(0).getId() + ", Status: " + active.get(0).getStatus() + ")");
        }

        User studentUser = (createdBy.getRole() == UserRole.STUDENT) ? createdBy : null;
        if (studentUser == null && request.getStudentUserId() != null) {
            studentUser = userRepository.findById(request.getStudentUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getStudentUserId()));
        }

        HostelOutpass outpass = HostelOutpass.builder()
                .studentUser(studentUser)
                .studentName(request.getStudentName())
                .studentPrn(prn)
                .studentMobile(request.getStudentMobile())
                .studentRoom(request.getStudentRoom())
                .studentHostel(request.getStudentHostel())
                .studentClass(request.getStudentClass())
                .studentDivision(request.getStudentDivision())
                .reason(request.getReason())
                .studentNote(request.getStudentNote())
                .destination(request.getDestination())
                .departureTime(request.getDepartureTime())
                .expectedReturnTime(request.getExpectedReturnTime())
                .parentContact(request.getParentContact())
                .emergencyContact(request.getEmergencyContact())
                .status(OutpassStatus.PENDING)
                .isLateReturn(false)
                .createdBy(createdBy)
                .build();

        HostelOutpass saved = hostelOutpassRepository.save(outpass);

        auditLogService.logAction(createdBy, "OUTPASS_CREATED", "HostelOutpass", saved.getId(), null, Map.of(
                "studentName", saved.getStudentName(),
                "studentPrn", saved.getStudentPrn()
        ));

        if (saved.getStudentUser() != null) {
            notificationService.sendOutpassSubmitted(saved.getStudentUser(), saved.getStudentName(), saved.getId());
        } else {
            notificationService.sendOutpassSubmitted(createdBy, saved.getStudentName(), saved.getId());
        }

        log.info("Outpass created for {} (PRN: {})", saved.getStudentName(), saved.getStudentPrn());
        return hostelOutpassMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public HostelOutpassResponse approveOutpass(Long outpassId, HostelOutpassApprovalRequest request, String performingUsername) {
        HostelOutpass outpass = hostelOutpassRepository.findById(outpassId)
                .orElseThrow(() -> new ResourceNotFoundException("HostelOutpass", "id", outpassId));

        if (outpass.getStatus() != OutpassStatus.PENDING) {
            throw new BadRequestException("Outpass is not in PENDING status. Current status: " + outpass.getStatus());
        }

        User warden = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        if (request.isApproved()) {
            outpass.setStatus(OutpassStatus.APPROVED);
            outpass.setWarden(warden);
            outpass.setWardenRemarks(request.getRemarks());
            outpass.setWardenActedAt(OffsetDateTime.now());
        } else {
            if (request.getRejectionReason() == null || request.getRejectionReason().isBlank()) {
                throw new BadRequestException("Rejection reason is required when rejecting an outpass");
            }
            outpass.setStatus(OutpassStatus.REJECTED);
            outpass.setWarden(warden);
            outpass.setRejectionReason(request.getRejectionReason());
            outpass.setWardenActedAt(OffsetDateTime.now());
        }

        HostelOutpass saved = hostelOutpassRepository.save(outpass);

        auditLogService.logAction(warden, "OUTPASS_" + (request.isApproved() ? "APPROVED" : "REJECTED"),
                "HostelOutpass", saved.getId(),
                Map.of("status", "PENDING"),
                Map.of("status", saved.getStatus().name())
        );

        if (saved.getStudentUser() != null) {
            if (request.isApproved()) {
                notificationService.sendOutpassApproved(
                        saved.getStudentUser(), saved.getStudentName(), saved.getId());
            } else {
                notificationService.sendOutpassRejected(
                        saved.getStudentUser(), saved.getStudentName(), saved.getId(),
                        request.getRejectionReason());
            }
        }

        log.info("Outpass {} for {} - Status: {}", saved.getId(), saved.getStudentName(), saved.getStatus());
        return hostelOutpassMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public HostelOutpassResponse recordGateExit(Long outpassId, Long gateId, String performingUsername) {
        HostelOutpass outpass = hostelOutpassRepository.findById(outpassId)
                .orElseThrow(() -> new ResourceNotFoundException("HostelOutpass", "id", outpassId));

        if (outpass.getStatus() != OutpassStatus.APPROVED) {
            throw new BadRequestException("Outpass must be APPROVED before exit. Current status: " + outpass.getStatus());
        }

        Gate gate = gateRepository.findById(gateId)
                .orElseThrow(() -> new ResourceNotFoundException("Gate", "id", gateId));

        User performer = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        outpass.setStatus(OutpassStatus.EXITED);
        outpass.setGate(gate);
        outpass.setGateExitAt(OffsetDateTime.now());

        HostelOutpass saved = hostelOutpassRepository.save(outpass);

        auditLogService.logAction(performer, "OUTPASS_EXIT", "HostelOutpass", saved.getId(),
                Map.of("status", "APPROVED"),
                Map.of("status", "EXITED", "gateId", gateId)
        );

        log.info("Outpass {} - student {} exited through {}", saved.getId(), saved.getStudentName(), gate.getName());
        return hostelOutpassMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public HostelOutpassResponse recordGateEntry(Long outpassId, String performingUsername) {
        HostelOutpass outpass = hostelOutpassRepository.findById(outpassId)
                .orElseThrow(() -> new ResourceNotFoundException("HostelOutpass", "id", outpassId));

        if (outpass.getStatus() != OutpassStatus.EXITED) {
            throw new BadRequestException("Outpass must be EXITED before re-entry. Current status: " + outpass.getStatus());
        }

        User performer = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        outpass.setStatus(OutpassStatus.RETURNED);
        outpass.setGateEntryAt(OffsetDateTime.now());
        outpass.setActualReturnTime(OffsetDateTime.now());

        if (outpass.getActualReturnTime().isAfter(outpass.getExpectedReturnTime())) {
            outpass.setIsLateReturn(true);
        }

        HostelOutpass saved = hostelOutpassRepository.save(outpass);

        auditLogService.logAction(performer, "OUTPASS_ENTRY", "HostelOutpass", saved.getId(),
                Map.of("status", "EXITED"),
                Map.of("status", "RETURNED", "isLateReturn", saved.getIsLateReturn())
        );

        if (saved.getStudentUser() != null) {
            notificationService.sendOutpassReturned(saved.getStudentUser(), saved.getStudentName(), saved.getId());
        }

        log.info("Outpass {} - student {} returned (late: {})", saved.getId(), saved.getStudentName(), saved.getIsLateReturn());
        return hostelOutpassMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public HostelOutpassResponse getOutpassById(Long outpassId, String performingUsername) {
        HostelOutpass outpass = hostelOutpassRepository.findById(outpassId)
                .orElseThrow(() -> new ResourceNotFoundException("HostelOutpass", "id", outpassId));

        if (performingUsername != null) {
            User performer = userRepository.findByUsername(performingUsername).orElse(null);
            if (performer != null && performer.getRole() == UserRole.STUDENT) {
                if (!outpass.getStudentPrn().equalsIgnoreCase(performer.getUsername()) &&
                    (outpass.getStudentUser() == null || !outpass.getStudentUser().getId().equals(performer.getId()))) {
                    throw new ForbiddenException("Access denied: You can only view your own outpasses");
                }
            }
        }

        return hostelOutpassMapper.toResponse(outpass);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<HostelOutpassResponse> getOutpasses(String query, String studentPrn, OutpassStatus status, Boolean isLateReturn, Pageable pageable, String performingUsername) {
        User performer = null;
        if (performingUsername != null) {
            performer = userRepository.findByUsername(performingUsername).orElse(null);
        }

        final String effectiveStudentPrn = (performer != null && performer.getRole() == UserRole.STUDENT)
                ? performer.getUsername().toUpperCase()
                : studentPrn;

        Specification<HostelOutpass> spec = (root, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(query)) {
                String searchPattern = "%" + query.toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("studentName")), searchPattern);
                Predicate prnMatch = cb.like(cb.lower(root.get("studentPrn")), searchPattern);
                Predicate reasonMatch = cb.like(cb.lower(root.get("reason")), searchPattern);
                predicates.add(cb.or(nameMatch, prnMatch, reasonMatch));
            }

            if (StringUtils.hasText(effectiveStudentPrn)) {
                predicates.add(cb.equal(root.get("studentPrn"), effectiveStudentPrn.toUpperCase()));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (isLateReturn != null) {
                predicates.add(cb.equal(root.get("isLateReturn"), isLateReturn));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return hostelOutpassRepository.findAll(spec, pageable).map(hostelOutpassMapper::toResponse);
    }
}
