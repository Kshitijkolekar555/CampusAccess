package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.StudentFaceTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentFaceTemplateRepository extends JpaRepository<StudentFaceTemplate, Long> {

    Optional<StudentFaceTemplate> findByFaceId(String faceId);

    List<StudentFaceTemplate> findByStudentProfileIdAndStatus(Long studentProfileId, String status);

    Optional<StudentFaceTemplate> findFirstByStudentProfileIdAndStatusOrderByCreatedAtDesc(Long studentProfileId, String status);
}
