package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long>, JpaSpecificationExecutor<StudentProfile> {

    Optional<StudentProfile> findByPrn(String prn);

    Optional<StudentProfile> findByUserId(Long userId);

    boolean existsByPrn(String prn);
}
