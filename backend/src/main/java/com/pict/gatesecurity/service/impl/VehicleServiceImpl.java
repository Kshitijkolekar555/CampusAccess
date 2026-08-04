package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.vehicle.*;
import com.pict.gatesecurity.entity.*;
import com.pict.gatesecurity.entity.enums.VehicleCategory;
import com.pict.gatesecurity.exception.BadRequestException;
import com.pict.gatesecurity.exception.DuplicateResourceException;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.mapper.VehicleMapper;
import com.pict.gatesecurity.repository.*;
import com.pict.gatesecurity.service.AuditLogService;
import com.pict.gatesecurity.service.VehicleService;
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
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final VehicleLogRepository vehicleLogRepository;
    private final GateRepository gateRepository;
    private final UserRepository userRepository;
    private final VehicleMapper vehicleMapper;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public VehicleResponse registerVehicle(VehicleRegisterRequest request, String performingUsername) {
        String normalizedRegNumber = request.getRegistrationNumber().toUpperCase();

        if (vehicleRepository.existsByRegistrationNumber(normalizedRegNumber)) {
            throw new DuplicateResourceException("Vehicle with registration number " + normalizedRegNumber + " already exists");
        }

        User createdBy = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        User ownerUser = null;
        if (request.getOwnerUserId() != null) {
            ownerUser = userRepository.findById(request.getOwnerUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getOwnerUserId()));
        }

        Vehicle vehicle = Vehicle.builder()
                .registrationNumber(normalizedRegNumber)
                .vehicleType(request.getVehicleType())
                .category(request.getCategory())
                .ownerName(request.getOwnerName())
                .ownerContact(request.getOwnerContact())
                .ownerUser(ownerUser)
                .color(request.getColor())
                .isBlacklisted(false)
                .blacklistReason(null)
                .createdBy(createdBy)
                .build();

        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        auditLogService.logAction(createdBy, "VEHICLE_REGISTER", "Vehicle", savedVehicle.getId(), null, Map.of(
                "registrationNumber", savedVehicle.getRegistrationNumber(),
                "category", savedVehicle.getCategory().name()
        ));

        log.info("Vehicle registered: {} ({})", savedVehicle.getRegistrationNumber(), savedVehicle.getCategory());
        return vehicleMapper.toResponse(savedVehicle);
    }

    @Override
    @Transactional
    public VehicleLogResponse recordEntry(Long vehicleId, VehicleEntryRequest request, String performingUsername) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", vehicleId));

        if (vehicle.getIsBlacklisted()) {
            throw new BadRequestException("Vehicle is blacklisted and cannot enter");
        }

        Gate gate = gateRepository.findById(request.getGateId())
                .orElseThrow(() -> new ResourceNotFoundException("Gate", "id", request.getGateId()));

        User performer = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        vehicleLogRepository.findActiveEntryByVehicleId(vehicleId).ifPresent(vl -> {
            throw new BadRequestException("Vehicle already has an active entry (log ID: " + vl.getId() + ")");
        });

        VehicleLog vehicleLog = VehicleLog.builder()
                .vehicle(vehicle)
                .gate(gate)
                .entryTime(OffsetDateTime.now())
                .exitTime(null)
                .actionTime(OffsetDateTime.now())
                .processedByGuard(performer)
                .driverName(request.getDriverName())
                .driverContact(request.getDriverContact())
                .purpose(request.getPurpose())
                .entryNote(request.getEntryNote())
                .exitNote(null)
                .createdBy(performer)
                .build();

        VehicleLog savedLog = vehicleLogRepository.save(vehicleLog);

        auditLogService.logAction(performer, "VEHICLE_ENTRY", "VehicleLog", savedLog.getId(), null, Map.of(
                "vehicleId", vehicleId,
                "registrationNumber", vehicle.getRegistrationNumber(),
                "gateId", request.getGateId()
        ));

        log.info("Vehicle entry recorded: {} at gate {}", vehicle.getRegistrationNumber(), gate.getName());
        return vehicleMapper.toLogResponse(savedLog);
    }

    @Override
    @Transactional
    public VehicleLogResponse recordExit(Long logId, VehicleExitRequest request, String performingUsername) {
        VehicleLog vehicleLog = vehicleLogRepository.findById(logId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle active entry log not found for ID: " + logId));

        if (vehicleLog.getExitTime() != null) {
            throw new BadRequestException("Vehicle has already exited at " + vehicleLog.getExitTime());
        }

        User performer = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        vehicleLog.setExitTime(OffsetDateTime.now());
        vehicleLog.setActionTime(OffsetDateTime.now());
        vehicleLog.setProcessedByGuard(performer);

        if (StringUtils.hasText(request.getExitNote())) {
            vehicleLog.setExitNote(request.getExitNote());
        }

        VehicleLog savedLog = vehicleLogRepository.save(vehicleLog);

        auditLogService.logAction(performer, "VEHICLE_EXIT", "VehicleLog", savedLog.getId(), null, Map.of(
                "vehicleId", vehicleLog.getVehicle().getId(),
                "registrationNumber", vehicleLog.getVehicle().getRegistrationNumber(),
                "exitTime", savedLog.getExitTime().toString()
        ));

        log.info("Vehicle exit recorded: {}", vehicleLog.getVehicle().getRegistrationNumber());
        return vehicleMapper.toLogResponse(savedLog);
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleResponse getVehicleById(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));
        return vehicleMapper.toResponse(vehicle);
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleResponse getVehicleByRegistrationNumber(String registrationNumber) {
        Vehicle vehicle = vehicleRepository.findByRegistrationNumber(registrationNumber.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "registrationNumber", registrationNumber));
        return vehicleMapper.toResponse(vehicle);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VehicleResponse> getVehicles(String query, VehicleCategory category, Boolean isBlacklisted, Pageable pageable) {
        Specification<Vehicle> spec = (root, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(query)) {
                String searchPattern = "%" + query.toLowerCase() + "%";
                Predicate regMatch = cb.like(cb.lower(root.get("registrationNumber")), searchPattern);
                Predicate ownerMatch = cb.like(cb.lower(root.get("ownerName")), searchPattern);
                Predicate contactMatch = cb.like(root.get("ownerContact"), searchPattern);
                predicates.add(cb.or(regMatch, ownerMatch, contactMatch));
            }

            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }

            if (isBlacklisted != null) {
                predicates.add(cb.equal(root.get("isBlacklisted"), isBlacklisted));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return vehicleRepository.findAll(spec, pageable).map(vehicleMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VehicleLogResponse> getVehicleLogs(Long vehicleId, Long gateId, Boolean isInside, Pageable pageable) {
        Specification<VehicleLog> spec = (root, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (vehicleId != null) {
                predicates.add(cb.equal(root.get("vehicle").get("id"), vehicleId));
            }

            if (gateId != null) {
                predicates.add(cb.equal(root.get("gate").get("id"), gateId));
            }

            if (Boolean.TRUE.equals(isInside)) {
                predicates.add(cb.isNull(root.get("exitTime")));
            } else if (Boolean.FALSE.equals(isInside)) {
                predicates.add(cb.isNotNull(root.get("exitTime")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return vehicleLogRepository.findAll(spec, pageable).map(vehicleMapper::toLogResponse);
    }

    @Override
    @Transactional
    public VehicleResponse blacklistVehicle(Long id, String reason, String performingUsername) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));

        if (vehicle.getIsBlacklisted()) {
            throw new BadRequestException("Vehicle is already blacklisted");
        }

        User performer = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        vehicle.setIsBlacklisted(true);
        vehicle.setBlacklistReason(reason);

        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        auditLogService.logAction(performer, "VEHICLE_BLACKLIST", "Vehicle", savedVehicle.getId(),
                Map.of("isBlacklisted", false),
                Map.of("isBlacklisted", true, "reason", reason)
        );

        log.info("Vehicle blacklisted: {} - Reason: {}", savedVehicle.getRegistrationNumber(), reason);
        return vehicleMapper.toResponse(savedVehicle);
    }

    @Override
    @Transactional
    public VehicleResponse unblacklistVehicle(Long id, String reason, String performingUsername) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", "id", id));

        if (!vehicle.getIsBlacklisted()) {
            throw new BadRequestException("Vehicle is not blacklisted");
        }

        User performer = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        vehicle.setIsBlacklisted(false);
        vehicle.setBlacklistReason(null);

        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        auditLogService.logAction(performer, "VEHICLE_UNBLACKLIST", "Vehicle", savedVehicle.getId(),
                Map.of("isBlacklisted", true),
                Map.of("isBlacklisted", false, "reason", reason)
        );

        log.info("Vehicle unblacklisted: {} - Reason: {}", savedVehicle.getRegistrationNumber(), reason);
        return vehicleMapper.toResponse(savedVehicle);
    }
}
