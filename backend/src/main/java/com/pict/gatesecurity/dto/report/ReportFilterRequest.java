package com.pict.gatesecurity.dto.report;

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
public class ReportFilterRequest {

    private LocalDate fromDate;
    private LocalDate toDate;
    private Long gateId;
    private Long guardId;
    private HostDepartment department;
    private HostType visitorType;
    private VehicleCategory vehicleType;
    private String status;
    private String purpose;
    private String search;
    private Long studentId;
    private Long vendorId;
    private String hostel;
    private String entityType;
    private Long userId;
    private NotificationType notificationType;
    private NotificationStatus notificationStatus;
    private PassStatus passStatus;
    private OutpassStatus outpassStatus;
    private Boolean activeInside;
    private String period;
}
