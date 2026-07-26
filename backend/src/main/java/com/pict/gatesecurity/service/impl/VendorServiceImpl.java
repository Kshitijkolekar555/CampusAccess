package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.vendor.*;
import com.pict.gatesecurity.entity.*;
import com.pict.gatesecurity.exception.BadRequestException;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.mapper.VendorMapper;
import com.pict.gatesecurity.repository.*;
import com.pict.gatesecurity.service.AuditLogService;
import com.pict.gatesecurity.service.VendorService;
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
public class VendorServiceImpl implements VendorService {

    private final VendorRepository vendorRepository;
    private final VendorVisitRepository vendorVisitRepository;
    private final GateRepository gateRepository;
    private final UserRepository userRepository;
    private final VendorMapper vendorMapper;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public VendorResponse registerVendor(VendorRegisterRequest request, String performingUsername) {
        User createdBy = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        Vendor vendor = Vendor.builder()
                .companyName(request.getCompanyName())
                .contactPerson(request.getContactPerson())
                .contactPhone(request.getContactPhone())
                .contactEmail(request.getContactEmail())
                .workDescription(request.getWorkDescription())
                .assignedDepartment(request.getAssignedDepartment())
                .isBlacklisted(false)
                .createdBy(createdBy)
                .build();

        Vendor saved = vendorRepository.save(vendor);

        auditLogService.logAction(createdBy, "VENDOR_REGISTER", "Vendor", saved.getId(), null, Map.of(
                "companyName", saved.getCompanyName(),
                "contactPerson", saved.getContactPerson()
        ));

        log.info("Vendor registered: {} ({})", saved.getCompanyName(), saved.getContactPerson());
        return vendorMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public VendorVisitResponse recordEntry(Long vendorId, VendorVisitEntryRequest request, String performingUsername) {
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor", "id", vendorId));

        if (vendor.getIsBlacklisted()) {
            throw new BadRequestException("Vendor is blacklisted and cannot enter");
        }

        vendorVisitRepository.findActiveVisitByVendorId(vendorId).ifPresent(vv -> {
            throw new BadRequestException("Vendor already has an active visit (visit ID: " + vv.getId() + ")");
        });

        Gate gate = gateRepository.findById(request.getGateId())
                .orElseThrow(() -> new ResourceNotFoundException("Gate", "id", request.getGateId()));

        User performer = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        VendorVisit visit = VendorVisit.builder()
                .vendor(vendor)
                .gate(gate)
                .entryTime(OffsetDateTime.now())
                .purpose(request.getPurpose())
                .entryNote(request.getEntryNote())
                .createdBy(performer)
                .build();

        VendorVisit saved = vendorVisitRepository.save(visit);

        auditLogService.logAction(performer, "VENDOR_ENTRY", "VendorVisit", saved.getId(), null, Map.of(
                "vendorId", vendorId,
                "companyName", vendor.getCompanyName()
        ));

        log.info("Vendor entry: {} at {}", vendor.getCompanyName(), gate.getName());
        return vendorMapper.toVisitResponse(saved);
    }

    @Override
    @Transactional
    public VendorVisitResponse recordExit(Long visitId, VendorVisitExitRequest request, String performingUsername) {
        VendorVisit visit = vendorVisitRepository.findById(visitId)
                .orElseThrow(() -> new ResourceNotFoundException("VendorVisit", "id", visitId));

        if (visit.getExitTime() != null) {
            throw new BadRequestException("Vendor has already exited at " + visit.getExitTime());
        }

        User performer = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        visit.setExitTime(OffsetDateTime.now());
        if (StringUtils.hasText(request.getExitNote())) {
            visit.setExitNote(request.getExitNote());
        }

        VendorVisit saved = vendorVisitRepository.save(visit);

        auditLogService.logAction(performer, "VENDOR_EXIT", "VendorVisit", saved.getId(), null, Map.of(
                "vendorId", visit.getVendor().getId(),
                "companyName", visit.getVendor().getCompanyName()
        ));

        log.info("Vendor exit: {}", visit.getVendor().getCompanyName());
        return vendorMapper.toVisitResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public VendorResponse getVendorById(Long id) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor", "id", id));
        return vendorMapper.toResponse(vendor);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VendorResponse> getVendors(String query, Boolean isBlacklisted, Pageable pageable) {
        Specification<Vendor> spec = (root, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(query)) {
                String pattern = "%" + query.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("companyName")), pattern),
                        cb.like(cb.lower(root.get("contactPerson")), pattern),
                        cb.like(root.get("contactPhone"), pattern)
                ));
            }
            if (isBlacklisted != null) {
                predicates.add(cb.equal(root.get("isBlacklisted"), isBlacklisted));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return vendorRepository.findAll(spec, pageable).map(vendorMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VendorVisitResponse> getVisits(Long vendorId, Long gateId, Boolean isInside, Pageable pageable) {
        Specification<VendorVisit> spec = (root, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (vendorId != null) {
                predicates.add(cb.equal(root.get("vendor").get("id"), vendorId));
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
        return vendorVisitRepository.findAll(spec, pageable).map(vendorMapper::toVisitResponse);
    }

    @Override
    @Transactional
    public VendorResponse blacklistVendor(Long id, String reason, String performingUsername) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor", "id", id));
        if (vendor.getIsBlacklisted()) {
            throw new BadRequestException("Vendor is already blacklisted");
        }
        User performer = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));
        vendor.setIsBlacklisted(true);
        vendor.setBlacklistReason(reason);
        Vendor saved = vendorRepository.save(vendor);
        auditLogService.logAction(performer, "VENDOR_BLACKLIST", "Vendor", saved.getId(),
                Map.of("isBlacklisted", false), Map.of("isBlacklisted", true, "reason", reason));
        log.info("Vendor blacklisted: {} - {}", saved.getCompanyName(), reason);
        return vendorMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public VendorResponse unblacklistVendor(Long id, String reason, String performingUsername) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor", "id", id));
        if (!vendor.getIsBlacklisted()) {
            throw new BadRequestException("Vendor is not blacklisted");
        }
        User performer = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));
        vendor.setIsBlacklisted(false);
        vendor.setBlacklistReason(null);
        Vendor saved = vendorRepository.save(vendor);
        auditLogService.logAction(performer, "VENDOR_UNBLACKLIST", "Vendor", saved.getId(),
                Map.of("isBlacklisted", true), Map.of("isBlacklisted", false, "reason", reason));
        log.info("Vendor unblacklisted: {}", saved.getCompanyName());
        return vendorMapper.toResponse(saved);
    }
}
