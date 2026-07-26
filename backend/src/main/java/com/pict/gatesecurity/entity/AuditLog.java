package com.pict.gatesecurity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_audit_logs_user"))
    private User user;

    /**
     * Action performed: CREATE, UPDATE, DELETE
     */
    @Column(nullable = false, length = 50)
    private String action;

    /**
     * The entity class name: Gate, Guard, Visitor, etc.
     */
    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    /**
     * JSON snapshot of the entity state BEFORE the change.
     * Null for CREATE operations.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "old_value", columnDefinition = "jsonb")
    private Map<String, Object> oldValue;

    /**
     * JSON snapshot of the entity state AFTER the change.
     * Null for DELETE operations.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "new_value", columnDefinition = "jsonb")
    private Map<String, Object> newValue;

    @Column(nullable = false)
    private OffsetDateTime timestamp;
}
