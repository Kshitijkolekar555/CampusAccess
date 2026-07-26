package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.Visitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VisitorRepository extends JpaRepository<Visitor, Long>, JpaSpecificationExecutor<Visitor> {

    @Query("SELECT v FROM Visitor v WHERE v.timeOut IS NULL AND v.timeIn < :cutoff")
    List<Visitor> findOverstaying(@Param("cutoff") OffsetDateTime cutoff);

    long countByTimeOutIsNull();

    long countByTimeInBetween(OffsetDateTime start, OffsetDateTime end);

    List<Visitor> findByTimeOutIsNull();

    Optional<Visitor> findFirstByMobileAndTimeOutIsNullOrderByTimeInDesc(String mobile);
}
