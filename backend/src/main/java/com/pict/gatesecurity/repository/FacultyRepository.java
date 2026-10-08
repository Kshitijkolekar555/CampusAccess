package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.Faculty;
import com.pict.gatesecurity.entity.enums.HostDepartment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FacultyRepository extends JpaRepository<Faculty, Long> {

    List<Faculty> findByActiveTrueOrderByNameAsc();

    List<Faculty> findByDepartmentAndActiveTrueOrderByNameAsc(HostDepartment department);

    Optional<Faculty> findByNameIgnoreCaseAndDepartment(String name, HostDepartment department);

    @Query("SELECT f FROM Faculty f WHERE f.active = true AND " +
           "(:department IS NULL OR f.department = :department) AND " +
           "(:query IS NULL OR LOWER(f.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(f.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "f.phone LIKE CONCAT('%', :query, '%'))")
    Page<Faculty> searchFaculties(
            @Param("query") String query,
            @Param("department") HostDepartment department,
            Pageable pageable);

    @Query("SELECT f FROM Faculty f WHERE f.active = true AND " +
           "(:department IS NULL OR f.department = :department) AND " +
           "(:query IS NULL OR LOWER(f.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(f.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "f.phone LIKE CONCAT('%', :query, '%')) " +
           "ORDER BY f.name ASC")
    List<Faculty> searchFacultiesList(
            @Param("query") String query,
            @Param("department") HostDepartment department);
}
