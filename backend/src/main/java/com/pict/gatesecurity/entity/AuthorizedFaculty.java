package com.pict.gatesecurity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "authorized_faculty")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthorizedFaculty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "emp_no", nullable = false, unique = true, length = 30)
    private String empNo;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "staff_type", length = 50)
    private String staffType;

    @Column(length = 100)
    private String department;

    @Column(length = 100)
    private String email;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
