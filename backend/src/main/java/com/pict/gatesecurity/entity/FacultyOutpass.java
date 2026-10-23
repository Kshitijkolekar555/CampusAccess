package com.pict.gatesecurity.entity;

import com.pict.gatesecurity.entity.enums.FacultyOutpassStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "faculty_outpasses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacultyOutpass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pass_number", nullable = false, unique = true, length = 50)
    private String passNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_faculty_outpasses_user"))
    private User faculty;

    @Column(name = "faculty_emp_no", nullable = false, length = 30)
    private String facultyEmpNo;

    @Column(name = "faculty_name", nullable = false, length = 150)
    private String facultyName;

    @Column(length = 100)
    private String department;

    @Column(nullable = false, length = 100)
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FacultyOutpassStatus status;

    @Column(name = "generated_at", nullable = false)
    private OffsetDateTime generatedAt;

    @Column(name = "departure_time")
    private OffsetDateTime departureTime;

    @Column(name = "actual_return_time")
    private OffsetDateTime actualReturnTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_by_guard_id",
            foreignKey = @ForeignKey(name = "fk_faculty_outpasses_guard"))
    private User confirmedByGuard;

    @Column(name = "guard_notes", columnDefinition = "TEXT")
    private String guardNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gate_id",
            foreignKey = @ForeignKey(name = "fk_faculty_outpasses_gate"))
    private Gate gate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
