package com.pict.gatesecurity.entity;

import com.pict.gatesecurity.entity.enums.EntryStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(
    name = "canteen_entries",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_canteen_entries_staff_date",
        columnNames = {"staff_id", "date"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CanteenEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_canteen_entries_staff"))
    private CanteenStaff staff;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_canteen_entries_gate"))
    private Gate gate;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "time_in", nullable = false)
    private OffsetDateTime timeIn;

    /**
     * Null until staff checks out.
     */
    @Column(name = "time_out")
    private OffsetDateTime timeOut;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "entry_status")
    @Builder.Default
    private EntryStatus status = EntryStatus.PRESENT;
}
