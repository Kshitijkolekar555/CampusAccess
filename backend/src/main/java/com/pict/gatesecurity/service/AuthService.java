package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.auth.*;
import com.pict.gatesecurity.dto.user.UserCreateRequest;
import com.pict.gatesecurity.dto.user.UserResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(RefreshTokenRequest request);
    void logout(String token);
    UserResponse getCurrentUser(String username);
    void changePassword(String username, ChangePasswordRequest request);
    UserResponse register(UserCreateRequest request);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
}
