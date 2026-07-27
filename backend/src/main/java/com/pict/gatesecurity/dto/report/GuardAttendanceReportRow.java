package com.pict.gatesecurity.dto.report;

import com.pict.gatesecurity.entity.enums.ShiftStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuardAttendanceReportRow {

    private Long guardId;
    private String guardName;
    private String employeeCode;
    private Long gateId;
    private String gateName;
    private LocalDate date;
    private OffsetDateTime shiftStartTime;
    private OffsetDateTime shiftEndTime;
    private ShiftStatus shiftStatus;
    private Long shiftDurationMinutes;
    private Long totalShiftsCount;
}
