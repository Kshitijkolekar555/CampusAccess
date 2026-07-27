package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    Page<AuditLog> findByEntityTypeAndEntityId(String entityType, Long entityId, Pageable pageable);

    Page<AuditLog> findByUserId(Long userId, Pageable pageable);

    long countByTimestampBetween(OffsetDateTime start, OffsetDateTime end);

    long countByActionAndTimestampBetween(String action, OffsetDateTime start, OffsetDateTime end);

    long countByEntityTypeAndTimestampBetween(String entityType, OffsetDateTime start, OffsetDateTime end);

    List<AuditLog> findTop20ByOrderByTimestampDesc();
}
