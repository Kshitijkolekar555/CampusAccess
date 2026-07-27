package com.pict.gatesecurity.dto.search;

import com.pict.gatesecurity.entity.enums.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchFilterRequest {

    private String search;

    private LocalDate fromDate;
    private LocalDate toDate;

    private Long gateId;
    private Long guardId;
    private Long userId;
    private Long vendorId;

    private HostDepartment department;
    private HostType visitorType;
    private VehicleCategory vehicleCategory;
    private PassStatus passStatus;
    private OutpassStatus outpassStatus;
    private ShiftStatus shiftStatus;
    private NotificationType notificationType;
    private NotificationStatus notificationStatus;
    private LogType logType;

    private String status;
    private String purpose;
    private String mobile;
    private String vehicleNumber;
    private String hostel;
    private String companyName;
    private String entityType;
    private String action;

    private Boolean activeInside;

    private String sortBy;
    private String sortDir;

    public String getSortByOrDefault() {
        return (sortBy != null && !sortBy.isBlank()) ? sortBy : "createdAt";
    }

    public String getSortDirOrDefault() {
        return (sortDir != null && !sortDir.isBlank()) ? sortDir : "DESC";
    }
}
