package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.Notification;
import com.pict.gatesecurity.entity.enums.NotificationEventType;
import com.pict.gatesecurity.entity.enums.NotificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long>,
        JpaSpecificationExecutor<Notification> {

    Page<Notification> findByStatus(NotificationStatus status, Pageable pageable);

    Optional<Notification> findByIdAndUserId(Long id, Long userId);

    Page<Notification> findByUserId(Long userId, Pageable pageable);

    Page<Notification> findByEventType(NotificationEventType eventType, Pageable pageable);

    Page<Notification> findByRecipientContainingIgnoreCase(String recipient, Pageable pageable);

    Page<Notification> findByCreatedAtBetween(OffsetDateTime start, OffsetDateTime end, Pageable pageable);

    Page<Notification> findByStatusAndRetryCountLessThan(NotificationStatus status, int maxRetries, Pageable pageable);

    long countByStatusAndCreatedAtAfter(NotificationStatus status, OffsetDateTime after);
}
