package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.auth.AuthResponse;
import com.pict.gatesecurity.dto.student.StudentRegisterRequest;
import com.pict.gatesecurity.dto.student.StudentVerifyResponse;
import com.pict.gatesecurity.entity.AuthorizedStudent;
import com.pict.gatesecurity.entity.RefreshToken;
import com.pict.gatesecurity.entity.StudentProfile;
import com.pict.gatesecurity.entity.User;
import com.pict.gatesecurity.entity.enums.UserRole;
import com.pict.gatesecurity.exception.BadRequestException;
import com.pict.gatesecurity.exception.DuplicateResourceException;
import com.pict.gatesecurity.exception.ForbiddenException;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.mapper.UserMapper;
import com.pict.gatesecurity.repository.AuthorizedStudentRepository;
import com.pict.gatesecurity.repository.RefreshTokenRepository;
import com.pict.gatesecurity.repository.StudentProfileRepository;
import com.pict.gatesecurity.repository.UserRepository;
import com.pict.gatesecurity.security.JwtUtil;
import com.pict.gatesecurity.service.AuditLogService;
import com.pict.gatesecurity.service.NotificationService;
import com.pict.gatesecurity.service.StudentAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentAuthServiceImpl implements StudentAuthService {

    private final AuthorizedStudentRepository authorizedStudentRepository;
    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UserMapper userMapper;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Value("${app.jwt.refresh-token-expiry-ms:604800000}")
    private long refreshTokenExpiryMs;

    @Override
    @Transactional(readOnly = true)
    public StudentVerifyResponse verifyStudentId(String studentId) {
        if (studentId == null || studentId.trim().isEmpty()) {
            throw new BadRequestException("Student ID / PRN is required");
        }

        String cleanId = studentId.trim();
        AuthorizedStudent authorized = authorizedStudentRepository.findAuthorizedByIdentifier(cleanId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student ID '" + cleanId + "' is not found in the authorized student dataset. Only verified PICT students may register."));

        // Check if an active account has already been registered
        boolean accountExists = userRepository.findFirstByUsernameIgnoreCase(authorized.getStudentId()).isPresent()
                || userRepository.findFirstByUsernameIgnoreCase(cleanId).isPresent()
                || studentProfileRepository.findFirstByPrnIgnoreCase(authorized.getStudentId())
                        .filter(sp -> sp.getUser() != null).isPresent()
                || studentProfileRepository.findFirstByPrnIgnoreCase(cleanId)
                        .filter(sp -> sp.getUser() != null).isPresent();

        if (accountExists) {
            throw new DuplicateResourceException(
                    "An account has already been registered for Student ID '" + cleanId + "'. Please sign in with your credentials.");
        }

        return StudentVerifyResponse.builder()
                .eligible(true)
                .studentId(authorized.getStudentId())
                .enrollmentNo(authorized.getEnrollmentNo())
                .prn(authorized.getPrn())
                .rollNumber(authorized.getRollNumber())
                .fullName(authorized.getFullName())
                .department(authorized.getDepartment())
                .academicYear(authorized.getAcademicYear() != null ? authorized.getAcademicYear() : "TE")
                .className(authorized.getClassName())
                .division(authorized.getDivision())
                .email(authorized.getEmail())
                .mobile(authorized.getMobile())
                .message("Authorized student record verified. Eligible for account registration.")
                .build();
    }

    @Override
    @Transactional
    public AuthResponse registerStudent(StudentRegisterRequest request) {
        if (request.getStudentId() == null || request.getStudentId().trim().isEmpty()) {
            throw new BadRequestException("Student ID / PRN is required");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters long");
        }

        String cleanId = request.getStudentId().trim();
        AuthorizedStudent authorized = authorizedStudentRepository.findAuthorizedByIdentifier(cleanId)
                .orElseThrow(() -> new ForbiddenException(
                        "Registration rejected: Student ID '" + cleanId + "' is not present in the authorized student dataset."));

        // Prevent registration under another person's student ID
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            String cleanReqName = request.getFullName().trim().toLowerCase().replaceAll("\\s+", " ");
            String cleanAuthName = authorized.getFullName().trim().toLowerCase().replaceAll("\\s+", " ");
            Set<String> reqTokens = new HashSet<>(Arrays.asList(cleanReqName.split(" ")));
            Set<String> authTokens = new HashSet<>(Arrays.asList(cleanAuthName.split(" ")));
            boolean namesMatch = cleanReqName.equals(cleanAuthName) ||
                    cleanReqName.contains(cleanAuthName) ||
                    cleanAuthName.contains(cleanReqName) ||
                    reqTokens.containsAll(authTokens) ||
                    authTokens.containsAll(reqTokens);

            if (!namesMatch) {
                throw new BadRequestException("The entered full name does not match the authorized institutional record for Student ID " + authorized.getStudentId());
            }
        }

        // Prevent duplicate registration
        if (userRepository.findFirstByUsernameIgnoreCase(authorized.getStudentId()).isPresent() ||
            studentProfileRepository.findFirstByPrnIgnoreCase(authorized.getStudentId()).filter(sp -> sp.getUser() != null).isPresent()) {
            throw new DuplicateResourceException("An account already exists for Student ID '" + authorized.getStudentId() + "'");
        }

        String cleanEmail = request.getEmail() != null && !request.getEmail().isBlank()
                ? request.getEmail().trim().toLowerCase()
                : (authorized.getEmail() != null ? authorized.getEmail().trim().toLowerCase() : authorized.getStudentId().toLowerCase() + "@pict.edu");

        if (userRepository.existsByEmail(cleanEmail)) {
            throw new DuplicateResourceException("Email '" + cleanEmail + "' is already registered to another account");
        }

        String phone = request.getPhone() != null && !request.getPhone().isBlank()
                ? request.getPhone().trim()
                : authorized.getMobile();

        User user = User.builder()
                .username(authorized.getStudentId())
                .fullName(authorized.getFullName())
                .email(cleanEmail)
                .phone(phone)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.STUDENT)
                .active(true)
                .isLateComerPermitted(true)
                .build();

        User savedUser = userRepository.saveAndFlush(user);

        // Link or create StudentProfile
        Optional<StudentProfile> existingProfileOpt = studentProfileRepository.findByPrnIgnoreCase(authorized.getStudentId())
                .or(() -> studentProfileRepository.findByPrnIgnoreCase(authorized.getPrn()));

        StudentProfile profile;
        if (existingProfileOpt.isPresent()) {
            profile = existingProfileOpt.get();
            profile.setUser(savedUser);
            profile.setDepartment(authorized.getDepartment());
            profile.setAcademicYear(authorized.getAcademicYear() != null ? authorized.getAcademicYear() : "TE");
            profile.setDivision(authorized.getDivision());
            if (authorized.getRollNumber() != null && !authorized.getRollNumber().isBlank()) {
                profile.setRollNumber(authorized.getRollNumber());
            }
            profile.setActive(true);
        } else {
            profile = StudentProfile.builder()
                    .user(savedUser)
                    .prn(authorized.getStudentId())
                    .rollNumber(authorized.getRollNumber())
                    .department(authorized.getDepartment() != null ? authorized.getDepartment() : "E&TC")
                    .academicYear(authorized.getAcademicYear() != null ? authorized.getAcademicYear() : "TE")
                    .division(authorized.getDivision())
                    .active(true)
                    .build();
        }
        studentProfileRepository.save(profile);

        String accessToken = jwtUtil.generateAccessToken(savedUser.getUsername(), savedUser.getRole().name());
        String refreshTokenStr = jwtUtil.generateRefreshToken(savedUser.getUsername());

        persistRefreshToken(savedUser, refreshTokenStr);

        try {
            auditLogService.logAction(savedUser, "REGISTER", "User", savedUser.getId(), null, Map.of(
                    "studentId", authorized.getStudentId(),
                    "role", savedUser.getRole().name(),
                    "department", authorized.getDepartment() != null ? authorized.getDepartment() : ""
            ));
        } catch (Exception e) {
            log.warn("Failed to audit register action for student {}: {}", savedUser.getUsername(), e.getMessage());
        }

        if (savedUser.getEmail() != null) {
            try {
                notificationService.sendAccountCreatedEmail(savedUser);
            } catch (Exception e) {
                log.warn("Failed to send welcome email to student {}: {}", savedUser.getEmail(), e.getMessage());
            }
        }

        log.info("Successfully registered student account: {} (ID={})", savedUser.getFullName(), authorized.getStudentId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .user(userMapper.toResponse(savedUser))
                .build();
    }

    private void persistRefreshToken(User user, String token) {
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(token)
                .expiresAt(OffsetDateTime.now().plusNanos(refreshTokenExpiryMs * 1_000_000L))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);
    }
}
