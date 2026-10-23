package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.AuthorizedFaculty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuthorizedFacultyRepository extends JpaRepository<AuthorizedFaculty, Long> {

    Optional<AuthorizedFaculty> findByEmpNo(String empNo);

    Optional<AuthorizedFaculty> findFirstByEmpNoIgnoreCase(String empNo);

    Optional<AuthorizedFaculty> findByFullName(String fullName);

    Optional<AuthorizedFaculty> findFirstByFullNameIgnoreCase(String fullName);

    boolean existsByEmpNo(String empNo);

    boolean existsByEmpNoIgnoreCase(String empNo);
}
