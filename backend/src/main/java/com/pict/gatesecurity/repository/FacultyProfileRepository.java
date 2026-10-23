package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.FacultyProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FacultyProfileRepository extends JpaRepository<FacultyProfile, Long> {

    Optional<FacultyProfile> findByUserId(Long userId);

    Optional<FacultyProfile> findByEmpNo(String empNo);

    Optional<FacultyProfile> findFirstByEmpNoIgnoreCase(String empNo);

    boolean existsByEmpNo(String empNo);

    boolean existsByEmpNoIgnoreCase(String empNo);
}
