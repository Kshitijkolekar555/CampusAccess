package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.entity.AuditLog;
import com.pict.gatesecurity.entity.User;
import com.pict.gatesecurity.repository.AuditLogRepository;
import com.pict.gatesecurity.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional
    public void logAction(User user, String action, String entityType, Long entityId, Map<String, Object> oldValue, Map<String, Object> newValue) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .user(user)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .oldValue(oldValue)
                    .newValue(newValue)
                    .timestamp(OffsetDateTime.now())
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to save audit log for action: {}, entityType: {}, entityId: {}", action, entityType, entityId, e);
        }
    }
}
