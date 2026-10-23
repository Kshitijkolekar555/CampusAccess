package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.auth.AuthResponse;
import com.pict.gatesecurity.dto.faculty.*;
import com.pict.gatesecurity.entity.AuthorizedFaculty;
import com.pict.gatesecurity.entity.FacultyOutpass;
import com.pict.gatesecurity.entity.FacultyProfile;
import com.pict.gatesecurity.entity.RefreshToken;
import com.pict.gatesecurity.entity.User;
import com.pict.gatesecurity.entity.enums.FacultyOutpassStatus;
import com.pict.gatesecurity.entity.enums.UserRole;
import com.pict.gatesecurity.exception.BadRequestException;
import com.pict.gatesecurity.exception.DuplicateResourceException;
import com.pict.gatesecurity.exception.ForbiddenException;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.exception.UnauthorizedException;
import com.pict.gatesecurity.mapper.UserMapper;
import com.pict.gatesecurity.repository.*;
import com.pict.gatesecurity.security.JwtUtil;
import com.pict.gatesecurity.service.AuditLogService;
import com.pict.gatesecurity.service.FacultyOutpassService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FacultyOutpassServiceImpl implements FacultyOutpassService {

    private final AuthorizedFacultyRepository authorizedFacultyRepository;
    private final FacultyProfileRepository facultyProfileRepository;
    private final FacultyOutpassRepository facultyOutpassRepository;
    private final UserRepository userRepository;
    private final GateRepository gateRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UserMapper userMapper;
    private final AuditLogService auditLogService;

    @Value("${app.jwt.refresh-token-expiry-ms:604800000}")
    private long refreshTokenExpiryMs;

    @Override
    @Transactional(readOnly = true)
    public FacultyVerifyResponse verifyFacultyEmpNo(String empNo) {
        if (empNo == null || empNo.trim().isEmpty()) {
            throw new BadRequestException("Faculty ID (empno) is required");
        }

        String cleanEmpNo = empNo.trim();
        AuthorizedFaculty authorized = authorizedFacultyRepository.findFirstByEmpNoIgnoreCase(cleanEmpNo)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Faculty ID '" + cleanEmpNo + "' is not found in the authorized PICT faculty records. Only verified faculty and staff may register."));

        // Check if an account has already been registered
        boolean accountExists = userRepository.existsByUsername(authorized.getEmpNo()) ||
                facultyProfileRepository.existsByEmpNoIgnoreCase(authorized.getEmpNo());

        if (accountExists) {
            throw new DuplicateResourceException(
                    "An account has already been registered for Faculty ID '" + cleanEmpNo + "'. Please sign in with your credentials.");
        }

        return FacultyVerifyResponse.builder()
                .eligible(true)
                .empNo(authorized.getEmpNo())
                .fullName(authorized.getFullName())
                .department(authorized.getDepartment())
                .staffType(authorized.getStaffType())
                .message("Authorized faculty record verified. Eligible for account registration.")
                .build();
    }

    @Override
    @Transactional
    public AuthResponse registerFaculty(FacultyRegisterRequest request) {
        if (request.getEmpNo() == null || request.getEmpNo().trim().isEmpty()) {
            throw new BadRequestException("Faculty ID (empno) is required");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters long");
        }

        String cleanEmpNo = request.getEmpNo().trim();
        AuthorizedFaculty authorized = authorizedFacultyRepository.findFirstByEmpNoIgnoreCase(cleanEmpNo)
                .orElseThrow(() -> new ForbiddenException(
                        "Registration rejected: Faculty ID '" + cleanEmpNo + "' is not present in the authorized faculty dataset."));

        // Name verification against authorized record
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            String cleanReqName = request.getFullName().trim().toLowerCase().replaceAll("\\s+", " ");
            String cleanAuthName = authorized.getFullName().trim().toLowerCase().replaceAll("\\s+", " ");
            // Allow matching if exact match or all tokens of one name exist in the other
            Set<String> reqTokens = new HashSet<>(Arrays.asList(cleanReqName.split(" ")));
            Set<String> authTokens = new HashSet<>(Arrays.asList(cleanAuthName.split(" ")));
            boolean namesMatch = cleanReqName.equals(cleanAuthName) ||
                    cleanReqName.contains(cleanAuthName) ||
                    cleanAuthName.contains(cleanReqName) ||
                    reqTokens.containsAll(authTokens) ||
                    authTokens.containsAll(reqTokens);

            if (!namesMatch) {
                throw new BadRequestException("The entered full name does not match the authorized institutional record for Faculty ID " + cleanEmpNo);
            }
        }

        // Prevent duplicate registration
        if (userRepository.existsByUsername(authorized.getEmpNo()) ||
            facultyProfileRepository.existsByEmpNoIgnoreCase(authorized.getEmpNo())) {
            throw new DuplicateResourceException("An account already exists for Faculty ID '" + authorized.getEmpNo() + "'");
        }

        String cleanEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : authorized.getEmpNo().toLowerCase() + "@pict.edu";
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new DuplicateResourceException("Email '" + cleanEmail + "' is already registered to another account");
        }

        boolean isTeaching = authorized.getStaffType() != null && authorized.getStaffType().equalsIgnoreCase("Teaching");
        UserRole role = isTeaching ? UserRole.FACULTY : UserRole.STAFF;

        User user = User.builder()
                .username(authorized.getEmpNo())
                .fullName(authorized.getFullName())
                .email(cleanEmail)
                .phone(request.getPhone() != null && !request.getPhone().isBlank() ? request.getPhone().trim() : null)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .active(true)
                .build();

        User savedUser = userRepository.saveAndFlush(user);

        FacultyProfile profile = FacultyProfile.builder()
                .user(savedUser)
                .empNo(authorized.getEmpNo())
                .department(authorized.getDepartment())
                .staffType(authorized.getStaffType())
                .active(true)
                .build();

        facultyProfileRepository.save(profile);

        String accessToken = jwtUtil.generateAccessToken(savedUser.getUsername(), savedUser.getRole().name());
        String refreshTokenStr = jwtUtil.generateRefreshToken(savedUser.getUsername());

        persistRefreshToken(savedUser, refreshTokenStr);

        auditLogService.logAction(savedUser, "REGISTER", "User", savedUser.getId(), null, Map.of(
                "empNo", authorized.getEmpNo(),
                "role", savedUser.getRole().name(),
                "department", authorized.getDepartment() != null ? authorized.getDepartment() : ""
        ));

        log.info("Successfully registered faculty member: {} (empNo={})", savedUser.getFullName(), authorized.getEmpNo());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .user(userMapper.toResponse(savedUser))
                .build();
    }

    @Override
    @Transactional
    public FacultyOutpassResponse generateOutpass(FacultyOutpassRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.getRole() != UserRole.FACULTY && user.getRole() != UserRole.STAFF && user.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Only faculty and staff members can generate faculty out-passes");
        }

        // Prevent multiple active out-passes
        boolean hasActive = facultyOutpassRepository.existsByFacultyIdAndStatus(user.getId(), FacultyOutpassStatus.OUTPASS_GENERATED);
        if (hasActive) {
            throw new BadRequestException("Active Out-Pass Exists: You already have an active out-pass outside campus. A new out-pass can only be generated after gate security confirms your return.");
        }

        if (request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new BadRequestException("Reason for leaving campus is required");
        }

        String passNumber = generatePassNumber();
        String department = "General";
        Optional<FacultyProfile> profileOpt = facultyProfileRepository.findByUserId(user.getId());
        if (profileOpt.isPresent() && profileOpt.get().getDepartment() != null) {
            department = profileOpt.get().getDepartment();
        } else {
            Optional<AuthorizedFaculty> authOpt = authorizedFacultyRepository.findFirstByEmpNoIgnoreCase(user.getUsername());
            if (authOpt.isPresent() && authOpt.get().getDepartment() != null) {
                department = authOpt.get().getDepartment();
            }
        }

        FacultyOutpass outpass = FacultyOutpass.builder()
                .passNumber(passNumber)
                .faculty(user)
                .facultyEmpNo(user.getUsername())
                .facultyName(user.getFullName())
                .department(department)
                .reason(request.getReason().trim())
                .explanation(request.getExplanation() != null && !request.getExplanation().isBlank() ? request.getExplanation().trim() : null)
                .status(FacultyOutpassStatus.OUTPASS_GENERATED)
                .generatedAt(OffsetDateTime.now())
                .departureTime(null) // Not recorded as departure time per explicit requirements
                .actualReturnTime(null)
                .confirmedByGuard(null)
                .build();

        FacultyOutpass savedPass = facultyOutpassRepository.save(outpass);

        auditLogService.logAction(user, "FACULTY_OUTPASS_GENERATED", "FacultyOutpass", savedPass.getId(), null, Map.of(
                "passNumber", passNumber,
                "reason", savedPass.getReason(),
                "facultyEmpNo", savedPass.getFacultyEmpNo()
        ));

        log.info("Faculty outpass generated: {} for {} (empNo={})", passNumber, user.getFullName(), user.getUsername());
        return mapToResponse(savedPass);
    }

    @Override
    @Transactional(readOnly = true)
    public FacultyOutpassResponse getMyActiveOutpass(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        return facultyOutpassRepository.findFirstByFacultyIdAndStatusOrderByIdDesc(user.getId(), FacultyOutpassStatus.OUTPASS_GENERATED)
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacultyOutpassResponse> getMyOutpassHistory(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        return facultyOutpassRepository.findByFacultyIdOrderByGeneratedAtDesc(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacultyOutpassResponse> getActiveOutpassesForGuards(String search) {
        return facultyOutpassRepository.searchPasses(FacultyOutpassStatus.OUTPASS_GENERATED, search).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacultyOutpassResponse> getOutpassHistoryForGuards(String search) {
        return facultyOutpassRepository.searchPasses(null, search).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FacultyOutpassResponse confirmFacultyReturn(Long outpassId, FacultyReturnConfirmRequest request, String guardUsername) {
        User guard = userRepository.findByUsername(guardUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Guard user not found: " + guardUsername));

        UserRole role = guard.getRole();
        boolean isGuardRole = role == UserRole.GUARD || role == UserRole.SECURITY_GUARD ||
                role == UserRole.SECURITY_OFFICER || role == UserRole.ADMIN;
        if (!isGuardRole) {
            throw new ForbiddenException("Only authenticated security guards can confirm faculty re-entry");
        }

        FacultyOutpass pass = facultyOutpassRepository.findById(outpassId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty out-pass not found: " + outpassId));

        // Concurrency / Duplicate Return Protection
        if (pass.getStatus() == FacultyOutpassStatus.RETURNED_TO_CAMPUS) {
            throw new BadRequestException("Duplicate Return Rejected: Faculty re-entry has already been confirmed for Pass #" + pass.getPassNumber());
        }

        if (pass.getStatus() != FacultyOutpassStatus.OUTPASS_GENERATED) {
            throw new BadRequestException("Invalid Pass Status: Out-pass is not in an active state eligible for return confirmation");
        }

        pass.setStatus(FacultyOutpassStatus.RETURNED_TO_CAMPUS);
        pass.setActualReturnTime(OffsetDateTime.now());
        pass.setConfirmedByGuard(guard);

        if (request != null) {
            if (request.getGuardNotes() != null && !request.getGuardNotes().isBlank()) {
                pass.setGuardNotes(request.getGuardNotes().trim());
            }
            if (request.getGateId() != null) {
                gateRepository.findById(request.getGateId()).ifPresent(pass::setGate);
            }
        }

        FacultyOutpass updatedPass = facultyOutpassRepository.save(pass);

        auditLogService.logAction(guard, "FACULTY_REENTRY_CONFIRMED", "FacultyOutpass", updatedPass.getId(), null, Map.of(
                "passNumber", updatedPass.getPassNumber(),
                "facultyEmpNo", updatedPass.getFacultyEmpNo(),
                "facultyName", updatedPass.getFacultyName(),
                "guardUsername", guard.getUsername()
        ));

        log.info("Faculty re-entry confirmed: pass={} faculty={} guard={}",
                updatedPass.getPassNumber(), updatedPass.getFacultyName(), guard.getUsername());

        return mapToResponse(updatedPass);
    }

    private FacultyOutpassResponse mapToResponse(FacultyOutpass pass) {
        if (pass == null) return null;
        String statusLabel = pass.getStatus() == FacultyOutpassStatus.OUTPASS_GENERATED
                ? "Out-Pass Generated (Outside Campus / Return Pending)"
                : "Returned to Campus";

        return FacultyOutpassResponse.builder()
                .id(pass.getId())
                .passNumber(pass.getPassNumber())
                .facultyUserId(pass.getFaculty() != null ? pass.getFaculty().getId() : null)
                .facultyEmpNo(pass.getFacultyEmpNo())
                .facultyName(pass.getFacultyName())
                .department(pass.getDepartment())
                .reason(pass.getReason())
                .explanation(pass.getExplanation())
                .status(pass.getStatus())
                .statusLabel(statusLabel)
                .generatedAt(pass.getGeneratedAt())
                .departureTime(pass.getDepartureTime())
                .actualReturnTime(pass.getActualReturnTime())
                .confirmedByGuardId(pass.getConfirmedByGuard() != null ? pass.getConfirmedByGuard().getId() : null)
                .confirmedByGuardName(pass.getConfirmedByGuard() != null ? pass.getConfirmedByGuard().getFullName() : null)
                .guardNotes(pass.getGuardNotes())
                .gateId(pass.getGate() != null ? pass.getGate().getId() : null)
                .gateName(pass.getGate() != null ? pass.getGate().getName() : null)
                .build();
    }

    private String generatePassNumber() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randPart = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return "FOP-" + datePart + "-" + randPart;
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
