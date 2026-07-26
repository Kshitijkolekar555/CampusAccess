package com.pict.gatesecurity.entity;

import com.pict.gatesecurity.entity.enums.HostDepartment;
import com.pict.gatesecurity.entity.enums.HostType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "visitors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Visitor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 15)
    private String mobile;

    @Column(nullable = false, length = 255)
    private String purpose;

    @Column(name = "host_name", nullable = false, length = 150)
    private String hostName;

    @Enumerated(EnumType.STRING)
    @Column(name = "host_type", nullable = false, columnDefinition = "host_type")
    private HostType hostType;

    @Enumerated(EnumType.STRING)
    @Column(name = "host_department", nullable = false, columnDefinition = "host_department")
    private HostDepartment hostDepartment;

    /**
     * Student PRN — only populated when hostType is STUDENT.
     */
    @Column(name = "student_prn", length = 20)
    private String studentPrn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_visitors_gate"))
    private Gate gate;

    @Column(name = "vehicle_number", length = 20)
    private String vehicleNumber;

    @Column(name = "time_in", nullable = false)
    private OffsetDateTime timeIn;

    /**
     * Null means visitor is still inside the campus.
     */
    @Column(name = "time_out")
    private OffsetDateTime timeOut;

    @Column(name = "id_proof_type", nullable = false, length = 50)
    private String idProofType;

    @Column(name = "id_proof_number", nullable = false, length = 50)
    private String idProofNumber;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    /**
     * True if the visitor's mobile or name matched an entry in the watchlist
     * at the time of check-in.
     */
    @Column(name = "is_blacklisted_match", nullable = false)
    @Builder.Default
    private Boolean isBlacklistedMatch = false;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false,
            foreignKey = @ForeignKey(name = "fk_visitors_created_by"))
    private User createdBy;
}
