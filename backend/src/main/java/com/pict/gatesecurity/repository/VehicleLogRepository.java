package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.VehicleLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VehicleLogRepository extends JpaRepository<VehicleLog, Long>, JpaSpecificationExecutor<VehicleLog> {

    @Query("SELECT vl FROM VehicleLog vl WHERE vl.vehicle.id = :vehicleId AND vl.exitTime IS NULL ORDER BY vl.entryTime DESC")
    Optional<VehicleLog> findActiveEntryByVehicleId(@Param("vehicleId") Long vehicleId);
}
