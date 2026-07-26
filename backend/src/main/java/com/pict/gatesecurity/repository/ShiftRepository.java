package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.Shift;
import com.pict.gatesecurity.entity.enums.ShiftStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, Long> {

    /**
     * Find an active (ONGOING) shift for a guard.
     * Used to enforce the rule: a guard cannot start a new shift while one is ONGOING.
     */
    Optional<Shift> findByGuardIdAndStatus(Long guardId, ShiftStatus status);

    long countByStatus(ShiftStatus status);
}
