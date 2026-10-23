package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.AuthorizedStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuthorizedStudentRepository extends JpaRepository<AuthorizedStudent, Long> {

    Optional<AuthorizedStudent> findFirstByStudentIdIgnoreCase(String studentId);

    Optional<AuthorizedStudent> findFirstByPrnIgnoreCase(String prn);

    Optional<AuthorizedStudent> findFirstByRollNumberIgnoreCase(String rollNumber);

    boolean existsByStudentIdIgnoreCase(String studentId);

    @Query("SELECT s FROM AuthorizedStudent s WHERE " +
           "LOWER(s.studentId) = LOWER(:lookup) OR " +
           "LOWER(s.prn) = LOWER(:lookup) OR " +
           "LOWER(s.rollNumber) = LOWER(:lookup)")
    Optional<AuthorizedStudent> findAuthorizedByIdentifier(@Param("lookup") String lookup);
}
