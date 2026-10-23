package com.pict.gatesecurity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "authorized_students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthorizedStudent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false, unique = true, length = 30)
    private String studentId;

    @Column(name = "enrollment_no", length = 30)
    private String enrollmentNo;

    @Column(name = "prn", length = 30)
    private String prn;

    @Column(name = "roll_number", length = 30)
    private String rollNumber;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(length = 20)
    private String gender;

    @Column(length = 100)
    private String department;

    @Column(name = "academic_year", length = 20)
    private String academicYear;

    @Column(name = "class_name", length = 50)
    private String className;

    @Column(length = 20)
    private String division;

    @Column(length = 100)
    private String email;

    @Column(length = 30)
    private String mobile;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
