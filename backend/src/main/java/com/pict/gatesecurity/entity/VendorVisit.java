package com.pict.gatesecurity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "vendor_visits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_vendor_visits_vendor"))
    private Vendor vendor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_vendor_visits_gate"))
    private Gate gate;

    @Column(name = "entry_time", nullable = false)
    private OffsetDateTime entryTime;

    @Column(name = "exit_time")
    private OffsetDateTime exitTime;

    @Column(length = 255)
    private String purpose;

    @Column(name = "entry_note", columnDefinition = "TEXT")
    private String entryNote;

    @Column(name = "exit_note", columnDefinition = "TEXT")
    private String exitNote;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false,
            foreignKey = @ForeignKey(name = "fk_vendor_visits_created_by"))
    private User createdBy;
}
