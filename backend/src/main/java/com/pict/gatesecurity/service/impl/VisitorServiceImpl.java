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
import com.pict.gatesecurity.entity.enums.PassStatus;
import java.util.UUID;
import java.util.Optional;
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

import com.pict.gatesecurity.dto.visitor.FaceRecognitionResponse;
import com.pict.gatesecurity.dto.visitor.VisitorRecognitionResponse;
import com.pict.gatesecurity.service.FaceRecognitionService;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.UUID;

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
    private final FaceRecognitionService faceRecognitionService;

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.CACHE_ADMIN_DASHBOARD, CacheConfig.CACHE_GUARD_DASHBOARD}, allEntries = true)
    public VisitorResponse checkIn(VisitorCheckInRequest request, String performingUsername) {
        Long gateId = request.getGateId() != null ? request.getGateId() : 1L;
        Gate gate = gateRepository.findById(gateId)
                .orElseGet(() -> gateRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("Gate", "id", gateId)));

        User createdBy = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        String cleanMobile = com.pict.gatesecurity.util.ValidationUtil.normalizePhone(request.getMobile());
        String cleanName = com.pict.gatesecurity.util.ValidationUtil.normalizeName(request.getName());
        String cleanHostName = com.pict.gatesecurity.util.ValidationUtil.normalizeName(request.getHostName());
        String cleanVehicle = com.pict.gatesecurity.util.ValidationUtil.normalizeVehicleNumber(request.getVehicleNumber());
        String cleanPurpose = request.getPurpose() != null ? request.getPurpose().trim() : "";

        if (com.pict.gatesecurity.util.ValidationUtil.isMeaninglessText(cleanPurpose)) {
            throw new BadRequestException("Please provide a valid, descriptive purpose for the visit");
        }

        // Prevent duplicate active check-in
        visitorRepository.findFirstByMobileAndTimeOutIsNullOrderByTimeInDesc(cleanMobile)
                .ifPresent(v -> {
                    throw new BadRequestException("Visitor with mobile " + cleanMobile
                            + " is already checked in (Visitor ID: " + v.getId() + " at " + v.getTimeIn() + ")");
                });

        // Automatic Watchlist Check
        List<WatchlistEntry> matches = watchlistRepository.findMatchingEntries(cleanMobile, cleanName);
        boolean isBlacklistedMatch = !matches.isEmpty();

        if (isBlacklistedMatch) {
            log.warn("WATCHLIST WARNING: Visitor {} (Mobile: {}) matched watchlist entries!", cleanName, cleanMobile);
        }

        String photoUrlToUse = StringUtils.hasText(request.getPhotoUrl())
                ? request.getPhotoUrl()
                : visitorRepository.findFirstByMobileOrderByIdDesc(cleanMobile)
                        .map(Visitor::getPhotoUrl)
                        .orElse(null);

        Visitor visitor = Visitor.builder()
                .name(cleanName)
                .mobile(cleanMobile)
                .purpose(cleanPurpose)
                .hostName(cleanHostName)
                .hostType(request.getHostType())
                .hostDepartment(request.getHostDepartment())
                .studentPrn(request.getStudentPrn() != null ? request.getStudentPrn().trim().toUpperCase() : null)
                .gate(gate)
                .vehicleNumber(cleanVehicle)
                .timeIn(OffsetDateTime.now())
                .timeOut(null)
                .idProofType(request.getIdProofType())
                .idProofNumber(request.getIdProofNumber())
                .photoUrl(photoUrlToUse)
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
        visitor.setStatus(PassStatus.COMPLETED);
        visitor.setClosedAt(OffsetDateTime.now());
        visitor.setClosedBy(performingUsername);
        visitor.setClosureReason("Normal Gate Checkout");
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
        return visitorRepository.findAllActiveInsideCampus().stream()
                .map(visitorMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VisitorResponse> getVisitors(String query, HostDepartment department, HostType hostType, Boolean isBlacklisted, Boolean activeInside, PassStatus status, Pageable pageable, String performingUsername) {
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

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (Boolean.TRUE.equals(activeInside)) {
                predicates.add(cb.isNull(root.get("timeOut")));
                predicates.add(cb.notEqual(root.get("status"), PassStatus.AUTO_CLOSED_EOD));
                predicates.add(cb.notEqual(root.get("status"), PassStatus.PENDING));
                predicates.add(cb.notEqual(root.get("status"), PassStatus.REJECTED));
            } else if (Boolean.FALSE.equals(activeInside)) {
                predicates.add(cb.or(
                        cb.isNotNull(root.get("timeOut")),
                        cb.equal(root.get("status"), PassStatus.AUTO_CLOSED_EOD),
                        cb.equal(root.get("status"), PassStatus.REJECTED)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return visitorRepository.findAll(spec, pageable).map(visitorMapper::toResponse);
    }

    @Override
    @Transactional
    public VisitorRecognitionResponse recognizeVisitorFace(MultipartFile photo) {
        if (photo == null || photo.isEmpty()) {
            throw new BadRequestException("Photo file is required for face recognition");
        }

        FaceRecognitionResponse matchResult = faceRecognitionService.recognize(photo);
        log.info("Face recognition response score distance={}, similarity={}, matched={}, faceId={}",
                matchResult.getDistance(), matchResult.getSimilarity(), matchResult.getMatched(), matchResult.getFaceId());

        if (Boolean.TRUE.equals(matchResult.getMatched()) && StringUtils.hasText(matchResult.getFaceId())) {
            String matchedFaceId = matchResult.getFaceId();
            var visitorOpt = visitorRepository.findFirstByFaceIdOrderByTimeInDesc(matchedFaceId);

            // Fallback: If not found directly by faceId, check if any visitor has an unlinked photo matching this face
            if (visitorOpt.isEmpty()) {
                List<Visitor> visitorsWithPhotos = visitorRepository.findAll().stream()
                        .filter(v -> StringUtils.hasText(v.getPhotoPath()) || StringUtils.hasText(v.getPhotoUrl()))
                        .toList();

                for (Visitor v : visitorsWithPhotos) {
                    String photoPath = StringUtils.hasText(v.getPhotoPath()) ? v.getPhotoPath() : v.getPhotoUrl();
                    String cleanName = photoPath.contains("/") ? photoPath.substring(photoPath.lastIndexOf('/') + 1) : photoPath;
                    File photoFile = new File("uploads/visitor-photos", cleanName);
                    if (!photoFile.exists()) {
                        photoFile = new File(photoPath.startsWith("/") ? photoPath.substring(1) : photoPath);
                    }
                    if (photoFile.exists()) {
                        FaceRecognitionResponse photoMatch = faceRecognitionService.recognize(photoFile);
                        if (Boolean.TRUE.equals(photoMatch.getMatched()) && matchedFaceId.equals(photoMatch.getFaceId())) {
                            log.info("Resolved unlinked visitor ID={} (name={}) to matched faceId={}", v.getId(), v.getName(), matchedFaceId);
                            v.setFaceId(matchedFaceId);
                            visitorRepository.save(v);
                            visitorOpt = Optional.of(v);
                            break;
                        }
                    }
                }
            }

            if (visitorOpt.isPresent()) {
                Visitor v = visitorOpt.get();
                log.info("Face matched to existing visitor: ID={}, Name={}", v.getId(), v.getName());
                return VisitorRecognitionResponse.builder()
                        .matched(true)
                        .visitorId(v.getId())
                        .visitorName(v.getName())
                        .mobileNumber(v.getMobile())
                        .hostPersonOrDepartment(v.getHostName() + " (" + v.getHostDepartment() + ")")
                        .purpose(v.getPurpose())
                        .photoPath(StringUtils.hasText(v.getPhotoPath()) ? v.getPhotoPath() : v.getPhotoUrl())
                        .hostName(v.getHostName())
                        .hostType(v.getHostType())
                        .hostDepartment(v.getHostDepartment())
                        .studentPrn(v.getStudentPrn())
                        .idProofType(v.getIdProofType())
                        .idProofNumber(v.getIdProofNumber())
                        .vehicleNumber(v.getVehicleNumber())
                        .confidenceDistance(matchResult.getDistance())
                        .similarity(matchResult.getSimilarity())
                        .numFaces(matchResult.getNumFaces())
                        .isAmbiguous(matchResult.getIsAmbiguous())
                        .matchType(matchResult.getMatchType())
                        .message(matchResult.getMessage())
                        .quality(matchResult.getQuality())
                        .build();
            } else {
                log.warn("Biometric face match found (faceId={}) but no matching visitor profile in database", matchedFaceId);
                return VisitorRecognitionResponse.builder()
                        .matched(false)
                        .confidenceDistance(matchResult.getDistance())
                        .similarity(matchResult.getSimilarity())
                        .numFaces(matchResult.getNumFaces())
                        .isAmbiguous(false)
                        .matchType("unmapped")
                        .message("Face matched in biometric records, but no visitor profile is registered. Please register as a new visitor.")
                        .quality(matchResult.getQuality())
                        .build();
            }
        }

        return VisitorRecognitionResponse.builder()
                .matched(false)
                .confidenceDistance(matchResult.getDistance())
                .similarity(matchResult.getSimilarity())
                .numFaces(matchResult.getNumFaces())
                .isAmbiguous(matchResult.getIsAmbiguous())
                .matchType(matchResult.getMatchType())
                .message(matchResult.getMessage() != null ? matchResult.getMessage() : "No matching visitor face record found.")
                .quality(matchResult.getQuality())
                .build();
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.CACHE_ADMIN_DASHBOARD, CacheConfig.CACHE_GUARD_DASHBOARD}, allEntries = true)
    public VisitorResponse registerVisitorWithPhoto(MultipartFile photo, VisitorCheckInRequest request, String performingUsername) {
        String photoPath = null;
        String faceId = null;

        if (photo != null && !photo.isEmpty()) {
            try {
                File dir = new File("uploads/visitor-photos");
                if (!dir.exists()) {
                    dir.mkdirs();
                }
                String filename = "visitor_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + ".jpg";
                File destFile = new File(dir, filename);
                try (FileOutputStream fos = new FileOutputStream(destFile)) {
                    fos.write(photo.getBytes());
                }
                photoPath = "/uploads/visitor-photos/" + filename;
                log.info("Saved visitor photo to {}", photoPath);

                // Enroll face embedding with Python service
                faceId = faceRecognitionService.enroll(destFile);
                if (faceId == null) {
                    FaceRecognitionResponse existingMatch = faceRecognitionService.recognize(destFile);
                    if (Boolean.TRUE.equals(existingMatch.getMatched()) && StringUtils.hasText(existingMatch.getFaceId())) {
                        faceId = existingMatch.getFaceId();
                        log.info("Recognized and linked existing enrolled faceId={}", faceId);
                    }
                }
                log.info("Enrolled face with faceId={}", faceId);
            } catch (IOException e) {
                log.error("Failed to save visitor photo file", e);
            }
        }

        Long gateId = request.getGateId() != null ? request.getGateId() : 1L;
        Gate gate = gateRepository.findById(gateId)
                .orElseGet(() -> gateRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("Gate", "id", gateId)));

        User createdBy = userRepository.findByUsername(performingUsername)
                .or(() -> userRepository.findFirstByOrderByIdAsc())
                .orElse(null);

        // Prevent duplicate active check-in
        String cleanMobile = com.pict.gatesecurity.util.ValidationUtil.normalizePhone(request.getMobile());
        String cleanName = com.pict.gatesecurity.util.ValidationUtil.normalizeName(request.getName());
        visitorRepository.findFirstByMobileAndTimeOutIsNullOrderByTimeInDesc(cleanMobile)
                .ifPresent(v -> {
                    throw new BadRequestException("Visitor with mobile " + cleanMobile
                            + " is already checked in (Visitor ID: " + v.getId() + " at " + v.getTimeIn() + ")");
                });

        // Automatic Watchlist Check
        List<WatchlistEntry> matches = watchlistRepository.findMatchingEntries(cleanMobile, cleanName);
        boolean isBlacklistedMatch = !matches.isEmpty();

        Visitor visitor = Visitor.builder()
                .name(cleanName)
                .mobile(cleanMobile)
                .purpose(request.getPurpose() != null ? request.getPurpose().trim() : "")
                .hostName(StringUtils.hasText(request.getHostName()) ? request.getHostName().trim() : "General Inquiry")
                .hostType(request.getHostType())
                .hostDepartment(request.getHostDepartment())
                .studentPrn(request.getStudentPrn())
                .gate(gate)
                .vehicleNumber(com.pict.gatesecurity.util.ValidationUtil.normalizeVehicleNumber(request.getVehicleNumber()))
                .timeIn(OffsetDateTime.now())
                .timeOut(null)
                .idProofType(StringUtils.hasText(request.getIdProofType()) ? request.getIdProofType() : "Digital Pass")
                .idProofNumber(StringUtils.hasText(request.getIdProofNumber()) ? request.getIdProofNumber() : "VT-" + (System.currentTimeMillis() % 1000000))
                .photoUrl(photoPath != null ? photoPath : request.getPhotoUrl())
                .photoPath(photoPath != null ? photoPath : request.getPhotoUrl())
                .faceId(faceId != null ? faceId : (StringUtils.hasText(request.getPhotoUrl()) ? visitorRepository.findFirstByMobileOrderByTimeInDesc(request.getMobile()).map(Visitor::getFaceId).orElse(null) : null))
                .isBlacklistedMatch(isBlacklistedMatch)
                .notes(request.getNotes())
                .createdBy(createdBy)
                .build();

        Visitor savedVisitor = visitorRepository.save(visitor);

        auditLogService.logAction(createdBy, "VISITOR_CHECK_IN_WITH_FACE", "Visitor", savedVisitor.getId(), null, Map.of(
                "name", savedVisitor.getName(),
                "mobile", savedVisitor.getMobile(),
                "faceId", faceId != null ? faceId : "none"
        ));

        return visitorMapper.toResponse(savedVisitor);
    }

    @Override
    @Transactional(readOnly = true)
    public VisitorResponse findLatestByMobile(String mobile) {
        if (!StringUtils.hasText(mobile)) {
            return null;
        }
        String cleaned = com.pict.gatesecurity.util.ValidationUtil.normalizePhone(mobile);
        final String raw = mobile.trim();
        final String searchMobile = (cleaned != null && !cleaned.isBlank()) ? cleaned : raw;

        return visitorRepository.findFirstByMobileOrderByIdDesc(searchMobile)
                .or(() -> visitorRepository.findFirstByMobileOrderByTimeInDesc(searchMobile))
                .or(() -> visitorRepository.findFirstByMobileOrderByIdDesc(raw))
                .map(visitorMapper::toResponse)
                .orElse(null);
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.CACHE_ADMIN_DASHBOARD, CacheConfig.CACHE_GUARD_DASHBOARD}, allEntries = true)
    public void deleteVisitor(Long id, String performingUsername) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visitor", "id", id));

        String faceId = visitor.getFaceId();
        visitorRepository.delete(visitor);

        // Also purge biometric embedding from the face service if enrolled
        if (faceId != null && !faceId.isBlank()) {
            boolean embeddingDeleted = faceRecognitionService.deleteEmbedding(faceId);
            log.info("Face embedding purge for faceId={} during visitor deletion: deleted={}", faceId, embeddingDeleted);
        }

        User performer = userRepository.findByUsername(performingUsername).orElse(null);
        auditLogService.logAction(performer, "VISITOR_DELETED", "Visitor", id, null, Map.of(
                "name", visitor.getName(),
                "mobile", visitor.getMobile(),
                "faceId", faceId != null ? faceId : "none"
        ));
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.CACHE_ADMIN_DASHBOARD, CacheConfig.CACHE_GUARD_DASHBOARD}, allEntries = true)
    public VisitorResponse requestToken(MultipartFile photo, VisitorCheckInRequest request, String performingUsername) {
        if (request == null) {
            throw new BadRequestException("Visit request details are required");
        }
        String cleanName = com.pict.gatesecurity.util.ValidationUtil.normalizeName(request.getName());
        String cleanMobile = com.pict.gatesecurity.util.ValidationUtil.normalizePhone(request.getMobile());
        String cleanPurpose = request.getPurpose() != null ? request.getPurpose().trim() : "";
        if (cleanName.isBlank() || cleanMobile.isBlank() || cleanPurpose.isBlank()) {
            throw new BadRequestException("Name, Mobile number, and Purpose are required");
        }

        String photoPath = null;
        String faceId = null;

        if (photo != null && !photo.isEmpty()) {
            try {
                File dir = new File("uploads/visitor-photos");
                if (!dir.exists()) {
                    dir.mkdirs();
                }
                String filename = "visitor_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + ".jpg";
                File destFile = new File(dir, filename);
                try (FileOutputStream fos = new FileOutputStream(destFile)) {
                    fos.write(photo.getBytes());
                }
                photoPath = "/uploads/visitor-photos/" + filename;
                log.info("Saved visitor token request photo to {}", photoPath);

                // Enroll face embedding with Python service
                faceId = faceRecognitionService.enroll(destFile);
                if (faceId == null) {
                    FaceRecognitionResponse existingMatch = faceRecognitionService.recognize(destFile);
                    if (Boolean.TRUE.equals(existingMatch.getMatched()) && StringUtils.hasText(existingMatch.getFaceId())) {
                        faceId = existingMatch.getFaceId();
                        log.info("Recognized and linked existing enrolled faceId for token request: {}", faceId);
                    }
                }
                log.info("Enrolled face embedding for token request: faceId={}", faceId);
            } catch (Exception e) {
                log.warn("Face enrollment during token generation could not be completed: {}", e.getMessage());
            }
        }

        // If no new face enrolled, check if this mobile was already enrolled in past
        if (faceId == null) {
            faceId = visitorRepository.findFirstByMobileOrderByTimeInDesc(cleanMobile)
                    .map(Visitor::getFaceId).orElse(null);
            if (photoPath == null) {
                photoPath = visitorRepository.findFirstByMobileOrderByTimeInDesc(cleanMobile)
                        .map(Visitor::getPhotoPath).orElse(null);
            }
        }

        Long gateId = request.getGateId() != null ? request.getGateId() : 1L;
        Gate gate = gateRepository.findById(gateId)
                .orElseGet(() -> gateRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("Gate", "id", gateId)));

        User createdBy = userRepository.findByUsername(performingUsername)
                .or(() -> userRepository.findFirstByOrderByIdAsc())
                .orElse(null);

        // Automatic Watchlist Check
        List<WatchlistEntry> matches = watchlistRepository.findMatchingEntries(cleanMobile, cleanName);
        boolean isBlacklistedMatch = !matches.isEmpty();

        Visitor visitor = Visitor.builder()
                .name(cleanName)
                .mobile(cleanMobile)
                .purpose(cleanPurpose)
                .hostName(StringUtils.hasText(request.getHostName()) ? request.getHostName().trim() : "General Inquiry")
                .hostType(request.getHostType() != null ? request.getHostType() : HostType.FACULTY)
                .hostDepartment(request.getHostDepartment() != null ? request.getHostDepartment() : HostDepartment.ADMIN)
                .studentPrn(request.getStudentPrn())
                .gate(gate)
                .vehicleNumber(com.pict.gatesecurity.util.ValidationUtil.normalizeVehicleNumber(request.getVehicleNumber()))
                .timeIn(OffsetDateTime.now())
                .timeOut(null)
                .idProofType(StringUtils.hasText(request.getIdProofType()) ? request.getIdProofType() : "Digital Token")
                .idProofNumber(StringUtils.hasText(request.getIdProofNumber()) ? request.getIdProofNumber() : "VT-" + (System.currentTimeMillis() % 1000000))
                .photoUrl(photoPath != null ? photoPath : request.getPhotoUrl())
                .photoPath(photoPath != null ? photoPath : request.getPhotoUrl())
                .faceId(faceId)
                .isBlacklistedMatch(isBlacklistedMatch)
                .status(PassStatus.PENDING)
                .notes(request.getNotes() != null ? request.getNotes() : "Self-requested digital token — pending guard approval")
                .createdBy(createdBy)
                .build();

        Visitor savedVisitor = visitorRepository.save(visitor);
        auditLogService.logAction(createdBy, "DIGITAL_TOKEN_REQUESTED", "Visitor", savedVisitor.getId(), null, Map.of(
                "name", savedVisitor.getName(),
                "mobile", savedVisitor.getMobile(),
                "status", "PENDING"
        ));

        return visitorMapper.toResponse(savedVisitor);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VisitorResponse> getPendingTokens() {
        return visitorRepository.findByStatusOrderByCreatedAtDesc(PassStatus.PENDING)
                .stream()
                .map(visitorMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.CACHE_ADMIN_DASHBOARD, CacheConfig.CACHE_GUARD_DASHBOARD}, allEntries = true)
    public VisitorResponse approveToken(Long id, String performingUsername) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visitor", "id", id));
        if (visitor.getStatus() == PassStatus.APPROVED && visitor.getTimeOut() == null) {
            return visitorMapper.toResponse(visitor);
        }
        if (visitor.getTimeOut() != null) {
            throw new BadRequestException("Visit has already been completed/closed at " + visitor.getTimeOut());
        }
        String cleanMobile = visitor.getMobile();
        visitorRepository.findFirstByMobileAndTimeOutIsNullOrderByTimeInDesc(cleanMobile)
                .ifPresent(v -> {
                    if (!v.getId().equals(visitor.getId())) {
                        throw new BadRequestException("Visitor with mobile " + cleanMobile
                                + " is already checked in (Visitor ID: " + v.getId() + " at " + v.getTimeIn() + ")");
                    }
                });

        visitor.setStatus(PassStatus.APPROVED);
        visitor.setTimeIn(OffsetDateTime.now());
        visitor.setNotes((visitor.getNotes() != null ? visitor.getNotes() + " | " : "") + "Approved by Guard @" + performingUsername);
        Visitor saved = visitorRepository.save(visitor);

        User performer = userRepository.findByUsername(performingUsername).orElse(null);
        auditLogService.logAction(performer, "DIGITAL_TOKEN_APPROVED", "Visitor", saved.getId(), null, Map.of(
                "name", saved.getName(),
                "status", "APPROVED"
        ));
        return visitorMapper.toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.CACHE_ADMIN_DASHBOARD, CacheConfig.CACHE_GUARD_DASHBOARD}, allEntries = true)
    public VisitorResponse rejectToken(Long id, String performingUsername) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visitor", "id", id));
        visitor.setStatus(PassStatus.REJECTED);
        visitor.setTimeOut(OffsetDateTime.now());
        visitor.setNotes((visitor.getNotes() != null ? visitor.getNotes() + " | " : "") + "Rejected by Guard @" + performingUsername);
        Visitor saved = visitorRepository.save(visitor);

        User performer = userRepository.findByUsername(performingUsername).orElse(null);
        auditLogService.logAction(performer, "DIGITAL_TOKEN_REJECTED", "Visitor", saved.getId(), null, Map.of(
                "name", saved.getName(),
                "status", "REJECTED"
        ));
        return visitorMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public VisitorResponse getMyActiveToken(String performingUsername) {
        User user = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + performingUsername));

        var tokenOpt = visitorRepository.findFirstByCreatedByIdOrderByCreatedAtDesc(user.getId());
        if (tokenOpt.isPresent()) {
            return visitorMapper.toResponse(tokenOpt.get());
        }

        if (StringUtils.hasText(user.getPhone())) {
            var tokenByPhoneOpt = visitorRepository.findFirstByMobileOrderByCreatedAtDesc(user.getPhone());
            if (tokenByPhoneOpt.isPresent()) {
                return visitorMapper.toResponse(tokenByPhoneOpt.get());
            }
        }

        return null;
    }
}
