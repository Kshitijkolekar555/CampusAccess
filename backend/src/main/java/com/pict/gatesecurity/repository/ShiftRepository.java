package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.Shift;
import com.pict.gatesecurity.entity.enums.ShiftStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, Long>, JpaSpecificationExecutor<Shift> {

    Optional<Shift> findByGuardIdAndStatus(Long guardId, ShiftStatus status);

    long countByStatus(ShiftStatus status);

    long countByStatusAndDateBetween(ShiftStatus status, LocalDate start, LocalDate end);

    long countByDateBetween(LocalDate start, LocalDate end);

    long countByGuardIdAndDateBetween(Long guardId, LocalDate start, LocalDate end);

    long countByGateIdAndDateBetween(Long gateId, LocalDate start, LocalDate end);

    long countByGuardId(Long guardId);

    long countByGuardIdAndStatus(Long guardId, ShiftStatus status);

    List<Shift> findByGuardIdAndDateBetween(Long guardId, LocalDate start, LocalDate end);

    @Query("SELECT s.gate.id, s.gate.name, COUNT(s) FROM Shift s WHERE s.date BETWEEN :start AND :end GROUP BY s.gate.id, s.gate.name")
    List<Object[]> countShiftsByGateBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
