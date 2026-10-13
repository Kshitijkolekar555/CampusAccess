package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.StudentGatePass;
import com.pict.gatesecurity.entity.enums.PassStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface StudentGatePassRepository extends JpaRepository<StudentGatePass, Long>, JpaSpecificationExecutor<StudentGatePass> {

    List<StudentGatePass> findByStudentPrnAndStatus(String studentPrn, PassStatus status);

    java.util.Optional<StudentGatePass> findFirstByStudentPrnOrderByIdDesc(String studentPrn);

    @Query("SELECT sgp FROM StudentGatePass sgp WHERE sgp.status = 'APPROVED' AND sgp.expectedReturnTime < :now")
    List<StudentGatePass> findOverdueApprovedPasses(@Param("now") OffsetDateTime now);

    long countByCreatedAtBetween(OffsetDateTime start, OffsetDateTime end);

    long countByStatusAndCreatedAtBetween(PassStatus status, OffsetDateTime start, OffsetDateTime end);

    long countByStudentDepartmentAndCreatedAtBetween(String department, OffsetDateTime start, OffsetDateTime end);

    long countByStatus(PassStatus status);

    long countByGateIdAndCreatedAtBetween(Long gateId, OffsetDateTime start, OffsetDateTime end);

    long countByGateIdAndStatusAndCreatedAtBetween(Long gateId, PassStatus status, OffsetDateTime start, OffsetDateTime end);
}
