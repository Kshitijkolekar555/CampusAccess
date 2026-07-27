package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.Guard;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GuardRepository extends JpaRepository<Guard, Long>, JpaSpecificationExecutor<Guard> {

    Optional<Guard> findByUserId(Long userId);

    boolean existsByEmployeeCode(String employeeCode);

    Page<Guard> findByActiveTrue(Pageable pageable);

    long countByActiveTrue();
}
