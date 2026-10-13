package com.pict.gatesecurity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "student_face_templates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentFaceTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_profile_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_sft_student_profile"))
    private StudentProfile studentProfile;

    @Column(name = "face_id", nullable = false, unique = true, length = 64)
    private String faceId;

    @Column(name = "model_name", nullable = false, length = 50)
    @Builder.Default
    private String modelName = "SFace";

    @Column(name = "model_version", nullable = false, length = 30)
    @Builder.Default
    private String modelVersion = "2021dec";

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrolled_by_user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_sft_enrolled_by"))
    private User enrolledBy;

    @Column(name = "consent_recorded", nullable = false)
    @Builder.Default
    private Boolean consentRecorded = true;

    @Column(name = "consent_timestamp", nullable = false)
    private OffsetDateTime consentTimestamp;

    @Column(name = "quality_score")
    private Double qualityScore;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
