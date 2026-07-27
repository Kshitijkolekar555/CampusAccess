package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.CanteenEntry;
import com.pict.gatesecurity.entity.enums.EntryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;

@Repository
public interface CanteenEntryRepository extends JpaRepository<CanteenEntry, Long> {

    Optional<CanteenEntry> findByStaffIdAndDate(Long staffId, LocalDate date);

    long countByDateAndStatus(LocalDate date, EntryStatus status);

    long countByTimeInBetween(OffsetDateTime start, OffsetDateTime end);

    @Query("SELECT ce.status, COUNT(ce) FROM CanteenEntry ce WHERE ce.date BETWEEN :start AND :end GROUP BY ce.status")
    Object[] countByStatusBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
