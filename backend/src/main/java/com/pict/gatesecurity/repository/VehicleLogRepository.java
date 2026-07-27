package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.VehicleLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;

@Repository
public interface VehicleLogRepository extends JpaRepository<VehicleLog, Long>, JpaSpecificationExecutor<VehicleLog> {

    @Query("SELECT vl FROM VehicleLog vl WHERE vl.vehicle.id = :vehicleId AND vl.exitTime IS NULL ORDER BY vl.entryTime DESC")
    Optional<VehicleLog> findActiveEntryByVehicleId(@Param("vehicleId") Long vehicleId);

    long countByEntryTimeBetween(OffsetDateTime start, OffsetDateTime end);

    long countByEntryTimeBetweenAndGateId(OffsetDateTime start, OffsetDateTime end, Long gateId);

    long countByExitTimeBetween(OffsetDateTime start, OffsetDateTime end);

    long countByExitTimeBetweenAndGateId(OffsetDateTime start, OffsetDateTime end, Long gateId);

    long countByExitTimeIsNull();

    long countByGateIdAndExitTimeIsNull(Long gateId);

    @Query("SELECT vl.vehicle.category, COUNT(vl) FROM VehicleLog vl WHERE vl.entryTime BETWEEN :start AND :end GROUP BY vl.vehicle.category")
    Object[] countByVehicleCategoryBetween(@Param("start") OffsetDateTime start, @Param("end") OffsetDateTime end);
}
