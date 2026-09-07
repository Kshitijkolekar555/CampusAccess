package com.pict.gatesecurity.dto.meeting;

import com.pict.gatesecurity.entity.enums.MeetingRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingResponseDto {

    private Long id;
    private MeetingRequestStatus status;
    private String meetingLocation;
    private String building;
    private String floor;
    private String roomNumber;
    private String notes;
    private String rejectionReason;
    private LocalDate suggestedDate;
    private LocalTime suggestedTime;
    private String rescheduleReason;
    private Long respondedById;
    private String respondedByName;
    private String respondedByUsername;
    private OffsetDateTime respondedAt;
    private OffsetDateTime createdAt;
}
