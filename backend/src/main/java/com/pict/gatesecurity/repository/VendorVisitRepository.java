package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.VendorVisit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;

@Repository
public interface VendorVisitRepository extends JpaRepository<VendorVisit, Long>, JpaSpecificationExecutor<VendorVisit> {

    @Query("SELECT vv FROM VendorVisit vv WHERE vv.vendor.id = :vendorId AND vv.exitTime IS NULL")
    Optional<VendorVisit> findActiveVisitByVendorId(@Param("vendorId") Long vendorId);

    long countByEntryTimeBetween(OffsetDateTime start, OffsetDateTime end);

    long countByEntryTimeBetweenAndGateId(OffsetDateTime start, OffsetDateTime end, Long gateId);

    long countByExitTimeIsNull();

    long countByGateIdAndExitTimeIsNull(Long gateId);

    long countByVendorIdAndEntryTimeBetween(Long vendorId, OffsetDateTime start, OffsetDateTime end);
}
