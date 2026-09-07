package com.pict.gatesecurity.dto.meeting;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingApprovalRequest {

    @NotBlank(message = "Meeting location is required")
    private String meetingLocation;

    private String building;

    private String floor;

    private String roomNumber;

    private String notes;
}
