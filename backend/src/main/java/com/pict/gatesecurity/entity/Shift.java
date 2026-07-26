package com.pict.gatesecurity.entity;

import com.pict.gatesecurity.entity.enums.ShiftStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "shifts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guard_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_shifts_guard"))
    private Guard guard;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_shifts_gate"))
    private Gate gate;

    @Column(name = "start_time", nullable = false)
    private OffsetDateTime startTime;

    /**
     * Null until shift is ended (status → COMPLETED or ABORTED).
     */
    @Column(name = "end_time")
    private OffsetDateTime endTime;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "shift_status")
    @Builder.Default
    private ShiftStatus status = ShiftStatus.ONGOING;
}
