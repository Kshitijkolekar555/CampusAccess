package com.pict.gatesecurity.entity.enums;

public enum UserRole {
    ADMIN,
    SECURITY_OFFICER,
    SECURITY_GUARD,
    HOSTEL_WARDEN,
    CANTEEN_MANAGER,
    VISITOR,

    @Deprecated(since = "Phase 2", forRemoval = true)
    GUARD,
    @Deprecated(since = "Phase 2", forRemoval = true)
    CANTEEN_STAFF
}
