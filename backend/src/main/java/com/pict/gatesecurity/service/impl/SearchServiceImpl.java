package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.search.SearchFilterRequest;
import com.pict.gatesecurity.entity.*;
import com.pict.gatesecurity.entity.enums.*;
import com.pict.gatesecurity.repository.*;
import com.pict.gatesecurity.service.SearchService;
import com.pict.gatesecurity.util.ReportSpecifications;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SearchServiceImpl implements SearchService {

    private final VisitorRepository visitorRepository;
    private final VehicleLogRepository vehicleLogRepository;
    private final StudentGatePassRepository studentGatePassRepository;
    private final HostelOutpassRepository hostelOutpassRepository;
    private final GuardRepository guardRepository;
    private final VendorVisitRepository vendorVisitRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final ShiftRepository shiftRepository;
    private final UserRepository userRepository;

    // ==================== VISITOR SEARCH ====================

    @Override
    public Page<Object> searchVisitors(SearchFilterRequest filter, Pageable pageable) {
        Specification<Visitor> spec = buildVisitorSpec(filter);
        return visitorRepository.findAll(spec, pageable).map(v -> (Object) v);
    }

    @Override
    public Page<?> searchVisitorsAsProjection(SearchFilterRequest filter, Pageable pageable) {
        Specification<Visitor> spec = buildVisitorSpec(filter);
        return visitorRepository.findAll(spec, pageable).map(v -> {
            Long duration = null;
            if (v.getTimeOut() != null) {
                duration = java.time.temporal.ChronoUnit.MINUTES.between(v.getTimeIn(), v.getTimeOut());
            }
            return com.pict.gatesecurity.dto.report.VisitorReportRow.builder()
                    .id(v.getId())
                    .name(v.getName())
                    .mobile(v.getMobile())
                    .purpose(v.getPurpose())
                    .hostName(v.getHostName())
                    .hostType(v.getHostType())
                    .hostDepartment(v.getHostDepartment())
                    .studentPrn(v.getStudentPrn())
                    .gateId(v.getGate() != null ? v.getGate().getId() : null)
                    .gateName(v.getGate() != null ? v.getGate().getName() : null)
                    .vehicleNumber(v.getVehicleNumber())
                    .timeIn(v.getTimeIn())
                    .timeOut(v.getTimeOut())
                    .idProofType(v.getIdProofType())
                    .isBlacklistedMatch(v.getIsBlacklistedMatch())
                    .notes(v.getNotes())
                    .createdByUsername(v.getCreatedBy() != null ? v.getCreatedBy().getUsername() : null)
                    .durationMinutes(duration)
                    .build();
        });
    }

    private Specification<Visitor> buildVisitorSpec(SearchFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("timeIn"),
                        ReportSpecifications.toStartOfDay(filter.getFromDate())));
            }
            if (filter.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("timeIn"),
                        ReportSpecifications.toEndOfDay(filter.getToDate())));
            }
            if (filter.getGateId() != null) {
                predicates.add(cb.equal(root.get("gate").get("id"), filter.getGateId()));
            }
            if (filter.getDepartment() != null) {
                predicates.add(cb.equal(root.get("hostDepartment"), filter.getDepartment()));
            }
            if (filter.getVisitorType() != null) {
                predicates.add(cb.equal(root.get("hostType"), filter.getVisitorType()));
            }
            if (filter.getActiveInside() != null) {
                if (filter.getActiveInside()) {
                    predicates.add(cb.isNull(root.get("timeOut")));
                } else {
                    predicates.add(cb.isNotNull(root.get("timeOut")));
                }
            }
            if (StringUtils.hasText(filter.getSearch())) {
                String pattern = "%" + filter.getSearch().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("mobile")), pattern),
                        cb.like(cb.lower(root.get("studentPrn")), pattern),
                        cb.like(cb.lower(root.get("hostName")), pattern)
                ));
            }
            if (StringUtils.hasText(filter.getMobile())) {
                predicates.add(cb.like(cb.lower(root.get("mobile")),
                        "%" + filter.getMobile().toLowerCase() + "%"));
            }
            if (StringUtils.hasText(filter.getPurpose())) {
                predicates.add(cb.like(cb.lower(root.get("purpose")),
                        "%" + filter.getPurpose().toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // ==================== VEHICLE SEARCH ====================

    @Override
    public Page<Object> searchVehicles(SearchFilterRequest filter, Pageable pageable) {
        Specification<VehicleLog> spec = buildVehicleSpec(filter);
        return vehicleLogRepository.findAll(spec, pageable).map(v -> (Object) v);
    }

    @Override
    public Page<?> searchVehiclesAsProjection(SearchFilterRequest filter, Pageable pageable) {
        Specification<VehicleLog> spec = buildVehicleSpec(filter);
        return vehicleLogRepository.findAll(spec, pageable).map(v -> {
            Long duration = null;
            if (v.getExitTime() != null) {
                duration = java.time.temporal.ChronoUnit.MINUTES.between(v.getEntryTime(), v.getExitTime());
            }
            return com.pict.gatesecurity.dto.report.VehicleReportRow.builder()
                    .id(v.getId())
                    .vehicleId(v.getVehicle() != null ? v.getVehicle().getId() : null)
                    .registrationNumber(v.getVehicle() != null ? v.getVehicle().getRegistrationNumber() : null)
                    .vehicleType(v.getVehicle() != null ? v.getVehicle().getVehicleType() : null)
                    .category(v.getVehicle() != null ? v.getVehicle().getCategory() : null)
                    .ownerName(v.getVehicle() != null ? v.getVehicle().getOwnerName() : null)
                    .ownerContact(v.getVehicle() != null ? v.getVehicle().getOwnerContact() : null)
                    .driverName(v.getDriverName())
                    .purpose(v.getPurpose())
                    .gateId(v.getGate() != null ? v.getGate().getId() : null)
                    .gateName(v.getGate() != null ? v.getGate().getName() : null)
                    .entryTime(v.getEntryTime())
                    .exitTime(v.getExitTime())
                    .isBlacklisted(v.getVehicle() != null ? v.getVehicle().getIsBlacklisted() : null)
                    .createdByUsername(v.getCreatedBy() != null ? v.getCreatedBy().getUsername() : null)
                    .durationMinutes(duration)
                    .build();
        });
    }

    private Specification<VehicleLog> buildVehicleSpec(SearchFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("entryTime"),
                        ReportSpecifications.toStartOfDay(filter.getFromDate())));
            }
            if (filter.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("entryTime"),
                        ReportSpecifications.toEndOfDay(filter.getToDate())));
            }
            if (filter.getGateId() != null) {
                predicates.add(cb.equal(root.get("gate").get("id"), filter.getGateId()));
            }
            if (filter.getVehicleCategory() != null) {
                predicates.add(cb.equal(root.get("vehicle").get("category"), filter.getVehicleCategory()));
            }
            if (filter.getActiveInside() != null) {
                if (filter.getActiveInside()) {
                    predicates.add(cb.isNull(root.get("exitTime")));
                } else {
                    predicates.add(cb.isNotNull(root.get("exitTime")));
                }
            }
            if (StringUtils.hasText(filter.getSearch())) {
                String pattern = "%" + filter.getSearch().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("vehicle").get("registrationNumber")), pattern),
                        cb.like(cb.lower(root.get("driverName")), pattern),
                        cb.like(cb.lower(root.get("vehicle").get("ownerName")), pattern)
                ));
            }
            if (StringUtils.hasText(filter.getVehicleNumber())) {
                predicates.add(cb.like(cb.lower(root.get("vehicle").get("registrationNumber")),
                        "%" + filter.getVehicleNumber().toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // ==================== STUDENT GATE PASS SEARCH ====================

    @Override
    public Page<Object> searchStudentGatePasses(SearchFilterRequest filter, Pageable pageable) {
        Specification<StudentGatePass> spec = buildStudentGatePassSpec(filter);
        return studentGatePassRepository.findAll(spec, pageable).map(s -> (Object) s);
    }

    @Override
    public Page<?> searchStudentGatePassesAsProjection(SearchFilterRequest filter, Pageable pageable) {
        Specification<StudentGatePass> spec = buildStudentGatePassSpec(filter);
        return studentGatePassRepository.findAll(spec, pageable).map(s ->
                com.pict.gatesecurity.dto.report.StudentGatePassReportRow.builder()
                        .id(s.getId())
                        .studentName(s.getStudentName())
                        .studentPrn(s.getStudentPrn())
                        .studentMobile(s.getStudentMobile())
                        .studentDepartment(s.getStudentDepartment())
                        .studentClass(s.getStudentClass())
                        .purpose(s.getPurpose())
                        .destination(s.getDestination())
                        .departureTime(s.getDepartureTime())
                        .expectedReturnTime(s.getExpectedReturnTime())
                        .actualReturnTime(s.getActualReturnTime())
                        .status(s.getStatus())
                        .gateId(s.getGate() != null ? s.getGate().getId() : null)
                        .gateName(s.getGate() != null ? s.getGate().getName() : null)
                        .gateExitAt(s.getGateExitAt())
                        .gateEntryAt(s.getGateEntryAt())
                        .createdAt(s.getCreatedAt())
                        .createdByUsername(s.getCreatedBy() != null ? s.getCreatedBy().getUsername() : null)
                        .build()
        );
    }

    private Specification<StudentGatePass> buildStudentGatePassSpec(SearchFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"),
                        ReportSpecifications.toStartOfDay(filter.getFromDate())));
            }
            if (filter.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"),
                        ReportSpecifications.toEndOfDay(filter.getToDate())));
            }
            if (filter.getPassStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getPassStatus()));
            }
            if (filter.getGateId() != null) {
                predicates.add(cb.equal(root.get("gate").get("id"), filter.getGateId()));
            }
            if (StringUtils.hasText(filter.getSearch())) {
                String pattern = "%" + filter.getSearch().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("studentName")), pattern),
                        cb.like(cb.lower(root.get("studentPrn")), pattern),
                        cb.like(cb.lower(root.get("studentMobile")), pattern),
                        cb.like(cb.lower(root.get("purpose")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // ==================== HOSTEL OUTPASS SEARCH ====================

    @Override
    public Page<Object> searchHostelOutpasses(SearchFilterRequest filter, Pageable pageable) {
        Specification<HostelOutpass> spec = buildHostelOutpassSpec(filter);
        return hostelOutpassRepository.findAll(spec, pageable).map(h -> (Object) h);
    }

    @Override
    public Page<?> searchHostelOutpassesAsProjection(SearchFilterRequest filter, Pageable pageable) {
        Specification<HostelOutpass> spec = buildHostelOutpassSpec(filter);
        return hostelOutpassRepository.findAll(spec, pageable).map(h ->
                com.pict.gatesecurity.dto.report.HostelOutpassReportRow.builder()
                        .id(h.getId())
                        .studentName(h.getStudentName())
                        .studentPrn(h.getStudentPrn())
                        .studentMobile(h.getStudentMobile())
                        .studentRoom(h.getStudentRoom())
                        .studentHostel(h.getStudentHostel())
                        .reason(h.getReason())
                        .destination(h.getDestination())
                        .departureTime(h.getDepartureTime())
                        .expectedReturnTime(h.getExpectedReturnTime())
                        .actualReturnTime(h.getActualReturnTime())
                        .status(h.getStatus())
                        .wardenRemarks(h.getWardenRemarks())
                        .gateId(h.getGate() != null ? h.getGate().getId() : null)
                        .gateName(h.getGate() != null ? h.getGate().getName() : null)
                        .isLateReturn(h.getIsLateReturn())
                        .gateExitAt(h.getGateExitAt())
                        .gateEntryAt(h.getGateEntryAt())
                        .createdAt(h.getCreatedAt())
                        .createdByUsername(h.getCreatedBy() != null ? h.getCreatedBy().getUsername() : null)
                        .build()
        );
    }

    private Specification<HostelOutpass> buildHostelOutpassSpec(SearchFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"),
                        ReportSpecifications.toStartOfDay(filter.getFromDate())));
            }
            if (filter.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"),
                        ReportSpecifications.toEndOfDay(filter.getToDate())));
            }
            if (filter.getOutpassStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getOutpassStatus()));
            }
            if (StringUtils.hasText(filter.getHostel())) {
                predicates.add(cb.equal(root.get("studentHostel"), filter.getHostel()));
            }
            if (filter.getGateId() != null) {
                predicates.add(cb.equal(root.get("gate").get("id"), filter.getGateId()));
            }
            if (StringUtils.hasText(filter.getSearch())) {
                String pattern = "%" + filter.getSearch().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("studentName")), pattern),
                        cb.like(cb.lower(root.get("studentPrn")), pattern),
                        cb.like(cb.lower(root.get("studentMobile")), pattern),
                        cb.like(cb.lower(root.get("reason")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // ==================== GUARD SEARCH ====================

    @Override
    public Page<Object> searchGuards(SearchFilterRequest filter, Pageable pageable) {
        Specification<Guard> spec = buildGuardSpec(filter);
        return guardRepository.findAll(spec, pageable).map(g -> (Object) g);
    }

    @Override
    public Page<?> searchGuardsAsProjection(SearchFilterRequest filter, Pageable pageable) {
        Specification<Guard> spec = buildGuardSpec(filter);
        return guardRepository.findAll(spec, pageable).map(g ->
                com.pict.gatesecurity.dto.report.GuardAttendanceReportRow.builder()
                        .guardId(g.getId())
                        .guardName(g.getUser() != null ? g.getUser().getFullName() : "N/A")
                        .employeeCode(g.getEmployeeCode())
                        .gateName(g.getAssignedGate() != null ? g.getAssignedGate().getName() : "Unassigned")
                        .build()
        );
    }

    private Specification<Guard> buildGuardSpec(SearchFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getGateId() != null) {
                predicates.add(cb.equal(root.get("assignedGate").get("id"), filter.getGateId()));
            }
            if (StringUtils.hasText(filter.getSearch())) {
                String pattern = "%" + filter.getSearch().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("user").get("fullName")), pattern),
                        cb.like(cb.lower(root.get("employeeCode")), pattern),
                        cb.like(cb.lower(root.get("user").get("phone")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // ==================== VENDOR SEARCH ====================

    @Override
    public Page<Object> searchVendors(SearchFilterRequest filter, Pageable pageable) {
        Specification<VendorVisit> spec = buildVendorVisitSpec(filter);
        return vendorVisitRepository.findAll(spec, pageable).map(v -> (Object) v);
    }

    @Override
    public Page<?> searchVendorsAsProjection(SearchFilterRequest filter, Pageable pageable) {
        Specification<VendorVisit> spec = buildVendorVisitSpec(filter);
        return vendorVisitRepository.findAll(spec, pageable).map(v ->
                com.pict.gatesecurity.dto.report.VendorReportRow.builder()
                        .id(v.getId())
                        .vendorId(v.getVendor() != null ? v.getVendor().getId() : null)
                        .companyName(v.getVendor() != null ? v.getVendor().getCompanyName() : null)
                        .contactPerson(v.getVendor() != null ? v.getVendor().getContactPerson() : null)
                        .contactPhone(v.getVendor() != null ? v.getVendor().getContactPhone() : null)
                        .purpose(v.getPurpose())
                        .gateId(v.getGate() != null ? v.getGate().getId() : null)
                        .gateName(v.getGate() != null ? v.getGate().getName() : null)
                        .entryTime(v.getEntryTime())
                        .exitTime(v.getExitTime())
                        .vendorBlacklisted(v.getVendor() != null ? v.getVendor().getIsBlacklisted() : null)
                        .createdByUsername(v.getCreatedBy() != null ? v.getCreatedBy().getUsername() : null)
                        .build()
        );
    }

    private Specification<VendorVisit> buildVendorVisitSpec(SearchFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("entryTime"),
                        ReportSpecifications.toStartOfDay(filter.getFromDate())));
            }
            if (filter.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("entryTime"),
                        ReportSpecifications.toEndOfDay(filter.getToDate())));
            }
            if (filter.getGateId() != null) {
                predicates.add(cb.equal(root.get("gate").get("id"), filter.getGateId()));
            }
            if (filter.getActiveInside() != null) {
                if (filter.getActiveInside()) {
                    predicates.add(cb.isNull(root.get("exitTime")));
                } else {
                    predicates.add(cb.isNotNull(root.get("exitTime")));
                }
            }
            if (StringUtils.hasText(filter.getSearch())) {
                String pattern = "%" + filter.getSearch().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("vendor").get("companyName")), pattern),
                        cb.like(cb.lower(root.get("vendor").get("contactPerson")), pattern),
                        cb.like(cb.lower(root.get("purpose")), pattern)
                ));
            }
            if (StringUtils.hasText(filter.getCompanyName())) {
                predicates.add(cb.like(cb.lower(root.get("vendor").get("companyName")),
                        "%" + filter.getCompanyName().toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // ==================== NOTIFICATION SEARCH ====================

    @Override
    public Page<Object> searchNotifications(SearchFilterRequest filter, Pageable pageable) {
        Specification<Notification> spec = buildNotificationSpec(filter);
        return notificationRepository.findAll(spec, pageable).map(n -> (Object) n);
    }

    @Override
    public Page<?> searchNotificationsAsProjection(SearchFilterRequest filter, Pageable pageable) {
        Specification<Notification> spec = buildNotificationSpec(filter);
        return notificationRepository.findAll(spec, pageable).map(n ->
                com.pict.gatesecurity.dto.report.NotificationReportRow.builder()
                        .id(n.getId())
                        .recipient(n.getRecipient())
                        .type(n.getType())
                        .eventType(n.getEventType())
                        .subject(n.getSubject())
                        .status(n.getStatus())
                        .retryCount(n.getRetryCount())
                        .sentAt(n.getSentAt())
                        .createdAt(n.getCreatedAt())
                        .build()
        );
    }

    private Specification<Notification> buildNotificationSpec(SearchFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"),
                        ReportSpecifications.toStartOfDay(filter.getFromDate())));
            }
            if (filter.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"),
                        ReportSpecifications.toEndOfDay(filter.getToDate())));
            }
            if (filter.getNotificationType() != null) {
                predicates.add(cb.equal(root.get("type"), filter.getNotificationType()));
            }
            if (filter.getNotificationStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getNotificationStatus()));
            }
            if (StringUtils.hasText(filter.getSearch())) {
                String pattern = "%" + filter.getSearch().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("recipient")), pattern),
                        cb.like(cb.lower(root.get("subject")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // ==================== AUDIT LOG SEARCH ====================

    @Override
    public Page<Object> searchAuditLogs(SearchFilterRequest filter, Pageable pageable) {
        Specification<AuditLog> spec = buildAuditLogSpec(filter);
        return auditLogRepository.findAll(spec, pageable).map(a -> (Object) a);
    }

    @Override
    public Page<?> searchAuditLogsAsProjection(SearchFilterRequest filter, Pageable pageable) {
        Specification<AuditLog> spec = buildAuditLogSpec(filter);
        return auditLogRepository.findAll(spec, pageable).map(a ->
                com.pict.gatesecurity.dto.report.AuditLogReportRow.builder()
                        .id(a.getId())
                        .username(a.getUser() != null ? a.getUser().getUsername() : "System")
                        .action(a.getAction())
                        .entityType(a.getEntityType())
                        .entityId(a.getEntityId())
                        .timestamp(a.getTimestamp())
                        .build()
        );
    }

    private Specification<AuditLog> buildAuditLogSpec(SearchFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("timestamp"),
                        ReportSpecifications.toStartOfDay(filter.getFromDate())));
            }
            if (filter.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("timestamp"),
                        ReportSpecifications.toEndOfDay(filter.getToDate())));
            }
            if (StringUtils.hasText(filter.getEntityType())) {
                predicates.add(cb.equal(root.get("entityType"), filter.getEntityType()));
            }
            if (StringUtils.hasText(filter.getAction())) {
                predicates.add(cb.equal(root.get("action"), filter.getAction()));
            }
            if (filter.getUserId() != null) {
                predicates.add(cb.equal(root.get("user").get("id"), filter.getUserId()));
            }
            if (StringUtils.hasText(filter.getSearch())) {
                String pattern = "%" + filter.getSearch().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("entityType")), pattern),
                        cb.like(cb.lower(root.get("action")), pattern),
                        cb.like(cb.lower(root.get("user").get("username")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // ==================== SHIFT SEARCH ====================

    @Override
    public Page<Object> searchShifts(SearchFilterRequest filter, Pageable pageable) {
        Specification<Shift> spec = buildShiftSpec(filter);
        return shiftRepository.findAll(spec, pageable).map(s -> (Object) s);
    }

    private Specification<Shift> buildShiftSpec(SearchFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getGateId() != null) {
                predicates.add(cb.equal(root.get("gate").get("id"), filter.getGateId()));
            }
            if (filter.getGuardId() != null) {
                predicates.add(cb.equal(root.get("guard").get("id"), filter.getGuardId()));
            }
            if (filter.getShiftStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getShiftStatus()));
            }
            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("date"), filter.getFromDate()));
            }
            if (filter.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("date"), filter.getToDate()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
