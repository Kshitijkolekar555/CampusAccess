package com.pict.gatesecurity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "vendors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vendor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    @Column(name = "contact_person", nullable = false, length = 150)
    private String contactPerson;

    @Column(name = "contact_phone", nullable = false, length = 15)
    private String contactPhone;

    @Column(name = "contact_email", length = 100)
    private String contactEmail;

    @Column(name = "work_description", columnDefinition = "TEXT")
    private String workDescription;

    @Column(name = "assigned_department", length = 50)
    private String assignedDepartment;

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
            foreignKey = @ForeignKey(name = "fk_vendors_created_by"))
    private User createdBy;
}
