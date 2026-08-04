package com.pict.gatesecurity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "vehicle_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_vehicle_logs_vehicle"))
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_vehicle_logs_gate"))
    private Gate gate;

    @Column(name = "entry_time", nullable = false)
    private OffsetDateTime entryTime;

    @Column(name = "exit_time")
    private OffsetDateTime exitTime;

    @Column(name = "driver_name", length = 150)
    private String driverName;

    @Column(name = "driver_contact", length = 15)
    private String driverContact;

    @Column(length = 255)
    private String purpose;

    @Column(name = "entry_note", columnDefinition = "TEXT")
    private String entryNote;

    @Column(name = "exit_note", columnDefinition = "TEXT")
    private String exitNote;

    @Column(name = "action_time")
    private OffsetDateTime actionTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by_guard_id",
            foreignKey = @ForeignKey(name = "fk_vehicle_logs_processed_by_guard"))
    private User processedByGuard;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false,
            foreignKey = @ForeignKey(name = "fk_vehicle_logs_created_by"))
    private User createdBy;
}
