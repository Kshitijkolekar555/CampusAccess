package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.FacultyOutpass;
import com.pict.gatesecurity.entity.enums.FacultyOutpassStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FacultyOutpassRepository extends JpaRepository<FacultyOutpass, Long> {

    Optional<FacultyOutpass> findByPassNumber(String passNumber);

    long countByCreatedAtBetween(OffsetDateTime start, OffsetDateTime end);

    Optional<FacultyOutpass> findFirstByFacultyIdAndStatusOrderByIdDesc(Long facultyUserId, FacultyOutpassStatus status);

    boolean existsByFacultyIdAndStatus(Long facultyUserId, FacultyOutpassStatus status);

    List<FacultyOutpass> findByFacultyIdOrderByGeneratedAtDesc(Long facultyUserId);

    List<FacultyOutpass> findByStatusOrderByGeneratedAtDesc(FacultyOutpassStatus status);

    List<FacultyOutpass> findAllByOrderByGeneratedAtDesc();

    @Query("SELECT f FROM FacultyOutpass f WHERE " +
           "(:status IS NULL OR f.status = :status) AND (" +
           "(:search IS NULL OR :search = '') OR " +
           "LOWER(f.facultyName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(f.facultyEmpNo) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(f.passNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(f.department) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY f.generatedAt DESC")
    List<FacultyOutpass> searchPasses(@Param("status") FacultyOutpassStatus status, @Param("search") String search);
}
