package com.pict.gatesecurity.entity.enums;

/**
 * Type of the host being visited at PICT.
 * Maps to PostgreSQL enum type: host_type
 */
public enum HostType {
    FACULTY,
    HOD,
    ADMIN_STAFF,
    STUDENT,
    ALUMNI,
    VENDOR,
    OTHER
}
