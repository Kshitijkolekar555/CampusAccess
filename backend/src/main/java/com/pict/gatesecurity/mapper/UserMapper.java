package com.pict.gatesecurity.mapper;

import com.pict.gatesecurity.dto.user.UserResponse;
import com.pict.gatesecurity.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        if (user == null) {
            return null;
        }
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .role(user.getRole())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
