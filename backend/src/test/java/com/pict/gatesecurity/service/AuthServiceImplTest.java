package com.pict.gatesecurity.service;

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
import com.pict.gatesecurity.mapper.UserMapper;
import com.pict.gatesecurity.repository.PasswordResetTokenRepository;
import com.pict.gatesecurity.repository.RefreshTokenRepository;
import com.pict.gatesecurity.repository.UserRepository;
import com.pict.gatesecurity.security.JwtUtil;
import com.pict.gatesecurity.security.TokenBlacklist;
import com.pict.gatesecurity.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private AuthenticationManager authenticationManager;
    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private JwtUtil jwtUtil;
    @Mock private TokenBlacklist tokenBlacklist;
    @Mock private UserMapper userMapper;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuditLogService auditLogService;
    @Mock private NotificationService notificationService;

    private AuthServiceImpl authService;

    private User testUser;
    private UserResponse testUserResponse;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(
                authenticationManager, userRepository, refreshTokenRepository,
                passwordResetTokenRepository, jwtUtil, tokenBlacklist,
                userMapper, passwordEncoder, auditLogService, notificationService
        );
        ReflectionTestUtils.setField(authService, "refreshTokenExpiryMs", 604800000L);
        ReflectionTestUtils.setField(authService, "passwordResetTokenExpiryMs", 1800000L);

        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .passwordHash("encoded_password")
                .role(UserRole.VISITOR)
                .fullName("Test User")
                .email("test@example.com")
                .active(true)
                .build();

        testUserResponse = UserResponse.builder()
                .id(1L)
                .username("testuser")
                .role(UserRole.VISITOR)
                .fullName("Test User")
                .email("test@example.com")
                .active(true)
                .build();
    }

    @Test
    void login_shouldSucceed() {
        LoginRequest request = LoginRequest.builder().username("testuser").password("password123").build();
        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(jwtUtil.generateAccessToken("testuser", "VISITOR")).thenReturn("access_token");
        when(jwtUtil.generateRefreshToken("testuser")).thenReturn("refresh_token");
        when(userMapper.toResponse(testUser)).thenReturn(testUserResponse);

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("access_token", response.getAccessToken());
        assertEquals("refresh_token", response.getRefreshToken());
        assertEquals("testuser", response.getUser().getUsername());
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void login_shouldFailWithBadCredentials() {
        LoginRequest request = LoginRequest.builder().username("testuser").password("wrong_password").build();
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void login_shouldFailWhenDisabled() {
        testUser.setActive(false);
        LoginRequest request = LoginRequest.builder().username("testuser").password("password123").build();
        when(authenticationManager.authenticate(any())).thenReturn(null);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        assertThrows(com.pict.gatesecurity.exception.UnauthorizedException.class,
                () -> authService.login(request));
    }

    @Test
    void refreshToken_shouldRotate() {
        RefreshTokenRequest request = new RefreshTokenRequest("old_refresh_token");
        OffsetDateTime future = OffsetDateTime.now().plusDays(1);
        RefreshToken storedToken = RefreshToken.builder()
                .id(1L)
                .user(testUser)
                .token("old_refresh_token")
                .expiresAt(future)
                .revoked(false)
                .build();

        when(jwtUtil.isTokenValid("old_refresh_token")).thenReturn(true);
        when(jwtUtil.isRefreshToken("old_refresh_token")).thenReturn(true);
        when(refreshTokenRepository.findByToken("old_refresh_token")).thenReturn(Optional.of(storedToken));
        when(jwtUtil.generateAccessToken("testuser", "VISITOR")).thenReturn("new_access_token");
        when(jwtUtil.generateRefreshToken("testuser")).thenReturn("new_refresh_token");
        when(userMapper.toResponse(testUser)).thenReturn(testUserResponse);

        AuthResponse response = authService.refreshToken(request);

        assertNotNull(response);
        assertEquals("new_access_token", response.getAccessToken());
        assertEquals("new_refresh_token", response.getRefreshToken());
        assertTrue(storedToken.getRevoked());
        verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class));
    }

    @Test
    void refreshToken_shouldFailWhenRevoked() {
        RefreshTokenRequest request = new RefreshTokenRequest("revoked_token");
        RefreshToken storedToken = RefreshToken.builder()
                .id(1L)
                .user(testUser)
                .token("revoked_token")
                .expiresAt(OffsetDateTime.now().plusDays(1))
                .revoked(true)
                .build();

        when(jwtUtil.isTokenValid("revoked_token")).thenReturn(true);
        when(jwtUtil.isRefreshToken("revoked_token")).thenReturn(true);
        when(refreshTokenRepository.findByToken("revoked_token")).thenReturn(Optional.of(storedToken));

        assertThrows(BadRequestException.class, () -> authService.refreshToken(request));
    }

    @Test
    void changePassword_shouldSucceed() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("old_pass", "encoded_password")).thenReturn(true);
        when(passwordEncoder.encode("new_pass")).thenReturn("new_encoded");

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("old_pass")
                .newPassword("new_pass")
                .confirmPassword("new_pass")
                .build();
        authService.changePassword("testuser", request);

        verify(userRepository).save(any(User.class));
    }

    @Test
    void changePassword_shouldFailWhenWrongCurrentPassword() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrong_pass", "encoded_password")).thenReturn(false);

        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("wrong_pass")
                .newPassword("new_pass")
                .confirmPassword("new_pass")
                .build();
        assertThrows(BadRequestException.class, () -> authService.changePassword("testuser", request));
    }

    @Test
    void register_shouldSucceed() {
        UserCreateRequest request = new UserCreateRequest("newuser", "password123", UserRole.VISITOR, "New User", null, "new@example.com");

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            return User.builder()
                    .id(2L)
                    .username(u.getUsername())
                    .passwordHash(u.getPasswordHash())
                    .role(u.getRole())
                    .fullName(u.getFullName())
                    .active(true)
                    .build();
        });
        when(userMapper.toResponse(any(User.class))).thenReturn(testUserResponse);

        UserResponse response = authService.register(request);
        assertNotNull(response);
    }

    @Test
    void register_shouldFailWhenUsernameTaken() {
        UserCreateRequest request = new UserCreateRequest("existing", "password123", UserRole.VISITOR, "Existing User", null, null);
        when(userRepository.existsByUsername("existing")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(request));
    }

    @Test
    void forgotPassword_shouldGenerateToken() {
        ForgotPasswordRequest request = new ForgotPasswordRequest("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        authService.forgotPassword(request);

        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
    }

    @Test
    void forgotPassword_shouldFindByEmail() {
        ForgotPasswordRequest request = new ForgotPasswordRequest("test@example.com");
        when(userRepository.findByUsername("test@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        authService.forgotPassword(request);

        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
    }

    @Test
    void forgotPassword_shouldFailWhenUserNotFound() {
        ForgotPasswordRequest request = new ForgotPasswordRequest("nonexistent");
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("nonexistent")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.forgotPassword(request));
    }

    @Test
    void resetPassword_shouldSucceed() {
        String token = "valid_reset_token";
        OffsetDateTime future = OffsetDateTime.now().plusHours(1);
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .id(1L)
                .user(testUser)
                .token(token)
                .expiresAt(future)
                .used(false)
                .build();

        when(passwordResetTokenRepository.findByToken(token)).thenReturn(Optional.of(resetToken));
        when(passwordEncoder.encode("new_password")).thenReturn("new_encoded");

        ResetPasswordRequest request = new ResetPasswordRequest(token, "new_password");
        authService.resetPassword(request);

        assertTrue(resetToken.getUsed());
        verify(userRepository).save(testUser);
        verify(passwordResetTokenRepository).save(resetToken);
        verify(refreshTokenRepository).deleteByUserId(testUser.getId());
    }

    @Test
    void resetPassword_shouldFailWhenTokenUsed() {
        String token = "used_token";
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .id(1L)
                .user(testUser)
                .token(token)
                .expiresAt(OffsetDateTime.now().plusHours(1))
                .used(true)
                .build();

        when(passwordResetTokenRepository.findByToken(token)).thenReturn(Optional.of(resetToken));

        ResetPasswordRequest request = new ResetPasswordRequest(token, "new_password");
        assertThrows(BadRequestException.class, () -> authService.resetPassword(request));
    }

    @Test
    void resetPassword_shouldFailWhenTokenExpired() {
        String token = "expired_token";
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .id(1L)
                .user(testUser)
                .token(token)
                .expiresAt(OffsetDateTime.now().minusHours(1))
                .used(false)
                .build();

        when(passwordResetTokenRepository.findByToken(token)).thenReturn(Optional.of(resetToken));

        ResetPasswordRequest request = new ResetPasswordRequest(token, "new_password");
        assertThrows(BadRequestException.class, () -> authService.resetPassword(request));
    }

    @Test
    void logout_shouldBlacklistTokenAndRevokeRefreshTokens() {
        String authHeader = "Bearer access_token_123";
        when(jwtUtil.isTokenValid("access_token_123")).thenReturn(true);
        when(jwtUtil.isAccessToken("access_token_123")).thenReturn(true);
        when(jwtUtil.extractUsername("access_token_123")).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        authService.logout(authHeader);

        verify(tokenBlacklist).blacklist("access_token_123");
        verify(refreshTokenRepository).deleteByUserId(1L);
    }
}
