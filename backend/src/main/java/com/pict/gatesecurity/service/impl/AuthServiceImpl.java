package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.auth.*;
import com.pict.gatesecurity.dto.user.UserCreateRequest;
import com.pict.gatesecurity.dto.user.UserResponse;
import com.pict.gatesecurity.entity.PasswordResetToken;
import com.pict.gatesecurity.entity.RefreshToken;
import com.pict.gatesecurity.entity.User;
import com.pict.gatesecurity.entity.enums.UserRole;
import com.pict.gatesecurity.exception.BadRequestException;
import com.pict.gatesecurity.exception.DuplicateResourceException;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.exception.UnauthorizedException;
import com.pict.gatesecurity.mapper.UserMapper;
import com.pict.gatesecurity.repository.PasswordResetTokenRepository;
import com.pict.gatesecurity.repository.RefreshTokenRepository;
import com.pict.gatesecurity.repository.UserRepository;
import com.pict.gatesecurity.security.JwtUtil;
import com.pict.gatesecurity.security.TokenBlacklist;
import com.pict.gatesecurity.service.AuditLogService;
import com.pict.gatesecurity.service.AuthService;
import com.pict.gatesecurity.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtUtil jwtUtil;
    private final TokenBlacklist tokenBlacklist;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final com.pict.gatesecurity.repository.StudentGatePassRepository studentGatePassRepository;
    private final com.pict.gatesecurity.repository.HostelOutpassRepository hostelOutpassRepository;
    private final com.pict.gatesecurity.repository.StudentProfileRepository studentProfileRepository;

    @Value("${app.jwt.refresh-token-expiry-ms}")
    private long refreshTokenExpiryMs;

    @Value("${app.auth.password-reset-token-expiry-ms:1800000}")
    private long passwordResetTokenExpiryMs;

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        String cleanUsername = request.getUsername() != null ? request.getUsername().trim() : "";
        String cleanPassword = request.getPassword() != null ? request.getPassword() : "";

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(cleanUsername, cleanPassword)
            );
        } catch (BadCredentialsException e) {
            // Check student default password or case mismatch fallback
            Optional<User> studentOpt = userRepository.findFirstByUsernameIgnoreCase(cleanUsername)
                    .or(() -> studentProfileRepository.findFirstByPrnIgnoreCase(cleanUsername).map(com.pict.gatesecurity.entity.StudentProfile::getUser));

            if (studentOpt.isPresent() && studentOpt.get().getRole() == UserRole.STUDENT) {
                User student = studentOpt.get();
                // Check if password matches enrollment number / username / PRN ignoring case
                if (cleanPassword.equalsIgnoreCase(student.getUsername()) ||
                    cleanPassword.equalsIgnoreCase(cleanUsername)) {
                    log.info("Student {} authenticated via default enrollment number password fallback", student.getUsername());
                    // Sync password hash
                    student.setPasswordHash(passwordEncoder.encode(cleanPassword));
                    userRepository.save(student);
                    return buildAuthResponse(student, request);
                }
            }

            log.warn("Login failed for user {}: bad credentials", request.getUsername());
            throw new BadCredentialsException("Invalid username or password");
        }

        User user = userRepository.findFirstByUsernameIgnoreCase(cleanUsername)
                .orElseGet(() -> userRepository.findFirstByEmailIgnoreCase(cleanUsername)
                        .orElseGet(() -> studentProfileRepository.findFirstByPrnIgnoreCase(cleanUsername)
                                .map(com.pict.gatesecurity.entity.StudentProfile::getUser)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + cleanUsername))));

        return buildAuthResponse(user, request);
    }

    private AuthResponse buildAuthResponse(User user, LoginRequest request) {
        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new UnauthorizedException("Account is disabled");
        }

        // Enforce supported login roles: Only Guard and Student are permitted to authenticate
        UserRole role = user.getRole();
        boolean isAllowedRole = role == UserRole.STUDENT
                || role == UserRole.GUARD
                || role == UserRole.SECURITY_GUARD
                || role == UserRole.SECURITY_OFFICER;

        if (!isAllowedRole) {
            log.warn("Blocked login attempt for unsupported role: {} (user={})", role, user.getUsername());
            throw new UnauthorizedException("Login is restricted to Security Guard and Student accounts only. Admin, Faculty, and Warden accounts are not permitted to log in.");
        }

        if (request.getExpectedRole() != null && !request.getExpectedRole().isBlank()) {
            String expRole = request.getExpectedRole().trim();
            boolean roleMatches = user.getRole().name().equalsIgnoreCase(expRole)
                    || (user.getRole().name().contains("GUARD") && expRole.contains("GUARD"));
            if (!roleMatches) {
                throw new BadRequestException("Role Mismatch: Account '" + user.getUsername() + "' is registered as " + user.getRole().name() + ", not " + request.getExpectedRole());
            }
        }

        String accessToken = jwtUtil.generateAccessToken(user.getUsername(), user.getRole().name());
        String refreshTokenStr = jwtUtil.generateRefreshToken(user.getUsername());

        persistRefreshToken(user, refreshTokenStr);

        auditLogService.logAction(user, "LOGIN", "User", user.getId(), null, Map.of("username", user.getUsername()));

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .user(userMapper.toResponse(user))
                .build();
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshTokenStr = request.getRefreshToken();
        if (!jwtUtil.isTokenValid(refreshTokenStr) || !jwtUtil.isRefreshToken(refreshTokenStr)) {
            throw new BadRequestException("Invalid or expired refresh token");
        }

        RefreshToken storedToken = refreshTokenRepository.findByToken(refreshTokenStr)
                .orElseThrow(() -> new BadRequestException("Refresh token not found or has been revoked"));

        if (storedToken.getRevoked()) {
            throw new BadRequestException("Refresh token has been revoked");
        }

        if (storedToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new BadRequestException("Refresh token has expired");
        }

        User user = storedToken.getUser();
        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new UnauthorizedException("Account is disabled");
        }

        UserRole role = user.getRole();
        boolean isAllowedRole = role == UserRole.STUDENT
                || role == UserRole.GUARD
                || role == UserRole.SECURITY_GUARD
                || role == UserRole.SECURITY_OFFICER;

        if (!isAllowedRole) {
            log.warn("Blocked refresh token attempt for unsupported role: {} (user={})", role, user.getUsername());
            throw new UnauthorizedException("Token refresh is restricted to Security Guard and Student accounts only.");
        }

        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        String newAccessToken = jwtUtil.generateAccessToken(user.getUsername(), user.getRole().name());
        String newRefreshTokenStr = jwtUtil.generateRefreshToken(user.getUsername());

        persistRefreshToken(user, newRefreshTokenStr);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshTokenStr)
                .tokenType("Bearer")
                .user(userMapper.toResponse(user))
                .build();
    }

    @Override
    @Transactional
    public void logout(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            String jwt = token.substring(7);
            tokenBlacklist.blacklist(jwt);

            if (jwtUtil.isTokenValid(jwt) && jwtUtil.isAccessToken(jwt)) {
                String username = jwtUtil.extractUsername(jwt);
                userRepository.findByUsername(username).ifPresent(user -> {
                    refreshTokenRepository.deleteByUserId(user.getId());
                    log.info("All refresh tokens revoked for user: {}", username);
                });
            }

            log.info("Token successfully blacklisted for logout");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (org.springframework.util.StringUtils.hasText(request.getConfirmPassword())
                && !request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirm password do not match");
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password does not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Invalidate active refresh tokens after password change
        refreshTokenRepository.deleteByUserId(user.getId());

        auditLogService.logAction(user, "CHANGE_PASSWORD", "User", user.getId(), null, Map.of("username", user.getUsername()));
        notificationService.sendPasswordChangedEmail(user);
        log.info("Password changed for user: {}", username);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByUsername(request.getUsernameOrEmail())
                .orElseGet(() -> userRepository.findByEmail(request.getUsernameOrEmail())
                        .orElseThrow(() -> new ResourceNotFoundException("User not found")));

        String resetToken = UUID.randomUUID().toString();

        PasswordResetToken tokenEntity = PasswordResetToken.builder()
                .user(user)
                .token(resetToken)
                .expiresAt(OffsetDateTime.now().plusNanos(passwordResetTokenExpiryMs * 1_000_000L))
                .used(false)
                .build();
        passwordResetTokenRepository.save(tokenEntity);

        if (user.getEmail() != null) {
            notificationService.sendPasswordResetEmail(user, resetToken);
        }

        log.info("Password reset token generated for user: {}", user.getUsername());
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken tokenEntity = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        if (tokenEntity.getUsed()) {
            throw new BadRequestException("Reset token has already been used");
        }

        if (tokenEntity.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new BadRequestException("Reset token has expired");
        }

        User user = tokenEntity.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        tokenEntity.setUsed(true);
        passwordResetTokenRepository.save(tokenEntity);

        refreshTokenRepository.deleteByUserId(user.getId());

        auditLogService.logAction(user, "RESET_PASSWORD", "User", user.getId(), null, Map.of("username", user.getUsername()));
        notificationService.sendPasswordChangedEmail(user);
        log.info("Password reset completed for user: {}", user.getUsername());
    }

    @Override
    @Transactional
    public UserResponse register(UserCreateRequest request) {
        UserRole regRole = request.getRole();
        if (regRole != UserRole.STUDENT && regRole != UserRole.GUARD && regRole != UserRole.SECURITY_GUARD) {
            throw new BadRequestException("Registration is restricted to Student and Guard accounts only. Admin, Faculty, and Warden registration is not permitted.");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username '" + request.getUsername() + "' is already taken");
        }

        String phone = (request.getPhone() != null && !request.getPhone().isBlank()) ? request.getPhone().trim() : null;
        String email = (request.getEmail() != null && !request.getEmail().isBlank()) ? request.getEmail().trim().toLowerCase() : null;

        User user = User.builder()
                .username(request.getUsername().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .fullName(request.getFullName().trim())
                .phone(phone)
                .email(email)
                .active(true)
                .build();

        User savedUser = userRepository.saveAndFlush(user);

        // Ensure a StudentProfile exists for new student accounts
        if (savedUser.getRole() == UserRole.STUDENT && studentProfileRepository != null) {
            String prn = savedUser.getUsername().toUpperCase();
            if (studentProfileRepository.findByUserId(savedUser.getId()).isEmpty() &&
                !studentProfileRepository.existsByPrn(prn)) {
                com.pict.gatesecurity.entity.StudentProfile profile = com.pict.gatesecurity.entity.StudentProfile.builder()
                        .user(savedUser)
                        .prn(prn)
                        .department("General")
                        .academicYear("FE")
                        .active(true)
                        .build();
                studentProfileRepository.save(profile);
                log.info("Created default StudentProfile for new student: {}", savedUser.getUsername());
            }
        }

        try {
            auditLogService.logAction(savedUser, "REGISTER", "User", savedUser.getId(), null, Map.of(
                    "username", savedUser.getUsername(),
                    "role", savedUser.getRole().name()
            ));
        } catch (Exception e) {
            log.warn("Failed to audit register action for user {}: {}", savedUser.getUsername(), e.getMessage());
        }

        if (savedUser.getEmail() != null) {
            try {
                notificationService.sendAccountCreatedEmail(savedUser);
            } catch (Exception e) {
                log.warn("Failed to send welcome email to {}: {}", savedUser.getEmail(), e.getMessage());
            }
        }

        log.info("New user registered: {}", savedUser.getUsername());
        return userMapper.toResponse(savedUser);
    }

    @Override
    @Transactional
    public StudentAuthDto verifyPrn(String prn) {
        if (prn == null || prn.trim().isEmpty()) {
            throw new BadRequestException("PRN is required");
        }

        String searchKey = prn.trim();
        String normalizedKey = searchKey.toUpperCase();

        User studentUser = userRepository.findByUsername(normalizedKey)
                .orElseGet(() -> {
                    // Check if lookup key matches student_profiles PRN or Roll Number
                    if (studentProfileRepository != null) {
                        return studentProfileRepository.findByPrn(searchKey)
                                .or(() -> studentProfileRepository.findByRollNumber(searchKey))
                                .map(com.pict.gatesecurity.entity.StudentProfile::getUser)
                                .orElse(null);
                    }
                    return null;
                });

        if (studentUser == null) {
            throw new ResourceNotFoundException("Invalid PRN: Student not found in college directory");
        }

        if (studentUser.getRole() != com.pict.gatesecurity.entity.enums.UserRole.STUDENT) {
            throw new BadRequestException("Invalid PRN: Provided identifier does not belong to a student record");
        }

        if (!Boolean.TRUE.equals(studentUser.getActive())) {
            throw new UnauthorizedException("Student account inactive");
        }

        String accessToken = jwtUtil.generateAccessToken(studentUser.getUsername(), studentUser.getRole().name());
        String refreshTokenStr = jwtUtil.generateRefreshToken(studentUser.getUsername());

        persistRefreshToken(studentUser, refreshTokenStr);

        String branchYear = null;
        String hostelRoom = null;
        String mobileNumber = studentUser.getPhone();

        // 1. Try student_profiles for department and class
        if (studentProfileRepository != null) {
            java.util.Optional<com.pict.gatesecurity.entity.StudentProfile> profileOpt =
                    studentProfileRepository.findByUserId(studentUser.getId());
            if (profileOpt.isPresent()) {
                com.pict.gatesecurity.entity.StudentProfile sp = profileOpt.get();
                branchYear = sp.getDepartment();
                if (sp.getAcademicYear() != null) {
                    branchYear = sp.getAcademicYear() + " " + (branchYear != null ? branchYear : "");
                }
                if (sp.getDivision() != null) {
                    branchYear = (branchYear != null ? branchYear : "") + " (" + sp.getDivision() + ")";
                }
            }
        }

        if (studentGatePassRepository != null) {
            java.util.Optional<com.pict.gatesecurity.entity.StudentGatePass> latestGatePass =
                    studentGatePassRepository.findFirstByStudentPrnOrderByIdDesc(studentUser.getUsername());
            if (latestGatePass.isPresent()) {
                com.pict.gatesecurity.entity.StudentGatePass gp = latestGatePass.get();
                if (branchYear == null) {
                    if (gp.getStudentDepartment() != null && gp.getStudentClass() != null) {
                        branchYear = gp.getStudentDepartment() + " - " + gp.getStudentClass();
                    } else if (gp.getStudentDepartment() != null) {
                        branchYear = gp.getStudentDepartment();
                    }
                }
                if (mobileNumber == null) {
                    mobileNumber = gp.getStudentMobile();
                }
            }
        }

        if (hostelOutpassRepository != null) {
            java.util.Optional<com.pict.gatesecurity.entity.HostelOutpass> latestOutpass =
                    hostelOutpassRepository.findFirstByStudentPrnOrderByIdDesc(studentUser.getUsername());
            if (latestOutpass.isPresent()) {
                com.pict.gatesecurity.entity.HostelOutpass ho = latestOutpass.get();
                if (ho.getStudentHostel() != null && ho.getStudentRoom() != null) {
                    hostelRoom = ho.getStudentHostel() + " • " + ho.getStudentRoom();
                } else if (ho.getStudentRoom() != null) {
                    hostelRoom = ho.getStudentRoom();
                }
                if (mobileNumber == null) {
                    mobileNumber = ho.getStudentMobile();
                }
            }
        }

        return StudentAuthDto.builder()
                .prn(studentUser.getUsername())
                .studentName(studentUser.getFullName())
                .branchYear(branchYear)
                .hostelRoom(hostelRoom)
                .mobileNumber(mobileNumber)
                .active(studentUser.getActive())
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
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
