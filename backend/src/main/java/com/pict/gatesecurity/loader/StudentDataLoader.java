package com.pict.gatesecurity.loader;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pict.gatesecurity.entity.AuthorizedStudent;
import com.pict.gatesecurity.repository.AuthorizedStudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

@Component
@Order(13)
@RequiredArgsConstructor
@Slf4j
public class StudentDataLoader implements CommandLineRunner {

    private final AuthorizedStudentRepository authorizedStudentRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void run(String... args) {
        try {
            InputStream is = getClass().getClassLoader().getResourceAsStream("data/authorized_students.json");
            if (is == null) {
                log.info("StudentDataLoader: data/authorized_students.json not found on classpath.");
                return;
            }

            List<Map<String, String>> records = objectMapper.readValue(is, new TypeReference<>() {});
            int addedCount = 0;
            int existingCount = 0;

            for (Map<String, String> r : records) {
                String studentId = r.get("studentId");
                if (studentId == null || studentId.isBlank()) continue;
                String cleanStudentId = studentId.trim().toUpperCase();

                if (!authorizedStudentRepository.existsByStudentIdIgnoreCase(cleanStudentId)) {
                    AuthorizedStudent as = AuthorizedStudent.builder()
                            .studentId(cleanStudentId)
                            .enrollmentNo(r.getOrDefault("enrollmentNo", cleanStudentId).trim().toUpperCase())
                            .prn(r.getOrDefault("prn", cleanStudentId).trim().toUpperCase())
                            .rollNumber(r.getOrDefault("rollNumber", "").trim())
                            .fullName(r.getOrDefault("fullName", "").trim())
                            .gender(r.getOrDefault("gender", "").trim())
                            .department(r.getOrDefault("department", "E&TC").trim())
                            .academicYear(r.getOrDefault("academicYear", "TE").trim())
                            .className(r.getOrDefault("className", "").trim())
                            .division(r.getOrDefault("division", "").trim())
                            .mobile(r.getOrDefault("mobile", "").trim())
                            .email(r.getOrDefault("email", cleanStudentId.toLowerCase() + "@pict.edu").trim())
                            .build();
                    authorizedStudentRepository.save(as);
                    addedCount++;
                } else {
                    existingCount++;
                }
            }

            log.info("StudentDataLoader finished: {} authorized student records newly seeded, {} already existed.",
                    addedCount, existingCount);
        } catch (Exception e) {
            log.error("Failed to load authorized student data: {}", e.getMessage(), e);
        }
    }
}
