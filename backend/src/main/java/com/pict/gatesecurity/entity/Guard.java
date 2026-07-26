package com.pict.gatesecurity.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "guards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Guard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_guards_user"))
    private User user;

    @Column(name = "employee_code", nullable = false, unique = true, length = 30)
    private String employeeCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_gate_id",
            foreignKey = @ForeignKey(name = "fk_guards_gate"))
    private Gate assignedGate;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
