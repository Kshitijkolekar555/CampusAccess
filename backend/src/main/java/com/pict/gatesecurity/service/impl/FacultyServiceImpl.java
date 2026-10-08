package com.pict.gatesecurity.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pict.gatesecurity.dto.faculty.FacultyResponse;
import com.pict.gatesecurity.entity.Faculty;
import com.pict.gatesecurity.entity.enums.HostDepartment;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.repository.FacultyRepository;
import com.pict.gatesecurity.service.FacultyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FacultyServiceImpl implements FacultyService {

    private final FacultyRepository facultyRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public List<FacultyResponse> getAllFaculties(HostDepartment department) {
        List<Faculty> list;
        if (department != null) {
            list = facultyRepository.findByDepartmentAndActiveTrueOrderByNameAsc(department);
        } else {
            list = facultyRepository.findByActiveTrueOrderByNameAsc();
        }
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FacultyResponse> searchFaculties(String query, HostDepartment department, Pageable pageable) {
        String cleanQuery = (query != null && !query.trim().isEmpty()) ? query.trim() : null;
        return facultyRepository.searchFaculties(cleanQuery, department, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public FacultyResponse getFacultyById(Long id) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + id));
        return mapToResponse(faculty);
    }

    @Override
    @Transactional
    public void seedFacultiesFromJson() {
        if (facultyRepository.count() > 0) {
            log.info("Faculties already seeded (count={}). Skipping seeding.", facultyRepository.count());
            return;
        }

        try {
            ClassPathResource resource = new ClassPathResource("faculties.json");
            if (!resource.exists()) {
                log.warn("faculties.json not found in resources; skipping seeding.");
                return;
            }

            try (InputStream is = resource.getInputStream()) {
                List<Map<String, String>> records = objectMapper.readValue(is, new TypeReference<>() {});
                log.info("Read {} faculty records from faculties.json to seed...", records.size());

                for (Map<String, String> rec : records) {
                    String deptStr = rec.get("department");
                    String name = rec.get("name");
                    String email = rec.get("email");
                    String phone = rec.get("phone");

                    HostDepartment dept;
                    try {
                        dept = HostDepartment.valueOf(deptStr.toUpperCase());
                    } catch (Exception e) {
                        dept = HostDepartment.ADMIN;
                    }

                    String designation = "Faculty";
                    if (name.toLowerCase().contains("hod") || (email != null && email.toLowerCase().contains("hod"))) {
                        designation = "Head of Department (HOD)";
                    } else if (name.startsWith("Dr.") || name.startsWith("Dr .") || name.startsWith("Prof.")) {
                        designation = "Professor / Assistant Professor";
                    } else if (name.startsWith("Asst. Prof.")) {
                        designation = "Assistant Professor";
                    }

                    Faculty faculty = Faculty.builder()
                            .name(name)
                            .department(dept)
                            .email(email)
                            .phone(phone)
                            .designation(designation)
                            .cabinLocation(dept.name() + " Department Building")
                            .active(true)
                            .build();

                    facultyRepository.save(faculty);
                }
                log.info("Successfully seeded {} faculty records into database.", records.size());
            }
        } catch (Exception e) {
            log.error("Failed to seed faculties from faculties.json: {}", e.getMessage(), e);
        }
    }

    private FacultyResponse mapToResponse(Faculty f) {
        return FacultyResponse.builder()
                .id(f.getId())
                .name(f.getName())
                .department(f.getDepartment())
                .email(f.getEmail())
                .phone(f.getPhone())
                .designation(f.getDesignation())
                .cabinLocation(f.getCabinLocation())
                .active(f.getActive())
                .createdAt(f.getCreatedAt())
                .build();
    }
}
