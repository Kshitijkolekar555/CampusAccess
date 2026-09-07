package com.pict.gatesecurity.entity;

import com.pict.gatesecurity.entity.enums.MeetingRequestStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "meeting_responses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeetingResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_request_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_mr_meeting_request"))
    private VisitorMeetingRequest meetingRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responded_by_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_mr_responded_by"))
    private User respondedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MeetingRequestStatus status;

    @Column(name = "meeting_location", length = 200)
    private String meetingLocation;

    @Column(length = 100)
    private String building;

    @Column(length = 50)
    private String floor;

    @Column(name = "room_number", length = 50)
    private String roomNumber;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "suggested_date")
    private LocalDate suggestedDate;

    @Column(name = "suggested_time")
    private LocalTime suggestedTime;

    @Column(name = "reschedule_reason", columnDefinition = "TEXT")
    private String rescheduleReason;

    @Column(name = "responded_at", nullable = false)
    private OffsetDateTime respondedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
