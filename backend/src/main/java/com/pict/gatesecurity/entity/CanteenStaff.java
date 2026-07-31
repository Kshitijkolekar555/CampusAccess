package com.pict.gatesecurity.entity;

import com.pict.gatesecurity.entity.enums.CanteenStaffRole;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "canteen_staff")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CanteenStaff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_canteen_staff_user"))
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CanteenStaffRole role = CanteenStaffRole.OTHER;

    @Column(name = "assigned_outlet", length = 100)
    private String assignedOutlet;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
