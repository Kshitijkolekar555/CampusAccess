package com.pict.gatesecurity.mapper;

import com.pict.gatesecurity.dto.guard.GuardResponse;
import com.pict.gatesecurity.dto.guard.ShiftLogResponse;
import com.pict.gatesecurity.dto.guard.ShiftResponse;
import com.pict.gatesecurity.entity.Guard;
import com.pict.gatesecurity.entity.Shift;
import com.pict.gatesecurity.entity.ShiftLog;
import org.springframework.stereotype.Component;

@Component
public class GuardMapper {

    public GuardResponse toResponse(Guard guard) {
        if (guard == null) {
            return null;
        }
        return GuardResponse.builder()
                .id(guard.getId())
                .userId(guard.getUser() != null ? guard.getUser().getId() : null)
                .username(guard.getUser() != null ? guard.getUser().getUsername() : null)
                .fullName(guard.getUser() != null ? guard.getUser().getFullName() : null)
                .phone(guard.getUser() != null ? guard.getUser().getPhone() : null)
                .employeeCode(guard.getEmployeeCode())
                .assignedGateId(guard.getAssignedGate() != null ? guard.getAssignedGate().getId() : null)
                .assignedGateName(guard.getAssignedGate() != null ? guard.getAssignedGate().getName() : null)
                .active(guard.getActive())
                .build();
    }

    public ShiftResponse toShiftResponse(Shift shift) {
        if (shift == null) {
            return null;
        }
        return ShiftResponse.builder()
                .id(shift.getId())
                .guardId(shift.getGuard() != null ? shift.getGuard().getId() : null)
                .guardName(shift.getGuard() != null && shift.getGuard().getUser() != null ? shift.getGuard().getUser().getFullName() : null)
                .employeeCode(shift.getGuard() != null ? shift.getGuard().getEmployeeCode() : null)
                .gateId(shift.getGate() != null ? shift.getGate().getId() : null)
                .gateName(shift.getGate() != null ? shift.getGate().getName() : null)
                .startTime(shift.getStartTime())
                .endTime(shift.getEndTime())
                .date(shift.getDate())
                .status(shift.getStatus())
                .build();
    }

    public ShiftLogResponse toShiftLogResponse(ShiftLog shiftLog) {
        if (shiftLog == null) {
            return null;
        }
        return ShiftLogResponse.builder()
                .id(shiftLog.getId())
                .shiftId(shiftLog.getShift() != null ? shiftLog.getShift().getId() : null)
                .timestamp(shiftLog.getTimestamp())
                .description(shiftLog.getDescription())
                .logType(shiftLog.getLogType())
                .build();
    }
}
