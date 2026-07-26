package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.HostelOutpass;
import com.pict.gatesecurity.entity.enums.OutpassStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface HostelOutpassRepository extends JpaRepository<HostelOutpass, Long>, JpaSpecificationExecutor<HostelOutpass> {

    List<HostelOutpass> findByStudentPrnAndStatusIn(String studentPrn, List<OutpassStatus> statuses);

    @Query("SELECT ho FROM HostelOutpass ho WHERE ho.status = 'APPROVED' AND ho.expectedReturnTime < :now")
    List<HostelOutpass> findOverdueApprovedOutpasses(@Param("now") OffsetDateTime now);

    @Query("SELECT ho FROM HostelOutpass ho WHERE ho.status = 'EXITED' AND ho.expectedReturnTime < :now")
    List<HostelOutpass> findOverdueExitedOutpasses(@Param("now") OffsetDateTime now);
}
