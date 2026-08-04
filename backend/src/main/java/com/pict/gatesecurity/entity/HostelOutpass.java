package com.pict.gatesecurity.entity;

import com.pict.gatesecurity.entity.enums.OutpassStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "hostel_outpasses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HostelOutpass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_user_id",
            foreignKey = @ForeignKey(name = "fk_ho_student_user"))
    private User studentUser;

    @Column(name = "student_name", nullable = false, length = 150)
    private String studentName;

    @Column(name = "student_prn", nullable = false, length = 20)
    private String studentPrn;

    @Column(name = "student_mobile", length = 15)
    private String studentMobile;

    @Column(name = "student_room", length = 20)
    private String studentRoom;

    @Column(name = "student_hostel", length = 100)
    private String studentHostel;

    @Column(name = "student_class", length = 50)
    private String studentClass;

    @Column(name = "student_division", length = 10)
    private String studentDivision;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "student_note", columnDefinition = "TEXT")
    private String studentNote;

    @Column(nullable = false, length = 255)
    private String destination;

    @Column(name = "departure_time", nullable = false)
    private OffsetDateTime departureTime;

    @Column(name = "expected_return_time", nullable = false)
    private OffsetDateTime expectedReturnTime;

    @Column(name = "actual_return_time")
    private OffsetDateTime actualReturnTime;

    @Column(name = "parent_contact", length = 15)
    private String parentContact;

    @Column(name = "emergency_contact", length = 15)
    private String emergencyContact;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OutpassStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warden_id",
            foreignKey = @ForeignKey(name = "fk_ho_warden"))
    private User warden;

    @Column(name = "warden_remarks", columnDefinition = "TEXT")
    private String wardenRemarks;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "warden_acted_at")
    private OffsetDateTime wardenActedAt;

    @Column(name = "gate_exit_at")
    private OffsetDateTime gateExitAt;

    @Column(name = "gate_entry_at")
    private OffsetDateTime gateEntryAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id",
            foreignKey = @ForeignKey(name = "fk_ho_gate"))
    private Gate gate;

    @Column(name = "is_late_return", nullable = false)
    @Builder.Default
    private Boolean isLateReturn = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false,
            foreignKey = @ForeignKey(name = "fk_ho_created_by"))
    private User createdBy;
}
