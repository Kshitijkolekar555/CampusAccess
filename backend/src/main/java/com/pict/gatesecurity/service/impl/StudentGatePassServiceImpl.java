package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.studentpass.*;
import com.pict.gatesecurity.entity.*;
import com.pict.gatesecurity.entity.enums.PassStatus;
import com.pict.gatesecurity.exception.BadRequestException;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.mapper.StudentGatePassMapper;
import com.pict.gatesecurity.repository.*;
import com.pict.gatesecurity.service.AuditLogService;
import com.pict.gatesecurity.service.NotificationService;
import com.pict.gatesecurity.service.StudentGatePassService;
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
public class StudentGatePassServiceImpl implements StudentGatePassService {

    private final StudentGatePassRepository studentGatePassRepository;
    private final UserRepository userRepository;
    private final GateRepository gateRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final StudentGatePassMapper studentGatePassMapper;

    @Override
    @Transactional
    public StudentGatePassResponse createPass(StudentGatePassRequest request, String performingUsername) {
        User createdBy = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        if (request.getDepartureTime().isBefore(OffsetDateTime.now().minusMinutes(15))) {
            throw new BadRequestException("Departure time cannot be in the past");
        }

        if (request.getExpectedReturnTime().isBefore(request.getDepartureTime())) {
            throw new BadRequestException("Expected return time must be after departure time");
        }

        User studentUser = null;
        if (request.getStudentUserId() != null) {
            studentUser = userRepository.findById(request.getStudentUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getStudentUserId()));
        }

        StudentGatePass pass = StudentGatePass.builder()
                .studentUser(studentUser)
                .studentName(request.getStudentName())
                .studentPrn(request.getStudentPrn().toUpperCase())
                .studentMobile(request.getStudentMobile())
                .studentClass(request.getStudentClass())
                .studentDivision(request.getStudentDivision())
                .studentDepartment(request.getStudentDepartment())
                .purpose(request.getPurpose())
                .destination(request.getDestination())
                .departureTime(request.getDepartureTime())
                .expectedReturnTime(request.getExpectedReturnTime())
                .actualReturnTime(null)
                .status(PassStatus.PENDING)
                .createdBy(createdBy)
                .build();

        StudentGatePass savedPass = studentGatePassRepository.save(pass);

        auditLogService.logAction(createdBy, "GATE_PASS_CREATED", "StudentGatePass", savedPass.getId(), null, Map.of(
                "studentName", savedPass.getStudentName(),
                "studentPrn", savedPass.getStudentPrn(),
                "status", savedPass.getStatus().name()
        ));

