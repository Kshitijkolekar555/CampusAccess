package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.student.StudentEnrollmentRequest;
import com.pict.gatesecurity.dto.student.StudentVerificationResponse;
import com.pict.gatesecurity.dto.visitor.FaceRecognitionResponse;
import com.pict.gatesecurity.entity.*;
import com.pict.gatesecurity.entity.enums.OutpassStatus;
import com.pict.gatesecurity.entity.enums.PassStatus;
import com.pict.gatesecurity.entity.enums.UserRole;
import com.pict.gatesecurity.exception.BadRequestException;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.repository.*;
import com.pict.gatesecurity.service.AuditLogService;
import com.pict.gatesecurity.service.FaceRecognitionService;
import com.pict.gatesecurity.service.StudentVerificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentVerificationServiceImpl implements StudentVerificationService {

    private final StudentProfileRepository studentProfileRepository;
    private final StudentFaceTemplateRepository studentFaceTemplateRepository;
    private final StudentGatePassRepository studentGatePassRepository;
    private final HostelOutpassRepository hostelOutpassRepository;
    private final UserRepository userRepository;
    private final FaceRecognitionService faceRecognitionService;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public StudentVerificationResponse identifyAndVerifyStudentFace(MultipartFile photo, String performingUsername) {
        if (photo == null || photo.isEmpty()) {
            throw new BadRequestException("Live camera frame photo is required for face identification");
        }

        User guardUser = userRepository.findByUsername(performingUsername).orElse(null);

        // 1. Send frame to neural face service for YuNet detection + SFace vector comparison
        FaceRecognitionResponse matchResult = faceRecognitionService.recognize(photo);

        log.info("Face recognition response for student scan: matched={}, faceId={}, distance={}, similarity={}, isAmbiguous={}",
                matchResult.getMatched(), matchResult.getFaceId(), matchResult.getDistance(), matchResult.getSimilarity(), matchResult.getIsAmbiguous());

        // Audit log the camera verification attempt
        auditLogService.logAction(guardUser, "STUDENT_CAMERA_SCAN_ATTEMPT", "Biometrics", null, null, Map.of(
                "matched", Boolean.TRUE.equals(matchResult.getMatched()),
                "distance", matchResult.getDistance(),
                "numFaces", matchResult.getNumFaces(),
                "isAmbiguous", Boolean.TRUE.equals(matchResult.getIsAmbiguous())
        ));

        // Rejection cases
        if (Boolean.TRUE.equals(matchResult.getIsAmbiguous())) {
            return StudentVerificationResponse.builder()
                    .identified(false)
                    .confidenceDistance(matchResult.getDistance())
                    .similarity(matchResult.getSimilarity())
                    .numFaces(matchResult.getNumFaces())
                    .isAmbiguous(true)
                    .quality(matchResult.getQuality())
                    .message("Ambiguous match: Multiple registered faces are close to this image. Manual PRN verification required.")
                    .gateAccessAuthorized(false)
                    .build();
        }

        if (matchResult.getNumFaces() == 0) {
            return StudentVerificationResponse.builder()
                    .identified(false)
                    .confidenceDistance(1.0)
                    .similarity(0.0)
                    .numFaces(0)
                    .message("No face detected in camera frame. Please align face clearly in camera.")
                    .gateAccessAuthorized(false)
                    .build();
        }

        if (matchResult.getNumFaces() > 1) {
            return StudentVerificationResponse.builder()
                    .identified(false)
                    .confidenceDistance(matchResult.getDistance())
                    .similarity(matchResult.getSimilarity())
                    .numFaces(matchResult.getNumFaces())
                    .message("Multiple people detected in view. Please ensure only one student faces the camera.")
                    .gateAccessAuthorized(false)
                    .build();
        }

        if (!Boolean.TRUE.equals(matchResult.getMatched()) || !StringUtils.hasText(matchResult.getFaceId())) {
            return StudentVerificationResponse.builder()
                    .identified(false)
                    .confidenceDistance(matchResult.getDistance())
                    .similarity(matchResult.getSimilarity())
                    .numFaces(matchResult.getNumFaces())
                    .quality(matchResult.getQuality())
                    .message("Unknown face: No matching registered student found in biometric database.")
                    .gateAccessAuthorized(false)
                    .build();
        }

        // 2. Resolve faceId to StudentFaceTemplate
        Optional<StudentFaceTemplate> templateOpt = studentFaceTemplateRepository.findByFaceId(matchResult.getFaceId());
        if (templateOpt.isEmpty() || !"ACTIVE".equalsIgnoreCase(templateOpt.get().getStatus())) {
            log.warn("FaceId {} matched in vector DB but inactive or missing in MySQL student_face_templates", matchResult.getFaceId());
            return StudentVerificationResponse.builder()
                    .identified(false)
                    .confidenceDistance(matchResult.getDistance())
                    .similarity(matchResult.getSimilarity())
                    .message("Face template found but student enrollment status is inactive or revoked.")
                    .gateAccessAuthorized(false)
                    .build();
        }

        StudentFaceTemplate template = templateOpt.get();
        StudentProfile profile = template.getStudentProfile();

        // 3. Assemble and evaluate gate authorization for student
        StudentVerificationResponse response = buildVerifiedStudentResponse(profile);
        response.setIdentified(true);
        response.setFaceId(template.getFaceId());
        response.setConfidenceDistance(matchResult.getDistance());
        response.setSimilarity(matchResult.getSimilarity());
        response.setIsAmbiguous(false);
        response.setNumFaces(matchResult.getNumFaces());
        response.setQuality(matchResult.getQuality());
        response.setMessage("Student successfully identified via biometric recognition.");

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public StudentVerificationResponse verifyStudentManual(String query, String performingUsername) {
        if (!StringUtils.hasText(query)) {
            throw new BadRequestException("PRN or username query is required for manual student lookup");
        }

        String trimmed = query.trim().toUpperCase();
        Optional<StudentProfile> profileOpt = studentProfileRepository.findByPrn(trimmed);
        if (profileOpt.isEmpty()) {
            // Also attempt finding by User username or rollNumber
            Optional<User> userOpt = userRepository.findByUsername(trimmed);
            if (userOpt.isPresent()) {
                profileOpt = studentProfileRepository.findByUserId(userOpt.get().getId());
            }
        }

        if (profileOpt.isEmpty()) {
            throw new ResourceNotFoundException("StudentProfile", "PRN", trimmed);
        }

        StudentProfile profile = profileOpt.get();
        StudentVerificationResponse response = buildVerifiedStudentResponse(profile);
        response.setIdentified(true);
        response.setMessage("Student retrieved via manual PRN lookup.");

        User guardUser = userRepository.findByUsername(performingUsername).orElse(null);
        auditLogService.logAction(guardUser, "STUDENT_MANUAL_LOOKUP", "StudentProfile", profile.getId(), null, Map.of(
                "prn", profile.getPrn(),
                "query", trimmed
        ));

        return response;
    }

    @Override
    @Transactional
    public StudentVerificationResponse enrollStudentFace(String prn, MultipartFile photo, StudentEnrollmentRequest request, String performingUsername) {
        if (photo == null || photo.isEmpty()) {
            throw new BadRequestException("Photo is required for face enrollment");
        }

        User enrolledByUser = userRepository.findByUsername(performingUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", performingUsername));

        String cleanPrn = prn.trim().toUpperCase();

        // Check if student profile exists, or create/link from users table
        StudentProfile profile = studentProfileRepository.findByPrn(cleanPrn).orElseGet(() -> {
            User studentUser = userRepository.findByUsername(cleanPrn).orElseGet(() -> {
                // If user doesn't exist, create student user record
                return userRepository.save(User.builder()
                        .username(cleanPrn)
                        .fullName(cleanPrn)
                        .passwordHash("$2a$12$dummyHashForBiometricEnrolledStudent")
                        .role(UserRole.STUDENT)
                        .active(true)
                        .build());
            });

            return studentProfileRepository.save(StudentProfile.builder()
                    .user(studentUser)
                    .prn(cleanPrn)
                    .rollNumber(request.getRollNumber() != null ? request.getRollNumber() : "R-" + cleanPrn)
                    .department(request.getDepartment() != null ? request.getDepartment() : "CE")
                    .academicYear(request.getAcademicYear() != null ? request.getAcademicYear() : "TE")
                    .division(request.getDivision() != null ? request.getDivision() : "1")
                    .active(true)
                    .build());
        });

        // 1. Call face microservice /enroll
        String faceId = faceRecognitionService.enroll(photo);
        if (!StringUtils.hasText(faceId)) {
            throw new BadRequestException("Face enrollment failed: Image quality was insufficient or no single valid face was detected.");
        }

        // 2. Deactivate previous active templates for this student profile
        List<StudentFaceTemplate> existing = studentFaceTemplateRepository.findByStudentProfileIdAndStatus(profile.getId(), "ACTIVE");
        for (StudentFaceTemplate prev : existing) {
            prev.setStatus("REVOKED");
            studentFaceTemplateRepository.save(prev);
            faceRecognitionService.deleteEmbedding(prev.getFaceId());
        }

        // 3. Save new active template record
        StudentFaceTemplate template = StudentFaceTemplate.builder()
                .studentProfile(profile)
                .faceId(faceId)
                .modelName("SFace")
                .modelVersion("2021dec")
                .status("ACTIVE")
                .enrolledBy(enrolledByUser)
                .consentRecorded(Boolean.TRUE.equals(request.getConsentRecorded()))
                .consentTimestamp(OffsetDateTime.now())
                .qualityScore(1.0)
                .build();

        studentFaceTemplateRepository.save(template);

        auditLogService.logAction(enrolledByUser, "STUDENT_FACE_ENROLLED", "StudentFaceTemplate", template.getId(), null, Map.of(
                "studentPrn", cleanPrn,
                "faceId", faceId
        ));

        log.info("Student {} face successfully enrolled with faceId {}", cleanPrn, faceId);

        StudentVerificationResponse response = buildVerifiedStudentResponse(profile);
        response.setIdentified(true);
        response.setFaceId(faceId);
        response.setMessage("Student face enrolled successfully.");
        return response;
    }

    @Override
    @Transactional
    public boolean revokeStudentBiometrics(String prn, String performingUsername) {
        String cleanPrn = prn.trim().toUpperCase();
        StudentProfile profile = studentProfileRepository.findByPrn(cleanPrn)
                .orElseThrow(() -> new ResourceNotFoundException("StudentProfile", "PRN", cleanPrn));

        User actor = userRepository.findByUsername(performingUsername).orElse(null);

        List<StudentFaceTemplate> templates = studentFaceTemplateRepository.findByStudentProfileIdAndStatus(profile.getId(), "ACTIVE");
        for (StudentFaceTemplate t : templates) {
            t.setStatus("REVOKED");
            studentFaceTemplateRepository.save(t);
            faceRecognitionService.deleteEmbedding(t.getFaceId());
        }

        auditLogService.logAction(actor, "STUDENT_BIOMETRICS_REVOKED", "StudentProfile", profile.getId(), null, Map.of("prn", cleanPrn));
        return true;
    }

    private StudentVerificationResponse buildVerifiedStudentResponse(StudentProfile profile) {
        User user = profile.getUser();
        String prn = profile.getPrn();

        StudentVerificationResponse response = StudentVerificationResponse.builder()
                .studentProfileId(profile.getId())
                .userId(user.getId())
                .prn(prn)
                .fullName(user.getFullName())
                .rollNumber(profile.getRollNumber())
                .department(profile.getDepartment())
                .academicYear(profile.getAcademicYear())
                .division(profile.getDivision())
                .phone(user.getPhone())
                .email(user.getEmail())
                .build();

        // Check active StudentGatePass
        List<StudentGatePass> passes = studentGatePassRepository.findByStudentPrnAndStatus(prn, PassStatus.APPROVED);
        if (passes.isEmpty()) {
            passes = studentGatePassRepository.findByStudentPrnAndStatus(prn, PassStatus.ACTIVE);
        }

        if (!passes.isEmpty()) {
            StudentGatePass pass = passes.get(0);
            response.setGateAccessAuthorized(true);
            response.setAuthorizationReason("APPROVED_GATE_PASS");
            response.setActiveGatePassId(pass.getId());
            response.setGatePassStatus(pass.getStatus().name());
            response.setGatePassExpectedReturn(pass.getExpectedReturnTime() != null ? pass.getExpectedReturnTime().toString() : null);
            return response;
        }

        // Check active HostelOutpass
        List<HostelOutpass> outpasses = hostelOutpassRepository.findByStudentPrnAndStatusIn(prn, List.of(OutpassStatus.APPROVED, OutpassStatus.EXITED));
        if (!outpasses.isEmpty()) {
            HostelOutpass outpass = outpasses.get(0);
            response.setGateAccessAuthorized(true);
            response.setAuthorizationReason("APPROVED_HOSTEL_OUTPASS");
            response.setActiveOutpassId(outpass.getId());
            response.setOutpassStatus(outpass.getStatus().name());
            response.setOutpassExpectedReturn(outpass.getExpectedReturnTime() != null ? outpass.getExpectedReturnTime().toString() : null);
            return response;
        }

        // No active gate pass or hostel outpass
        response.setGateAccessAuthorized(false);
        response.setAuthorizationReason("NO_ACTIVE_PASS");
        return response;
    }
}
