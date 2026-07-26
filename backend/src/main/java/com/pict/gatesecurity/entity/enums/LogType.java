package com.pict.gatesecurity.entity.enums;

/**
 * Type of entry in a shift log.
 * Maps to PostgreSQL enum type: log_type
 */
public enum LogType {
    SECURITY_CHECK,
    INCIDENT,
    TASK,
    GENERAL
}
