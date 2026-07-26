package com.pict.gatesecurity.entity;

import com.pict.gatesecurity.entity.enums.VehicleCategory;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "vehicles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "registration_number", nullable = false, unique = true, length = 20)
    private String registrationNumber;

    @Column(name = "vehicle_type", length = 50)
    private String vehicleType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "vehicle_category")
    private VehicleCategory category;

    @Column(name = "owner_name", length = 150)
    private String ownerName;

    @Column(name = "owner_contact", length = 15)
    private String ownerContact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_user_id",
            foreignKey = @ForeignKey(name = "fk_vehicles_owner_user"))
    private User ownerUser;

    @Column(length = 50)
    private String color;

    @Column(name = "is_blacklisted", nullable = false)
    @Builder.Default
    private Boolean isBlacklisted = false;

    @Column(name = "blacklist_reason", columnDefinition = "TEXT")
    private String blacklistReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false,
            foreignKey = @ForeignKey(name = "fk_vehicles_created_by"))
    private User createdBy;
}