        log.info("Gate pass created for {} (PRN: {}) - Status: {}", savedPass.getStudentName(), savedPass.getStudentPrn(), savedPass.getStatus());
        return studentGatePassMapper.toResponse(savedPass);
    }

    @Override
    @Transactional
    public StudentGatePassResponse approvePass(Long passId, StudentGatePassApprovalRequest request, String performingUsername) {
        StudentGatePass pass = studentGatePassRepository.findById(passId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentGatePass", "id", passId));

        if (pass.getStatus() != PassStatus.PENDING) {
            throw new BadRequestException("Gate pass is not in PENDING status. Current status: " + pass.getStatus());
        }

        User approver = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        if (request.isApproved()) {
            pass.setStatus(PassStatus.APPROVED);
            pass.setApprovedBy(approver);
            pass.setApprovalNotes(request.getNotes());
            pass.setWardenApprovedAt(OffsetDateTime.now());
        } else {
            if (request.getRejectionReason() == null || request.getRejectionReason().isBlank()) {
                throw new BadRequestException("Rejection reason is required when rejecting a gate pass");
            }
            pass.setStatus(PassStatus.REJECTED);
            pass.setRejectionReason(request.getRejectionReason());
        }

        StudentGatePass savedPass = studentGatePassRepository.save(pass);

        auditLogService.logAction(approver, "GATE_PASS_" + (request.isApproved() ? "APPROVED" : "REJECTED"),
                "StudentGatePass", savedPass.getId(),
                Map.of("status", "PENDING"),
                Map.of("status", savedPass.getStatus().name())
        );

        if (savedPass.getStudentUser() != null) {
            if (request.isApproved()) {
                notificationService.sendGatePassApproved(
                        savedPass.getStudentUser(), savedPass.getStudentName(), savedPass.getId());
            } else {
                notificationService.sendGatePassRejected(
                        savedPass.getStudentUser(), savedPass.getStudentName(), savedPass.getId(),
                        request.getRejectionReason());
            }
        }

        log.info("Gate pass {} for {} - Status: {}", savedPass.getId(), savedPass.getStudentName(), savedPass.getStatus());
        return studentGatePassMapper.toResponse(savedPass);
    }

    @Override
    @Transactional
    public StudentGatePassResponse recordGateExit(Long passId, Long gateId, String performingUsername) {
        StudentGatePass pass = studentGatePassRepository.findById(passId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentGatePass", "id", passId));

        if (pass.getStatus() != PassStatus.APPROVED) {
            throw new BadRequestException("Gate pass must be APPROVED before exit. Current status: " + pass.getStatus());
        }

        Gate gate = gateRepository.findById(gateId)
                .orElseThrow(() -> new ResourceNotFoundException("Gate", "id", gateId));

        User performer = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        pass.setStatus(PassStatus.ACTIVE);
        pass.setGate(gate);
        pass.setGateExitAt(OffsetDateTime.now());

        StudentGatePass savedPass = studentGatePassRepository.save(pass);

        auditLogService.logAction(performer, "GATE_PASS_EXIT", "StudentGatePass", savedPass.getId(),
                Map.of("status", "APPROVED"),
                Map.of("status", "ACTIVE", "gateId", gateId)
        );

        log.info("Gate pass {} - student {} exited through {}", savedPass.getId(), savedPass.getStudentName(), gate.getName());
        return studentGatePassMapper.toResponse(savedPass);
    }

    @Override
    @Transactional
    public StudentGatePassResponse recordGateEntry(Long passId, String performingUsername) {
        StudentGatePass pass = studentGatePassRepository.findById(passId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentGatePass", "id", passId));

        if (pass.getStatus() != PassStatus.ACTIVE) {
            throw new BadRequestException("Gate pass must be ACTIVE for re-entry. Current status: " + pass.getStatus());
        }

        User performer = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        pass.setStatus(PassStatus.COMPLETED);
        pass.setGateEntryAt(OffsetDateTime.now());
        pass.setActualReturnTime(OffsetDateTime.now());

        StudentGatePass savedPass = studentGatePassRepository.save(pass);

        auditLogService.logAction(performer, "GATE_PASS_ENTRY", "StudentGatePass", savedPass.getId(),
                Map.of("status", "ACTIVE"),
                Map.of("status", "COMPLETED")
        );

        log.info("Gate pass {} - student {} returned to campus", savedPass.getId(), savedPass.getStudentName());
        return studentGatePassMapper.toResponse(savedPass);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentGatePassResponse getPassById(Long passId, String performingUsername) {
        StudentGatePass pass = studentGatePassRepository.findById(passId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentGatePass", "id", passId));

        User user = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        if (user.getRole() == com.pict.gatesecurity.entity.enums.UserRole.STUDENT) {
            if (!pass.getStudentPrn().equalsIgnoreCase(user.getUsername())) {
                throw new com.pict.gatesecurity.exception.ForbiddenException("Access denied: You can only view your own gate pass");
            }
        }

        return studentGatePassMapper.toResponse(pass);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StudentGatePassResponse> getPasses(String query, String studentPrn, PassStatus status, Pageable pageable, String performingUsername) {
        User user = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        final String effectivePrn;
        if (user.getRole() == com.pict.gatesecurity.entity.enums.UserRole.STUDENT) {
            effectivePrn = user.getUsername().toUpperCase();
        } else {
            effectivePrn = StringUtils.hasText(studentPrn) ? studentPrn.toUpperCase() : null;
        }

        Specification<StudentGatePass> spec = (root, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(query)) {
                String searchPattern = "%" + query.toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("studentName")), searchPattern);
                Predicate prnMatch = cb.like(cb.lower(root.get("studentPrn")), searchPattern);
                Predicate purposeMatch = cb.like(cb.lower(root.get("purpose")), searchPattern);
                predicates.add(cb.or(nameMatch, prnMatch, purposeMatch));
            }

            if (StringUtils.hasText(effectivePrn)) {
                predicates.add(cb.equal(cb.upper(root.get("studentPrn")), effectivePrn));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return studentGatePassRepository.findAll(spec, pageable).map(studentGatePassMapper::toResponse);
    }
}
