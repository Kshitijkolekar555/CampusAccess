package com.pict.gatesecurity.dto.outpass;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HostelOutpassRequest {

    private Long studentUserId;

    @NotBlank(message = "Student name is required")
    @Size(max = 150)
    private String studentName;

    @NotBlank(message = "Student PRN is required")
    @Size(max = 20)
    private String studentPrn;

    @Size(max = 15)
    private String studentMobile;

    @Size(max = 20)
    private String studentRoom;

    @Size(max = 100)
    private String studentHostel;

    @Size(max = 50)
    private String studentClass;

    @Size(max = 10)
    private String studentDivision;

    @NotBlank(message = "Reason is required")
    private String reason;

    @NotBlank(message = "Destination is required")
    @Size(max = 255)
    private String destination;

    @NotNull(message = "Departure time is required")
    private OffsetDateTime departureTime;

    @NotNull(message = "Expected return time is required")
    private OffsetDateTime expectedReturnTime;

    @Size(max = 15)
    private String parentContact;

    @Size(max = 15)
    private String emergencyContact;
}
