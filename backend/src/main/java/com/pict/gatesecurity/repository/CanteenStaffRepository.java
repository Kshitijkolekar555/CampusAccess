package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.CanteenStaff;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CanteenStaffRepository extends JpaRepository<CanteenStaff, Long> {

    Optional<CanteenStaff> findByUserId(Long userId);

    Page<CanteenStaff> findByActiveTrue(Pageable pageable);
}
