package com.pict.gatesecurity.entity;

import com.pict.gatesecurity.entity.enums.PassStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "student_gate_passes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentGatePass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_user_id",
            foreignKey = @ForeignKey(name = "fk_sgp_student_user"))
    private User studentUser;

    @Column(name = "student_name", nullable = false, length = 150)
    private String studentName;

    @Column(name = "student_prn", nullable = false, length = 20)
    private String studentPrn;

    @Column(name = "student_mobile", length = 15)
    private String studentMobile;

    @Column(name = "student_class", length = 50)
    private String studentClass;

    @Column(name = "student_division", length = 10)
    private String studentDivision;

    @Column(name = "student_department", length = 50)
    private String studentDepartment;

    @Column(nullable = false, length = 255)
    private String purpose;

    @Column(nullable = false, length = 255)
    private String destination;

    @Column(name = "departure_time", nullable = false)
    private OffsetDateTime departureTime;

    @Column(name = "expected_return_time", nullable = false)
    private OffsetDateTime expectedReturnTime;

    @Column(name = "actual_return_time")
    private OffsetDateTime actualReturnTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PassStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by",
            foreignKey = @ForeignKey(name = "fk_sgp_approved_by"))
    private User approvedBy;

    @Column(name = "approval_notes", columnDefinition = "TEXT")
    private String approvalNotes;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "warden_approved_at")
    private OffsetDateTime wardenApprovedAt;

    @Column(name = "gate_exit_at")
    private OffsetDateTime gateExitAt;

    @Column(name = "gate_entry_at")
    private OffsetDateTime gateEntryAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id",
            foreignKey = @ForeignKey(name = "fk_sgp_gate"))
    private Gate gate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false,
            foreignKey = @ForeignKey(name = "fk_sgp_created_by"))
    private User createdBy;
}
