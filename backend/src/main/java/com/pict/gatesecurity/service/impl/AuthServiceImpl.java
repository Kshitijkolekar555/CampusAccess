package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.auth.*;
import com.pict.gatesecurity.dto.user.UserCreateRequest;
import com.pict.gatesecurity.dto.user.UserResponse;
import com.pict.gatesecurity.entity.PasswordResetToken;
import com.pict.gatesecurity.entity.RefreshToken;
import com.pict.gatesecurity.entity.User;
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

    @Value("${app.jwt.refresh-token-expiry-ms}")
    private long refreshTokenExpiryMs;

    @Value("${app.auth.password-reset-token-expiry-ms:1800000}")
    private long passwordResetTokenExpiryMs;

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );

            User user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getUsername()));

            if (!Boolean.TRUE.equals(user.getActive())) {
                throw new UnauthorizedException("Account is disabled");
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

        } catch (BadCredentialsException e) {
            log.warn("Login failed for user {}: bad credentials", request.getUsername());
            throw new BadCredentialsException("Invalid username or password");
        }
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
        if (request.getRole() == com.pict.gatesecurity.entity.enums.UserRole.ADMIN) {
            throw new BadRequestException("Self-registration as ADMIN is not permitted. Contact system admin.");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username '" + request.getUsername() + "' is already taken");
        }

        User user = User.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .active(true)
                .build();

        User savedUser = userRepository.save(user);

        auditLogService.logAction(savedUser, "REGISTER", "User", savedUser.getId(), null, Map.of(
                "username", savedUser.getUsername(),
                "role", savedUser.getRole().name()
        ));

        if (savedUser.getEmail() != null) {
            notificationService.sendAccountCreatedEmail(savedUser);
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

        String normalizedPrn = prn.trim().toUpperCase();

        User studentUser = userRepository.findByUsername(normalizedPrn)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid PRN"));

        if (studentUser.getRole() != com.pict.gatesecurity.entity.enums.UserRole.STUDENT) {
            throw new BadRequestException("Invalid PRN: Provided identifier does not belong to a student record");
        }

        if (!Boolean.TRUE.equals(studentUser.getActive())) {
            throw new UnauthorizedException("Student account inactive");
        }

        String accessToken = jwtUtil.generateAccessToken(studentUser.getUsername(), studentUser.getRole().name());
        String refreshTokenStr = jwtUtil.generateRefreshToken(studentUser.getUsername());

        persistRefreshToken(studentUser, refreshTokenStr);

        return StudentAuthDto.builder()
                .prn(normalizedPrn)
                .studentName(studentUser.getFullName())
                .branchYear("COMP - TE")
                .hostelRoom("B-304")
                .mobileNumber(studentUser.getPhone() != null ? studentUser.getPhone() : "9876543210")
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
