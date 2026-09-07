package com.pict.gatesecurity.dto.faculty;

import com.pict.gatesecurity.entity.enums.FacultyAvailabilityStatus;
import com.pict.gatesecurity.entity.enums.HostDepartment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyListResponse {

    private Long id;
    private String username;
    private String fullName;
    private HostDepartment department;
    private String email;
    private String phone;
    private FacultyAvailabilityStatus todayStatus;
    private String todayNote;
}
