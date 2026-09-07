package com.pict.gatesecurity.entity;

import com.pict.gatesecurity.entity.enums.HostDepartment;
import com.pict.gatesecurity.entity.enums.MeetingRequestStatus;
import com.pict.gatesecurity.entity.enums.PurposeType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "visitor_meeting_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitorMeetingRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visitor_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_vmr_visitor"))
    private Visitor visitor;

    @Enumerated(EnumType.STRING)
    @Column(name = "purpose_type", nullable = false, length = 30)
    private PurposeType purposeType;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private HostDepartment department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id",
            foreignKey = @ForeignKey(name = "fk_vmr_faculty"))
    private User faculty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_vmr_gate"))
    private Gate gate;

    @Column(name = "request_time", nullable = false)
    private OffsetDateTime requestTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private MeetingRequestStatus status = MeetingRequestStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;
}
