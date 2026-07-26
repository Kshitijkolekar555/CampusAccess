package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.user.UserCreateRequest;
import com.pict.gatesecurity.dto.user.UserProfileUpdateRequest;
import com.pict.gatesecurity.dto.user.UserResponse;
import com.pict.gatesecurity.dto.user.UserStatusUpdateRequest;
import com.pict.gatesecurity.dto.user.UserUpdateRequest;
import com.pict.gatesecurity.entity.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {
    UserResponse createUser(UserCreateRequest request, String performingUsername);
    UserResponse getUserById(Long id);
    Page<UserResponse> getUsers(String query, UserRole role, Boolean active, Pageable pageable);
    UserResponse updateUser(Long id, UserUpdateRequest request, String performingUsername);
    UserResponse updateProfile(String username, UserProfileUpdateRequest request);
    UserResponse updateUserStatus(Long id, UserStatusUpdateRequest request, String performingUsername);
}
