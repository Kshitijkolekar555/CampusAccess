package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.guard.*;
import com.pict.gatesecurity.entity.*;
import com.pict.gatesecurity.entity.enums.ShiftStatus;
import com.pict.gatesecurity.exception.BadRequestException;
import com.pict.gatesecurity.exception.DuplicateResourceException;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.mapper.GuardMapper;
import com.pict.gatesecurity.repository.*;
import com.pict.gatesecurity.service.AuditLogService;
import com.pict.gatesecurity.service.GuardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GuardServiceImpl implements GuardService {

    private final GuardRepository guardRepository;
    private final GateRepository gateRepository;
    private final UserRepository userRepository;
    private final ShiftRepository shiftRepository;
    private final ShiftLogRepository shiftLogRepository;
    private final VisitorRepository visitorRepository;
    private final GuardMapper guardMapper;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public GuardResponse createGuard(GuardCreateRequest request, String performingUsername) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));

        if (guardRepository.existsByEmployeeCode(request.getEmployeeCode())) {
            throw new DuplicateResourceException("Employee code '" + request.getEmployeeCode() + "' is already registered");
        }

        Gate assignedGate = null;
        if (request.getAssignedGateId() != null) {
            assignedGate = gateRepository.findById(request.getAssignedGateId())
                    .orElseThrow(() -> new ResourceNotFoundException("Gate", "id", request.getAssignedGateId()));
        }

        User performer = userRepository.findByUsername(performingUsername).orElse(null);

        Guard guard = Guard.builder()
                .user(user)
                .employeeCode(request.getEmployeeCode())
                .assignedGate(assignedGate)
                .active(true)
                .build();

        Guard savedGuard = guardRepository.save(guard);

        auditLogService.logAction(performer, "CREATE_GUARD", "Guard", savedGuard.getId(), null, Map.of(
                "employeeCode", savedGuard.getEmployeeCode(),
                "userId", user.getId()
        ));

        return guardMapper.toResponse(savedGuard);
    }

    @Override
    @Transactional
    public GuardResponse updateGuard(Long id, GuardUpdateRequest request, String performingUsername) {
        Guard guard = guardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Guard", "id", id));

        Gate assignedGate = null;
        if (request.getAssignedGateId() != null) {
            assignedGate = gateRepository.findById(request.getAssignedGateId())
                    .orElseThrow(() -> new ResourceNotFoundException("Gate", "id", request.getAssignedGateId()));
        }

        User performer = userRepository.findByUsername(performingUsername).orElse(null);

        guard.setAssignedGate(assignedGate);
        if (request.getActive() != null) {
            guard.setActive(request.getActive());
        }

        Guard updatedGuard = guardRepository.save(guard);

        auditLogService.logAction(performer, "UPDATE_GUARD", "Guard", updatedGuard.getId(), null, Map.of(
                "employeeCode", updatedGuard.getEmployeeCode(),
                "active", updatedGuard.getActive()
        ));

        return guardMapper.toResponse(updatedGuard);
    }

    @Override
    @Transactional(readOnly = true)
    public GuardResponse getGuardById(Long id) {
        Guard guard = guardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Guard", "id", id));
        return guardMapper.toResponse(guard);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<GuardResponse> getGuards(Boolean activeOnly, Pageable pageable) {
        if (Boolean.TRUE.equals(activeOnly)) {
            return guardRepository.findByActiveTrue(pageable).map(guardMapper::toResponse);
        }
        return guardRepository.findAll(pageable).map(guardMapper::toResponse);
    }

    @Override
    @Transactional
    public ShiftResponse startShift(ShiftStartRequest request, String performingUsername) {
        User user = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        Guard guard = guardRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Guard newGuard = Guard.builder()
                            .user(user)
                            .employeeCode("G-" + user.getId())
                            .active(true)
                            .build();
                    return guardRepository.save(newGuard);
                });

        Optional<Shift> ongoingShift = shiftRepository.findByGuardIdAndStatus(guard.getId(), ShiftStatus.ONGOING);
        if (ongoingShift.isPresent()) {
            throw new BadRequestException("Shift already active. Please end current shift before starting a new shift.");
        }

        Gate gate = gateRepository.findById(request.getGateId())
                .orElseThrow(() -> new ResourceNotFoundException("Gate", "id", request.getGateId()));

        Shift shift = Shift.builder()
                .guard(guard)
                .gate(gate)
                .startTime(OffsetDateTime.now())
                .endTime(null)
                .date(LocalDate.now())
                .status(ShiftStatus.ONGOING)
                .build();

        Shift savedShift = shiftRepository.save(shift);

        auditLogService.logAction(user, "START_SHIFT", "Shift", savedShift.getId(), null, Map.of(
                "guardId", guard.getId(),
                "gateId", gate.getId()
        ));

        return guardMapper.toShiftResponse(savedShift);
    }

    @Override
    @Transactional
    public ShiftResponse endShift(String performingUsername) {
        User user = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        Guard guard = guardRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Guard newGuard = Guard.builder()
                            .user(user)
                            .employeeCode("G-" + user.getId())
                            .active(true)
                            .build();
                    return guardRepository.save(newGuard);
                });

        Shift shift = shiftRepository.findByGuardIdAndStatus(guard.getId(), ShiftStatus.ONGOING)
                .orElseThrow(() -> new BadRequestException("No active shift to close"));

        shift.setEndTime(OffsetDateTime.now());
        shift.setStatus(ShiftStatus.COMPLETED);

        Shift updatedShift = shiftRepository.save(shift);

        auditLogService.logAction(user, "END_SHIFT", "Shift", updatedShift.getId(), null, Map.of(
                "guardId", guard.getId(),
                "endTime", updatedShift.getEndTime().toString()
        ));

        return guardMapper.toShiftResponse(updatedShift);
    }

    @Override
    @Transactional(readOnly = true)
    public ShiftResponse getCurrentShift(String performingUsername) {
        User user = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        Guard guard = guardRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Guard newGuard = Guard.builder()
                            .user(user)
                            .employeeCode("G-" + user.getId())
                            .active(true)
                            .build();
                    return guardRepository.save(newGuard);
                });

        Shift shift = shiftRepository.findByGuardIdAndStatus(guard.getId(), ShiftStatus.ONGOING)
                .orElseThrow(() -> new ResourceNotFoundException("No active ongoing shift for current guard"));

        return guardMapper.toShiftResponse(shift);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ShiftResponse> getShiftHistory(String performingUsername, Pageable pageable) {
        User user = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        Guard guard = guardRepository.findByUserId(user.getId()).orElse(null);
        if (guard == null) {
            return Page.empty(pageable);
        }

        return shiftRepository.findByGuardId(guard.getId(), pageable).map(guardMapper::toShiftResponse);
    }

    @Override
    @Transactional
    public ShiftLogResponse addShiftLog(Long shiftId, ShiftLogCreateRequest request, String performingUsername) {
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", shiftId));

        if (shift.getStatus() != ShiftStatus.ONGOING) {
            throw new BadRequestException("Cannot add log to a completed or aborted shift");
        }

        User performer = userRepository.findByUsername(performingUsername).orElse(null);

        ShiftLog shiftLog = ShiftLog.builder()
                .shift(shift)
                .timestamp(OffsetDateTime.now())
                .description(request.getDescription())
                .logType(request.getLogType())
                .build();

        ShiftLog savedLog = shiftLogRepository.save(shiftLog);

        auditLogService.logAction(performer, "ADD_SHIFT_LOG", "ShiftLog", savedLog.getId(), null, Map.of(
                "shiftId", shiftId,
                "logType", request.getLogType().name()
        ));

        return guardMapper.toShiftLogResponse(savedLog);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ShiftLogResponse> getShiftLogs(Long shiftId, Pageable pageable) {
        return shiftLogRepository.findByShiftId(shiftId, pageable).map(guardMapper::toShiftLogResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public GuardDashboardResponse getGuardDashboard() {
        long activeShiftsCount = shiftRepository.countByStatus(ShiftStatus.ONGOING);
        long activeGuardCount = guardRepository.count();
        long activeVisitorsInsideCount = visitorRepository.countByTimeOutIsNull();
        OffsetDateTime todayStart = LocalDate.now().atStartOfDay(ZoneOffset.ofHoursMinutes(5, 30)).toOffsetDateTime();
        OffsetDateTime todayEnd = LocalDate.now().plusDays(1).atStartOfDay(ZoneOffset.ofHoursMinutes(5, 30)).toOffsetDateTime();
        long totalVisitorsCheckedInTodayCount = visitorRepository.countByTimeInBetween(todayStart, todayEnd);

        Pageable topLogsPage = PageRequest.of(0, 10, Sort.by("timestamp").descending());
        List<ShiftLogResponse> recentLogs = shiftLogRepository.findAll(topLogsPage).getContent()
                .stream().map(guardMapper::toShiftLogResponse).collect(Collectors.toList());

        return GuardDashboardResponse.builder()
                .activeShiftsCount(activeShiftsCount)
                .activeGuardCount(activeGuardCount)
                .activeVisitorsInsideCount(activeVisitorsInsideCount)
                .totalVisitorsCheckedInTodayCount(totalVisitorsCheckedInTodayCount)
                .recentLogs(recentLogs)
                .build();
    }
}
