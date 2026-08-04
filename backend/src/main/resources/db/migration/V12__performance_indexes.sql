-- ============================================================
-- V12__performance_indexes.sql
-- Additional indexes for search/filter query optimization
-- MySQL 8.0+ compatible (unique idx_perf_ index names)
-- ============================================================

-- Visitors: composite indexes for common filter combinations
CREATE INDEX idx_perf_visitors_time_in_gate        ON visitors (time_in, gate_id);
CREATE INDEX idx_perf_visitors_time_in_dept        ON visitors (time_in, host_department);
CREATE INDEX idx_perf_visitors_time_in_host_type   ON visitors (time_in, host_type);
CREATE INDEX idx_perf_visitors_mobile_time_in      ON visitors (mobile, time_in);
CREATE INDEX idx_perf_visitors_name               ON visitors (name);
CREATE INDEX idx_perf_visitors_host_name          ON visitors (host_name);

-- Vehicle logs: composite indexes for filter combinations
CREATE INDEX idx_perf_vehicle_logs_entry_gate       ON vehicle_logs (entry_time, gate_id);
CREATE INDEX idx_perf_vehicle_logs_exit_time        ON vehicle_logs (exit_time);
CREATE INDEX idx_perf_vehicle_logs_vehicle_entry    ON vehicle_logs (vehicle_id, entry_time);

-- Student gate passes: status + date for filtering
CREATE INDEX idx_perf_sgp_status_created           ON student_gate_passes (status, created_at);
CREATE INDEX idx_perf_sgp_student_prn_status       ON student_gate_passes (student_prn, status);
CREATE INDEX idx_perf_sgp_department_created       ON student_gate_passes (student_department, created_at);
CREATE INDEX idx_perf_sgp_gate_status              ON student_gate_passes (gate_id, status);
CREATE INDEX idx_perf_sgp_expected_return          ON student_gate_passes (expected_return_time);

-- Hostel outpasses: status + date for filtering
CREATE INDEX idx_perf_ho_status_created            ON hostel_outpasses (status, created_at);
CREATE INDEX idx_perf_ho_student_prn_status        ON hostel_outpasses (student_prn, status);
CREATE INDEX idx_perf_ho_hostel_created            ON hostel_outpasses (student_hostel, created_at);
CREATE INDEX idx_perf_ho_gate_status               ON hostel_outpasses (gate_id, status);
CREATE INDEX idx_perf_ho_expected_return           ON hostel_outpasses (expected_return_time);

-- Vendor visits: entry/exit time and gate
CREATE INDEX idx_perf_vv_entry_gate                ON vendor_visits (entry_time, gate_id);
CREATE INDEX idx_perf_vv_exit_null                 ON vendor_visits (exit_time);
CREATE INDEX idx_perf_vv_vendor_entry              ON vendor_visits (vendor_id, entry_time);

-- Shifts: composite for guard + date + status queries
CREATE INDEX idx_perf_shifts_guard_status_date     ON shifts (guard_id, status, date);
CREATE INDEX idx_perf_shifts_status_date           ON shifts (status, date);

-- Notifications: retry and status filtering
CREATE INDEX idx_perf_notif_status_retry           ON notifications (status, retry_count);
CREATE INDEX idx_perf_notif_event_type_created     ON notifications (event_type, created_at);

-- Audit logs: composite for search
CREATE INDEX idx_perf_audit_user_timestamp         ON audit_logs (user_id, timestamp);
CREATE INDEX idx_perf_audit_action_entity          ON audit_logs (action, entity_type);
CREATE INDEX idx_perf_audit_entity_action_time     ON audit_logs (entity_type, action, timestamp);

-- Guard lookup by user
CREATE INDEX idx_perf_guards_active                ON guards (active);

-- Canteen entries: staff + date composite
CREATE INDEX idx_perf_ce_staff_date_status         ON canteen_entries (staff_id, date, status);
