package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.Visitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
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

    long countByTimeInBetweenAndGateId(OffsetDateTime start, OffsetDateTime end, Long gateId);

    long countByTimeOutBetween(OffsetDateTime start, OffsetDateTime end);

    long countByTimeOutBetweenAndGateId(OffsetDateTime start, OffsetDateTime end, Long gateId);

    long countByTimeInBetweenAndHostDepartment(OffsetDateTime start, OffsetDateTime end, String department);

    long countByIsBlacklistedMatchTrueAndTimeInBetween(OffsetDateTime start, OffsetDateTime end);

    @Query("SELECT FUNCTION('DATE', v.timeIn) as d, COUNT(v) FROM Visitor v WHERE v.timeIn BETWEEN :start AND :end GROUP BY d ORDER BY d")
    List<Object[]> countByDateRange(@Param("start") OffsetDateTime start, @Param("end") OffsetDateTime end);

    @Query("SELECT HOUR(v.timeIn) as h, COUNT(v) FROM Visitor v WHERE v.timeIn BETWEEN :start AND :end GROUP BY HOUR(v.timeIn) ORDER BY HOUR(v.timeIn)")
    List<Object[]> countCheckInsByHour(@Param("start") OffsetDateTime start, @Param("end") OffsetDateTime end);

    @Query("SELECT HOUR(v.timeOut) as h, COUNT(v) FROM Visitor v WHERE v.timeOut BETWEEN :start AND :end AND v.timeOut IS NOT NULL GROUP BY HOUR(v.timeOut) ORDER BY HOUR(v.timeOut)")
    List<Object[]> countCheckOutsByHour(@Param("start") OffsetDateTime start, @Param("end") OffsetDateTime end);

    long countByGateIdAndTimeInBetween(Long gateId, OffsetDateTime start, OffsetDateTime end);

    long countByGateIdAndTimeOutIsNull(Long gateId);
}
