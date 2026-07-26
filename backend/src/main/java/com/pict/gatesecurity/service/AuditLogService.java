package com.pict.gatesecurity.service;

import com.pict.gatesecurity.entity.User;

import java.util.Map;

public interface AuditLogService {
    void logAction(User user, String action, String entityType, Long entityId, Map<String, Object> oldValue, Map<String, Object> newValue);
}
