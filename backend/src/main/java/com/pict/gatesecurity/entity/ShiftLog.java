package com.pict.gatesecurity.entity;

import com.pict.gatesecurity.entity.enums.LogType;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "shift_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_shift_logs_shift"))
    private Shift shift;

    @Column(nullable = false)
    private OffsetDateTime timestamp;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "log_type", nullable = false)
    @Builder.Default
    private LogType logType = LogType.GENERAL;
}
