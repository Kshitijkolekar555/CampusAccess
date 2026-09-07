package com.pict.gatesecurity.entity;

import com.pict.gatesecurity.entity.enums.FacultyAvailabilityStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "faculty_availability", uniqueConstraints = {
        @UniqueConstraint(name = "uk_faculty_availability_date", columnNames = {"faculty_id", "availability_date"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacultyAvailability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_faculty_avail_user"))
    private User faculty;

    @Column(name = "availability_date", nullable = false)
    private LocalDate availabilityDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FacultyAvailabilityStatus status;

    @Column(columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;
}
