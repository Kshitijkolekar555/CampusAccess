package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.CanteenEntry;
import com.pict.gatesecurity.entity.enums.EntryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface CanteenEntryRepository extends JpaRepository<CanteenEntry, Long> {

    Optional<CanteenEntry> findByStaffIdAndDate(Long staffId, LocalDate date);

    long countByDateAndStatus(LocalDate date, EntryStatus status);
}
