package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.FacultyAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FacultyAvailabilityRepository extends JpaRepository<FacultyAvailability, Long>, JpaSpecificationExecutor<FacultyAvailability> {

    Optional<FacultyAvailability> findByFacultyIdAndAvailabilityDateAndDeletedAtIsNull(Long facultyId, LocalDate availabilityDate);

    List<FacultyAvailability> findByFacultyIdAndAvailabilityDateBetweenAndDeletedAtIsNullOrderByAvailabilityDateDesc(
            Long facultyId, LocalDate startDate, LocalDate endDate);

    List<FacultyAvailability> findByFacultyIdAndDeletedAtIsNullOrderByAvailabilityDateDesc(Long facultyId);

    @Query("SELECT fa FROM FacultyAvailability fa WHERE fa.availabilityDate = :date AND fa.deletedAt IS NULL")
    List<FacultyAvailability> findAllByAvailabilityDate(@Param("date") LocalDate date);
}
