package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.ShiftLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShiftLogRepository extends JpaRepository<ShiftLog, Long> {

    Page<ShiftLog> findByShiftId(Long shiftId, Pageable pageable);
}
