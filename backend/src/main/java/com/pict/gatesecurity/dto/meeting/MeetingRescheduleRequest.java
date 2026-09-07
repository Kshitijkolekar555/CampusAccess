package com.pict.gatesecurity.dto.meeting;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingRescheduleRequest {

    @NotNull(message = "Suggested date is required")
    private LocalDate suggestedDate;

    @NotNull(message = "Suggested time is required")
    private LocalTime suggestedTime;

    @NotBlank(message = "Reschedule reason is required")
    private String reason;
}
