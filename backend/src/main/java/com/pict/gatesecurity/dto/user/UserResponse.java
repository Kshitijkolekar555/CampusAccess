package com.pict.gatesecurity.dto.user;

import com.pict.gatesecurity.entity.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String username;
    private UserRole role;
    private String fullName;
    private String phone;
    private String email;
    private Boolean active;
    private Boolean isLateComerPermitted;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
