package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.visitor.VisitorCheckInRequest;
import com.pict.gatesecurity.dto.visitor.VisitorCheckOutRequest;
import com.pict.gatesecurity.dto.visitor.VisitorResponse;
import com.pict.gatesecurity.entity.Gate;
import com.pict.gatesecurity.entity.User;
import com.pict.gatesecurity.entity.Visitor;
import com.pict.gatesecurity.entity.WatchlistEntry;
import com.pict.gatesecurity.entity.enums.HostDepartment;
import com.pict.gatesecurity.entity.enums.HostType;
import com.pict.gatesecurity.exception.BadRequestException;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.mapper.VisitorMapper;
import com.pict.gatesecurity.repository.GateRepository;
import com.pict.gatesecurity.repository.UserRepository;
import com.pict.gatesecurity.repository.VisitorRepository;
import com.pict.gatesecurity.repository.WatchlistRepository;
import com.pict.gatesecurity.service.AuditLogService;
import com.pict.gatesecurity.service.VisitorService;
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
import com.pict.gatesecurity.config.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VisitorServiceImpl implements VisitorService {

    private final VisitorRepository visitorRepository;
    private final GateRepository gateRepository;
    private final UserRepository userRepository;
    private final WatchlistRepository watchlistRepository;
    private final VisitorMapper visitorMapper;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.CACHE_ADMIN_DASHBOARD, CacheConfig.CACHE_GUARD_DASHBOARD}, allEntries = true)
    public VisitorResponse checkIn(VisitorCheckInRequest request, String performingUsername) {
        Gate gate = gateRepository.findById(request.getGateId())
                .orElseThrow(() -> new ResourceNotFoundException("Gate", "id", request.getGateId()));

        User createdBy = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        // Prevent duplicate active check-in
        visitorRepository.findFirstByMobileAndTimeOutIsNullOrderByTimeInDesc(request.getMobile())
                .ifPresent(v -> {
                    throw new BadRequestException("Visitor with mobile " + request.getMobile()
                            + " is already checked in (Visitor ID: " + v.getId() + " at " + v.getTimeIn() + ")");
                });

        // Automatic Watchlist Check
        List<WatchlistEntry> matches = watchlistRepository.findMatchingEntries(request.getMobile(), request.getName());
        boolean isBlacklistedMatch = !matches.isEmpty();

        if (isBlacklistedMatch) {
            log.warn("WATCHLIST WARNING: Visitor {} (Mobile: {}) matched watchlist entries!", request.getName(), request.getMobile());
        }

        Visitor visitor = Visitor.builder()
                .name(request.getName())
                .mobile(request.getMobile())
                .purpose(request.getPurpose())
                .hostName(request.getHostName())
                .hostType(request.getHostType())
                .hostDepartment(request.getHostDepartment())
                .studentPrn(request.getStudentPrn())
                .gate(gate)
                .vehicleNumber(request.getVehicleNumber())
                .timeIn(OffsetDateTime.now())
                .timeOut(null)
                .idProofType(request.getIdProofType())
                .idProofNumber(request.getIdProofNumber())
                .photoUrl(request.getPhotoUrl())
                .isBlacklistedMatch(isBlacklistedMatch)
                .notes(request.getNotes())
                .createdBy(createdBy)
                .build();

        Visitor savedVisitor = visitorRepository.save(visitor);

        auditLogService.logAction(createdBy, "VISITOR_CHECK_IN", "Visitor", savedVisitor.getId(), null, Map.of(
                "name", savedVisitor.getName(),
                "mobile", savedVisitor.getMobile(),
                "isBlacklistedMatch", isBlacklistedMatch
        ));

        return visitorMapper.toResponse(savedVisitor);
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.CACHE_ADMIN_DASHBOARD, CacheConfig.CACHE_GUARD_DASHBOARD}, allEntries = true)
    public VisitorResponse checkOut(VisitorCheckOutRequest request, String performingUsername) {
        Visitor visitor = null;

        if (request.getVisitorId() != null) {
            visitor = visitorRepository.findById(request.getVisitorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Visitor", "id", request.getVisitorId()));
        } else if (StringUtils.hasText(request.getPassCode())) {
            try {
                String idStr = request.getPassCode().replace("PICT-PASS-", "").trim();
                Long id = Long.parseLong(idStr);
                visitor = visitorRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Visitor with pass code: " + request.getPassCode()));
            } catch (Exception e) {
                throw new BadRequestException("Invalid pass code format: " + request.getPassCode());
            }
        } else if (StringUtils.hasText(request.getMobile())) {
            visitor = visitorRepository.findFirstByMobileAndTimeOutIsNullOrderByTimeInDesc(request.getMobile())
                    .orElseThrow(() -> new ResourceNotFoundException("Active visitor with mobile: " + request.getMobile()));
        } else {
            throw new BadRequestException("Must provide visitorId, passCode, or mobile to check out");
        }

        if (visitor.getTimeOut() != null) {
            throw new BadRequestException("Visitor has already checked out at " + visitor.getTimeOut());
        }

        User performer = userRepository.findByUsername(performingUsername).orElse(null);

        visitor.setTimeOut(OffsetDateTime.now());
        if (StringUtils.hasText(request.getNotes())) {
            String updatedNotes = (visitor.getNotes() != null ? visitor.getNotes() + " | " : "") + "Checkout Note: " + request.getNotes();
            visitor.setNotes(updatedNotes);
        }

        Visitor updatedVisitor = visitorRepository.save(visitor);

        auditLogService.logAction(performer, "VISITOR_CHECK_OUT", "Visitor", updatedVisitor.getId(), null, Map.of(
                "name", updatedVisitor.getName(),
                "timeOut", updatedVisitor.getTimeOut().toString()
        ));

        return visitorMapper.toResponse(updatedVisitor);
    }

    @Override
    @Transactional(readOnly = true)
    public VisitorResponse getVisitorById(Long id) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visitor", "id", id));
        return visitorMapper.toResponse(visitor);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VisitorResponse> getActiveVisitorsInside() {
        return visitorRepository.findByTimeOutIsNull().stream()
                .map(visitorMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VisitorResponse> getVisitors(String query, HostDepartment department, HostType hostType, Boolean isBlacklisted, Boolean activeInside, Pageable pageable, String performingUsername) {
        User user = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        Specification<Visitor> spec = (root, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (user.getRole() == com.pict.gatesecurity.entity.enums.UserRole.STAFF) {
                predicates.add(cb.equal(root.get("createdBy").get("id"), user.getId()));
            }

            if (StringUtils.hasText(query)) {
                String searchPattern = "%" + query.toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), searchPattern);
                Predicate mobileMatch = cb.like(cb.lower(root.get("mobile")), searchPattern);
                Predicate hostMatch = cb.like(cb.lower(root.get("hostName")), searchPattern);
                predicates.add(cb.or(nameMatch, mobileMatch, hostMatch));
            }

            if (department != null) {
                predicates.add(cb.equal(root.get("hostDepartment"), department));
            }

            if (hostType != null) {
                predicates.add(cb.equal(root.get("hostType"), hostType));
            }

            if (isBlacklisted != null) {
                predicates.add(cb.equal(root.get("isBlacklistedMatch"), isBlacklisted));
            }

            if (Boolean.TRUE.equals(activeInside)) {
                predicates.add(cb.isNull(root.get("timeOut")));
            } else if (Boolean.FALSE.equals(activeInside)) {
                predicates.add(cb.isNotNull(root.get("timeOut")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return visitorRepository.findAll(spec, pageable).map(visitorMapper::toResponse);
    }
}
