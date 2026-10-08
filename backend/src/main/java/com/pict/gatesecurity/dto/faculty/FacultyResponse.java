package com.pict.gatesecurity.dto.faculty;

import com.pict.gatesecurity.entity.enums.HostDepartment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyResponse {
    private Long id;
    private String name;
    private HostDepartment department;
    private String email;
    private String phone;
    private String designation;
    private String cabinLocation;
    private Boolean active;
    private OffsetDateTime createdAt;
}
