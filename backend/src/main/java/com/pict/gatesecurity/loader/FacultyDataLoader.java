package com.pict.gatesecurity.loader;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pict.gatesecurity.entity.AuthorizedFaculty;
import com.pict.gatesecurity.repository.AuthorizedFacultyRepository;
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
@Order(12)
@RequiredArgsConstructor
@Slf4j
public class FacultyDataLoader implements CommandLineRunner {

    private final AuthorizedFacultyRepository authorizedFacultyRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void run(String... args) {
        try {
            InputStream is = getClass().getClassLoader().getResourceAsStream("data/authorized_faculty.json");
            if (is == null) {
                log.info("FacultyDataLoader: data/authorized_faculty.json not found on classpath.");
                return;
            }

            List<Map<String, String>> records = objectMapper.readValue(is, new TypeReference<>() {});
            int addedCount = 0;
            int existingCount = 0;

            for (Map<String, String> r : records) {
                String empNo = r.get("empNo");
                if (empNo == null || empNo.isBlank()) continue;
                String cleanEmpNo = empNo.trim();

                if (!authorizedFacultyRepository.existsByEmpNo(cleanEmpNo)) {
                    AuthorizedFaculty af = AuthorizedFaculty.builder()
                            .empNo(cleanEmpNo)
                            .fullName(r.getOrDefault("fullName", "").trim())
                            .staffType(r.getOrDefault("staffType", "Teaching").trim())
                            .department(r.getOrDefault("department", "General").trim())
                            .email(cleanEmpNo.toLowerCase() + "@pict.edu")
                            .build();
                    authorizedFacultyRepository.save(af);
                    addedCount++;
                } else {
                    existingCount++;
                }
            }

            log.info("FacultyDataLoader finished: {} authorized faculty records newly seeded, {} already existed.",
                    addedCount, existingCount);
        } catch (Exception e) {
            log.error("Failed to load authorized faculty data: {}", e.getMessage(), e);
        }
    }
}
