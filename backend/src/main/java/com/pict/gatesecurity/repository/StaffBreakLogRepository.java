package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.StaffBreakLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StaffBreakLogRepository extends JpaRepository<StaffBreakLog, Long> {
    Optional<StaffBreakLog> findByUserIdAndStatus(Long userId, String status);
    Page<StaffBreakLog> findByUserIdOrderByStartTimeDesc(Long userId, Pageable pageable);
}
