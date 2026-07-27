package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.report.*;
import com.pict.gatesecurity.entity.*;
import com.pict.gatesecurity.entity.enums.*;
import com.pict.gatesecurity.repository.*;
import com.pict.gatesecurity.service.ReportService;
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
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {

    private final VisitorRepository visitorRepository;
    private final VehicleLogRepository vehicleLogRepository;
    private final VehicleRepository vehicleRepository;
    private final StudentGatePassRepository studentGatePassRepository;
    private final HostelOutpassRepository hostelOutpassRepository;
    private final VendorRepository vendorRepository;
    private final VendorVisitRepository vendorVisitRepository;
    private final GuardRepository guardRepository;
    private final ShiftRepository shiftRepository;
    private final ShiftLogRepository shiftLogRepository;
    private final GateRepository gateRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationRepository notificationRepository;
    private final CanteenEntryRepository canteenEntryRepository;
    private final CanteenStaffRepository canteenStaffRepository;
    private final UserRepository userRepository;

    @Override
    public Page<VisitorReportRow> getVisitorReport(ReportFilterRequest filter, Pageable pageable) {
        Specification<Visitor> spec = (root, query, cb) -> {
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
                        cb.like(cb.lower(root.get("studentPrn")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return visitorRepository.findAll(spec, pageable).map(v -> {
            Long duration = null;
            if (v.getTimeOut() != null) {
                duration = ChronoUnit.MINUTES.between(v.getTimeIn(), v.getTimeOut());
            }
            return VisitorReportRow.builder()
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

    @Override
    public Page<VehicleReportRow> getVehicleReport(ReportFilterRequest filter, Pageable pageable) {
        Specification<VehicleLog> spec = (root, query, cb) -> {
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
            if (filter.getVehicleType() != null) {
                predicates.add(cb.equal(root.get("vehicle").get("category"), filter.getVehicleType()));
            }
            if (StringUtils.hasText(filter.getSearch())) {
                String pattern = "%" + filter.getSearch().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("vehicle").get("registrationNumber")), pattern),
                        cb.like(cb.lower(root.get("driverName")), pattern),
                        cb.like(cb.lower(root.get("purpose")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return vehicleLogRepository.findAll(spec, pageable).map(vl -> {
            Long duration = null;
            if (vl.getExitTime() != null) {
                duration = ChronoUnit.MINUTES.between(vl.getEntryTime(), vl.getExitTime());
            }
            Vehicle vehicle = vl.getVehicle();
            return VehicleReportRow.builder()
                    .id(vl.getId())
                    .vehicleId(vehicle != null ? vehicle.getId() : null)
                    .registrationNumber(vehicle != null ? vehicle.getRegistrationNumber() : null)
                    .vehicleType(vehicle != null ? vehicle.getVehicleType() : null)
                    .category(vehicle != null ? vehicle.getCategory() : null)
                    .ownerName(vehicle != null ? vehicle.getOwnerName() : null)
                    .ownerContact(vehicle != null ? vehicle.getOwnerContact() : null)
                    .gateId(vl.getGate() != null ? vl.getGate().getId() : null)
                    .gateName(vl.getGate() != null ? vl.getGate().getName() : null)
                    .entryTime(vl.getEntryTime())
                    .exitTime(vl.getExitTime())
                    .driverName(vl.getDriverName())
                    .purpose(vl.getPurpose())
                    .isBlacklisted(vehicle != null ? vehicle.getIsBlacklisted() : null)
                    .createdByUsername(vl.getCreatedBy() != null ? vl.getCreatedBy().getUsername() : null)
                    .durationMinutes(duration)
                    .build();
        });
    }

    @Override
    public Page<StudentGatePassReportRow> getStudentGatePassReport(ReportFilterRequest filter, Pageable pageable) {
        Specification<StudentGatePass> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"),
                        ReportSpecifications.toStartOfDay(filter.getFromDate())));
            }
            if (filter.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"),
                        ReportSpecifications.toEndOfDay(filter.getToDate())));
            }
            if (filter.getGateId() != null) {
                predicates.add(cb.equal(root.get("gate").get("id"), filter.getGateId()));
            }
            if (filter.getPassStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getPassStatus()));
            }
            if (StringUtils.hasText(filter.getSearch())) {
                String pattern = "%" + filter.getSearch().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("studentName")), pattern),
                        cb.like(cb.lower(root.get("studentPrn")), pattern),
                        cb.like(cb.lower(root.get("purpose")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return studentGatePassRepository.findAll(spec, pageable).map(sgp -> StudentGatePassReportRow.builder()
                .id(sgp.getId())
                .studentName(sgp.getStudentName())
                .studentPrn(sgp.getStudentPrn())
                .studentMobile(sgp.getStudentMobile())
                .studentDepartment(sgp.getStudentDepartment())
                .studentClass(sgp.getStudentClass())
                .purpose(sgp.getPurpose())
                .destination(sgp.getDestination())
                .departureTime(sgp.getDepartureTime())
                .expectedReturnTime(sgp.getExpectedReturnTime())
                .actualReturnTime(sgp.getActualReturnTime())
                .status(sgp.getStatus())
                .approvedByName(sgp.getApprovedBy() != null ? sgp.getApprovedBy().getFullName() : null)
                .gateExitAt(sgp.getGateExitAt())
                .gateEntryAt(sgp.getGateEntryAt())
                .gateId(sgp.getGate() != null ? sgp.getGate().getId() : null)
                .gateName(sgp.getGate() != null ? sgp.getGate().getName() : null)
                .createdAt(sgp.getCreatedAt())
                .createdByUsername(sgp.getCreatedBy() != null ? sgp.getCreatedBy().getUsername() : null)
                .build());
    }

    @Override
    public Page<HostelOutpassReportRow> getHostelOutpassReport(ReportFilterRequest filter, Pageable pageable) {
        Specification<HostelOutpass> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"),
                        ReportSpecifications.toStartOfDay(filter.getFromDate())));
            }
            if (filter.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"),
                        ReportSpecifications.toEndOfDay(filter.getToDate())));
            }
            if (filter.getGateId() != null) {
                predicates.add(cb.equal(root.get("gate").get("id"), filter.getGateId()));
            }
            if (filter.getOutpassStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getOutpassStatus()));
            }
            if (StringUtils.hasText(filter.getSearch())) {
                String pattern = "%" + filter.getSearch().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("studentName")), pattern),
                        cb.like(cb.lower(root.get("studentPrn")), pattern),
                        cb.like(cb.lower(root.get("studentHostel")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return hostelOutpassRepository.findAll(spec, pageable).map(ho -> HostelOutpassReportRow.builder()
                .id(ho.getId())
                .studentName(ho.getStudentName())
                .studentPrn(ho.getStudentPrn())
                .studentMobile(ho.getStudentMobile())
                .studentHostel(ho.getStudentHostel())
                .studentRoom(ho.getStudentRoom())
                .reason(ho.getReason())
                .destination(ho.getDestination())
                .departureTime(ho.getDepartureTime())
                .expectedReturnTime(ho.getExpectedReturnTime())
                .actualReturnTime(ho.getActualReturnTime())
                .status(ho.getStatus())
                .wardenUsername(ho.getWarden() != null ? ho.getWarden().getUsername() : null)
                .wardenRemarks(ho.getWardenRemarks())
                .gateExitAt(ho.getGateExitAt())
                .gateEntryAt(ho.getGateEntryAt())
                .gateId(ho.getGate() != null ? ho.getGate().getId() : null)
                .gateName(ho.getGate() != null ? ho.getGate().getName() : null)
                .isLateReturn(ho.getIsLateReturn())
                .createdAt(ho.getCreatedAt())
                .createdByUsername(ho.getCreatedBy() != null ? ho.getCreatedBy().getUsername() : null)
                .build());
    }

    @Override
    public Page<VendorReportRow> getVendorReport(ReportFilterRequest filter, Pageable pageable) {
        Specification<VendorVisit> spec = (root, query, cb) -> {
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
            if (filter.getVendorId() != null) {
                predicates.add(cb.equal(root.get("vendor").get("id"), filter.getVendorId()));
            }
            if (StringUtils.hasText(filter.getSearch())) {
                String pattern = "%" + filter.getSearch().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("vendor").get("companyName")), pattern),
                        cb.like(cb.lower(root.get("vendor").get("contactPerson")), pattern),
                        cb.like(cb.lower(root.get("purpose")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return vendorVisitRepository.findAll(spec, pageable).map(vv -> {
            Long duration = null;
            if (vv.getExitTime() != null) {
                duration = ChronoUnit.MINUTES.between(vv.getEntryTime(), vv.getExitTime());
            }
            Vendor vendor = vv.getVendor();
            return VendorReportRow.builder()
                    .id(vv.getId())
                    .vendorId(vendor != null ? vendor.getId() : null)
                    .companyName(vendor != null ? vendor.getCompanyName() : null)
                    .contactPerson(vendor != null ? vendor.getContactPerson() : null)
                    .contactPhone(vendor != null ? vendor.getContactPhone() : null)
                    .gateId(vv.getGate() != null ? vv.getGate().getId() : null)
                    .gateName(vv.getGate() != null ? vv.getGate().getName() : null)
                    .entryTime(vv.getEntryTime())
                    .exitTime(vv.getExitTime())
                    .purpose(vv.getPurpose())
                    .vendorBlacklisted(vendor != null ? vendor.getIsBlacklisted() : null)
                    .createdByUsername(vv.getCreatedBy() != null ? vv.getCreatedBy().getUsername() : null)
                    .durationMinutes(duration)
                    .build();
        });
    }

    @Override
    public Page<GuardAttendanceReportRow> getGuardAttendanceReport(ReportFilterRequest filter, Pageable pageable) {
        Specification<Shift> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("date"), filter.getFromDate()));
            }
            if (filter.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("date"), filter.getToDate()));
            }
            if (filter.getGateId() != null) {
                predicates.add(cb.equal(root.get("gate").get("id"), filter.getGateId()));
            }
            if (filter.getGuardId() != null) {
                predicates.add(cb.equal(root.get("guard").get("id"), filter.getGuardId()));
            }
            if (StringUtils.hasText(filter.getStatus())) {
                predicates.add(cb.equal(root.get("status"),
                        ShiftStatus.valueOf(filter.getStatus())));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return shiftRepository.findAll(spec, pageable).map(s -> {
            Long duration = null;
            if (s.getEndTime() != null) {
                duration = ChronoUnit.MINUTES.between(s.getStartTime(), s.getEndTime());
            }
            Guard guard = s.getGuard();
            return GuardAttendanceReportRow.builder()
                    .guardId(guard != null ? guard.getId() : null)
                    .guardName(guard != null && guard.getUser() != null ? guard.getUser().getFullName() : null)
                    .employeeCode(guard != null ? guard.getEmployeeCode() : null)
                    .gateId(s.getGate() != null ? s.getGate().getId() : null)
                    .gateName(s.getGate() != null ? s.getGate().getName() : null)
                    .date(s.getDate())
                    .shiftStartTime(s.getStartTime())
                    .shiftEndTime(s.getEndTime())
                    .shiftStatus(s.getStatus())
                    .shiftDurationMinutes(duration)
                    .build();
        });
    }

    @Override
    public Page<GuardShiftReportRow> getGuardShiftReport(ReportFilterRequest filter, Pageable pageable) {
        Specification<Shift> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("date"), filter.getFromDate()));
            }
            if (filter.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("date"), filter.getToDate()));
            }
            if (filter.getGateId() != null) {
                predicates.add(cb.equal(root.get("gate").get("id"), filter.getGateId()));
            }
            if (filter.getGuardId() != null) {
                predicates.add(cb.equal(root.get("guard").get("id"), filter.getGuardId()));
            }
            if (StringUtils.hasText(filter.getStatus())) {
                predicates.add(cb.equal(root.get("status"),
                        ShiftStatus.valueOf(filter.getStatus())));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return shiftRepository.findAll(spec, pageable).map(s -> {
            Long duration = null;
            if (s.getEndTime() != null) {
                duration = ChronoUnit.MINUTES.between(s.getStartTime(), s.getEndTime());
            }
            Guard guard = s.getGuard();
            return GuardShiftReportRow.builder()
                    .id(s.getId())
                    .guardId(guard != null ? guard.getId() : null)
                    .guardName(guard != null && guard.getUser() != null ? guard.getUser().getFullName() : null)
                    .employeeCode(guard != null ? guard.getEmployeeCode() : null)
                    .gateId(s.getGate() != null ? s.getGate().getId() : null)
                    .gateName(s.getGate() != null ? s.getGate().getName() : null)
                    .date(s.getDate())
                    .startTime(s.getStartTime())
                    .endTime(s.getEndTime())
                    .status(s.getStatus())
                    .durationMinutes(duration)
                    .logCount(shiftLogRepository.findByShiftId(s.getId(),
                            org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements())
                    .build();
        });
    }

    @Override
    public Page<GateActivityReportRow> getGateActivityReport(ReportFilterRequest filter, Pageable pageable) {
        LocalDate fromDate = filter.getFromDate() != null ? filter.getFromDate() : LocalDate.now().minusDays(30);
        LocalDate toDate = filter.getToDate() != null ? filter.getToDate() : LocalDate.now();

        List<Gate> gates;
        if (filter.getGateId() != null) {
            gates = gateRepository.findById(filter.getGateId()).map(List::of).orElse(List.of());
        } else {
            gates = gateRepository.findAll();
        }

        List<GateActivityReportRow> rows = new ArrayList<>();
        for (Gate gate : gates) {
            OffsetDateTime start = ReportSpecifications.toStartOfDay(fromDate);
            OffsetDateTime end = ReportSpecifications.toEndOfDay(toDate);

            long visitorCheckIns = visitorRepository.countByGateIdAndTimeInBetween(gate.getId(), start, end);
            long vehicleEntries = vehicleLogRepository.countByEntryTimeBetweenAndGateId(start, end, gate.getId());
            long vendorVisits = vendorVisitRepository.countByEntryTimeBetweenAndGateId(start, end, gate.getId());
            long studentPasses = studentGatePassRepository.countByGateIdAndCreatedAtBetween(gate.getId(), start, end);
            long hostelOutpasses = hostelOutpassRepository.countByGateIdAndCreatedAtBetween(gate.getId(), start, end);

            rows.add(GateActivityReportRow.builder()
                    .gateId(gate.getId())
                    .gateName(gate.getName())
                    .gateLocation(gate.getLocation())
                    .date(fromDate)
                    .visitorCheckIns(visitorCheckIns)
                    .vehicleEntries(vehicleEntries)
                    .vendorVisits(vendorVisits)
                    .studentPasses(studentPasses)
                    .hostelOutpasses(hostelOutpasses)
                    .totalActivity(visitorCheckIns + vehicleEntries + vendorVisits + studentPasses + hostelOutpasses)
                    .build());
        }

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), rows.size());
        List<GateActivityReportRow> pageContent = start < rows.size() ? rows.subList(start, end) : List.of();

        return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, rows.size());
    }

    @Override
    public Page<AuditLogReportRow> getAuditLogReport(ReportFilterRequest filter, Pageable pageable) {
        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("timestamp"),
                        ReportSpecifications.toStartOfDay(filter.getFromDate())));
            }
            if (filter.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("timestamp"),
                        ReportSpecifications.toEndOfDay(filter.getToDate())));
            }
            if (filter.getEntityType() != null) {
                predicates.add(cb.equal(root.get("entityType"), filter.getEntityType()));
            }
            if (filter.getUserId() != null) {
                predicates.add(cb.equal(root.get("user").get("id"), filter.getUserId()));
            }
            if (StringUtils.hasText(filter.getSearch())) {
                String pattern = "%" + filter.getSearch().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("action")), pattern),
                        cb.like(cb.lower(root.get("entityType")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return auditLogRepository.findAll(spec, pageable).map(al -> AuditLogReportRow.builder()
                .id(al.getId())
                .userId(al.getUser() != null ? al.getUser().getId() : null)
                .username(al.getUser() != null ? al.getUser().getUsername() : null)
                .action(al.getAction())
                .entityType(al.getEntityType())
                .entityId(al.getEntityId())
                .oldValue(al.getOldValue())
                .newValue(al.getNewValue())
                .timestamp(al.getTimestamp())
                .build());
    }

    @Override
    public Page<NotificationReportRow> getNotificationReport(ReportFilterRequest filter, Pageable pageable) {
        Specification<Notification> spec = (root, query, cb) -> {
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

        return notificationRepository.findAll(spec, pageable).map(n -> NotificationReportRow.builder()
                .id(n.getId())
                .userId(n.getUser() != null ? n.getUser().getId() : null)
                .recipient(n.getRecipient())
                .type(n.getType())
                .eventType(n.getEventType())
                .subject(n.getSubject())
                .status(n.getStatus())
                .retryCount(n.getRetryCount())
                .sentAt(n.getSentAt())
                .createdAt(n.getCreatedAt())
                .build());
    }

    @Override
    public Page<PeriodicReportRow> getDailyReport(ReportFilterRequest filter, Pageable pageable) {
        LocalDate fromDate = filter.getFromDate() != null ? filter.getFromDate() : LocalDate.now().minusDays(30);
        LocalDate toDate = filter.getToDate() != null ? filter.getToDate() : LocalDate.now();

        List<PeriodicReportRow> rows = new ArrayList<>();
        LocalDate current = fromDate;
        while (!current.isAfter(toDate)) {
            OffsetDateTime dayStart = ReportSpecifications.toStartOfDay(current);
            OffsetDateTime dayEnd = ReportSpecifications.toEndOfDay(current);

            long visitorCheckIns = visitorRepository.countByTimeInBetween(dayStart, dayEnd);
            long visitorCheckOuts = visitorRepository.countByTimeOutBetween(dayStart, dayEnd);
            long vehicleEntries = vehicleLogRepository.countByEntryTimeBetween(dayStart, dayEnd);
            long vehicleExits = vehicleLogRepository.countByExitTimeBetween(dayStart, dayEnd);
            long vendorVisits = vendorVisitRepository.countByEntryTimeBetween(dayStart, dayEnd);
            long studentPasses = studentGatePassRepository.countByCreatedAtBetween(dayStart, dayEnd);
            long hostelOutpasses = hostelOutpassRepository.countByCreatedAtBetween(dayStart, dayEnd);
            long guardShifts = shiftRepository.countByDateBetween(current, current);

            rows.add(PeriodicReportRow.builder()
                    .periodLabel(current.toString())
                    .periodStart(current)
                    .periodEnd(current)
                    .visitorCheckIns(visitorCheckIns)
                    .visitorCheckOuts(visitorCheckOuts)
                    .vehicleEntries(vehicleEntries)
                    .vehicleExits(vehicleExits)
                    .vendorVisits(vendorVisits)
                    .studentPassesIssued(studentPasses)
                    .hostelOutpassesIssued(hostelOutpasses)
                    .guardShiftsTotal(guardShifts)
                    .totalActivity(visitorCheckIns + vehicleEntries + vendorVisits + studentPasses + hostelOutpasses)
                    .build());

            current = current.plusDays(1);
        }

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), rows.size());
        List<PeriodicReportRow> pageContent = start < rows.size() ? rows.subList(start, end) : List.of();

        return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, rows.size());
    }

    @Override
    public Page<PeriodicReportRow> getWeeklyReport(ReportFilterRequest filter, Pageable pageable) {
        LocalDate fromDate = filter.getFromDate() != null ? filter.getFromDate() : LocalDate.now().minusWeeks(12);
        LocalDate toDate = filter.getToDate() != null ? filter.getToDate() : LocalDate.now();

        List<PeriodicReportRow> rows = new ArrayList<>();
        LocalDate weekStart = fromDate.with(java.time.DayOfWeek.MONDAY);
        while (!weekStart.isAfter(toDate)) {
            LocalDate weekEnd = weekStart.plusDays(6);
            OffsetDateTime start = ReportSpecifications.toStartOfDay(weekStart);
            OffsetDateTime end = ReportSpecifications.toEndOfDay(weekEnd);

            long visitorCheckIns = visitorRepository.countByTimeInBetween(start, end);
            long vehicleEntries = vehicleLogRepository.countByEntryTimeBetween(start, end);
            long vendorVisits = vendorVisitRepository.countByEntryTimeBetween(start, end);
            long studentPasses = studentGatePassRepository.countByCreatedAtBetween(start, end);
            long hostelOutpasses = hostelOutpassRepository.countByCreatedAtBetween(start, end);
            long guardShifts = shiftRepository.countByDateBetween(weekStart, weekEnd);

            rows.add(PeriodicReportRow.builder()
                    .periodLabel(weekStart + " to " + weekEnd)
                    .periodStart(weekStart)
                    .periodEnd(weekEnd)
                    .visitorCheckIns(visitorCheckIns)
                    .vehicleEntries(vehicleEntries)
                    .vendorVisits(vendorVisits)
                    .studentPassesIssued(studentPasses)
                    .hostelOutpassesIssued(hostelOutpasses)
                    .guardShiftsTotal(guardShifts)
                    .totalActivity(visitorCheckIns + vehicleEntries + vendorVisits + studentPasses + hostelOutpasses)
                    .build());

            weekStart = weekStart.plusWeeks(1);
        }

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), rows.size());
        List<PeriodicReportRow> pageContent = start < rows.size() ? rows.subList(start, end) : List.of();

        return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, rows.size());
    }

    @Override
    public Page<PeriodicReportRow> getMonthlyReport(ReportFilterRequest filter, Pageable pageable) {
        LocalDate fromDate = filter.getFromDate() != null ? filter.getFromDate() : LocalDate.now().minusMonths(12);
        LocalDate toDate = filter.getToDate() != null ? filter.getToDate() : LocalDate.now();

        List<PeriodicReportRow> rows = new ArrayList<>();
        LocalDate monthStart = fromDate.withDayOfMonth(1);
        while (!monthStart.isAfter(toDate)) {
            LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
            OffsetDateTime start = ReportSpecifications.toStartOfDay(monthStart);
            OffsetDateTime end = ReportSpecifications.toEndOfDay(monthEnd);

            long visitorCheckIns = visitorRepository.countByTimeInBetween(start, end);
            long vehicleEntries = vehicleLogRepository.countByEntryTimeBetween(start, end);
            long vendorVisits = vendorVisitRepository.countByEntryTimeBetween(start, end);
            long studentPasses = studentGatePassRepository.countByCreatedAtBetween(start, end);
            long hostelOutpasses = hostelOutpassRepository.countByCreatedAtBetween(start, end);
            long guardShifts = shiftRepository.countByDateBetween(monthStart, monthEnd);
            long notifications = notificationRepository.countByCreatedAtBetween(start, end);

            rows.add(PeriodicReportRow.builder()
                    .periodLabel(monthStart.getMonth() + " " + monthStart.getYear())
                    .periodStart(monthStart)
                    .periodEnd(monthEnd)
                    .visitorCheckIns(visitorCheckIns)
                    .vehicleEntries(vehicleEntries)
                    .vendorVisits(vendorVisits)
                    .studentPassesIssued(studentPasses)
                    .hostelOutpassesIssued(hostelOutpasses)
                    .guardShiftsTotal(guardShifts)
                    .notificationsSent(notifications)
                    .totalActivity(visitorCheckIns + vehicleEntries + vendorVisits + studentPasses + hostelOutpasses)
                    .build());

            monthStart = monthStart.plusMonths(1);
        }

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), rows.size());
        List<PeriodicReportRow> pageContent = start < rows.size() ? rows.subList(start, end) : List.of();

        return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, rows.size());
    }

    @Override
    public Page<PeriodicReportRow> getYearlyReport(ReportFilterRequest filter, Pageable pageable) {
        LocalDate fromDate = filter.getFromDate() != null ? filter.getFromDate() : LocalDate.now().minusYears(5);
        LocalDate toDate = filter.getToDate() != null ? filter.getToDate() : LocalDate.now();

        List<PeriodicReportRow> rows = new ArrayList<>();
        int startYear = fromDate.getYear();
        int endYear = toDate.getYear();

        for (int year = startYear; year <= endYear; year++) {
            LocalDate yearStart = LocalDate.of(year, 1, 1);
            LocalDate yearEnd = LocalDate.of(year, 12, 31);
            OffsetDateTime start = ReportSpecifications.toStartOfDay(yearStart);
            OffsetDateTime end = ReportSpecifications.toEndOfDay(yearEnd);

            long visitorCheckIns = visitorRepository.countByTimeInBetween(start, end);
            long vehicleEntries = vehicleLogRepository.countByEntryTimeBetween(start, end);
            long vendorVisits = vendorVisitRepository.countByEntryTimeBetween(start, end);
            long studentPasses = studentGatePassRepository.countByCreatedAtBetween(start, end);
            long hostelOutpasses = hostelOutpassRepository.countByCreatedAtBetween(start, end);
            long guardShifts = shiftRepository.countByDateBetween(yearStart, yearEnd);
            long notifications = notificationRepository.countByCreatedAtBetween(start, end);

            rows.add(PeriodicReportRow.builder()
                    .periodLabel(String.valueOf(year))
                    .periodStart(yearStart)
                    .periodEnd(yearEnd)
                    .visitorCheckIns(visitorCheckIns)
                    .vehicleEntries(vehicleEntries)
                    .vendorVisits(vendorVisits)
                    .studentPassesIssued(studentPasses)
                    .hostelOutpassesIssued(hostelOutpasses)
                    .guardShiftsTotal(guardShifts)
                    .notificationsSent(notifications)
                    .totalActivity(visitorCheckIns + vehicleEntries + vendorVisits + studentPasses + hostelOutpasses)
                    .build());
        }

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), rows.size());
        List<PeriodicReportRow> pageContent = start < rows.size() ? rows.subList(start, end) : List.of();

        return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, rows.size());
    }

    @Override
    public DashboardSummaryResponse getDashboardSummary() {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime dayStart = now.toLocalDate().atStartOfDay().atOffset(now.getOffset());
        OffsetDateTime dayEnd = now.toLocalDate().atTime(23, 59, 59).atOffset(now.getOffset());

        long guardsOnDuty = shiftRepository.countByStatus(ShiftStatus.ONGOING);
        long visitorsInside = visitorRepository.countByTimeOutIsNull();
        long vehiclesInside = vehicleLogRepository.countByExitTimeIsNull();
        long vendorVisitsInside = vendorVisitRepository.countByExitTimeIsNull();

        long todayVisitors = visitorRepository.countByTimeInBetween(dayStart, dayEnd);
        long todayVehicleEntries = vehicleLogRepository.countByEntryTimeBetween(dayStart, dayEnd);
        long todayVendorVisits = vendorVisitRepository.countByEntryTimeBetween(dayStart, dayEnd);
        long todayStudentPasses = studentGatePassRepository.countByCreatedAtBetween(dayStart, dayEnd);
        long todayHostelOutpasses = hostelOutpassRepository.countByCreatedAtBetween(dayStart, dayEnd);
        long pendingNotifications = notificationRepository.countByStatusAndCreatedAtBetween(
                NotificationStatus.PENDING, dayStart, dayEnd);
        long blacklistedToday = visitorRepository.countByIsBlacklistedMatchTrueAndTimeInBetween(dayStart, dayEnd);

        long canteenPresent = 0;
        for (CanteenStaff staff : canteenStaffRepository.findByActiveTrue(
                org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE)).getContent()) {
            canteenEntryRepository.findByStaffIdAndDate(staff.getId(), now.toLocalDate())
                    .ifPresent(entry -> {
                        if (entry.getStatus() == EntryStatus.PRESENT || entry.getStatus() == EntryStatus.LATE) {
                            // counted via stream below
                        }
                    });
        }

        OffsetDateTime threshold = now.minusHours(4);
        long overstayingVisitors = visitorRepository.findOverstaying(threshold).size();

        return DashboardSummaryResponse.builder()
                .guardsOnDuty(guardsOnDuty)
                .visitorsCurrentlyInside(visitorsInside)
                .vehiclesCurrentlyInside(vehiclesInside)
                .overstayingVisitors(overstayingVisitors)
                .todayTotalVisitors(todayVisitors)
                .todayTotalVehicleEntries(todayVehicleEntries)
                .todayTotalVendorVisits(todayVendorVisits)
                .todayStudentPassesIssued(todayStudentPasses)
                .todayHostelOutpassesIssued(todayHostelOutpasses)
                .pendingNotifications(pendingNotifications)
                .blacklistedMatchesToday(blacklistedToday)
                .build();
    }
}
