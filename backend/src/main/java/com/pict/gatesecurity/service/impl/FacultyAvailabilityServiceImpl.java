package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.faculty.FacultyAvailabilityRequest;
import com.pict.gatesecurity.dto.faculty.FacultyAvailabilityResponse;
import com.pict.gatesecurity.dto.faculty.FacultyListResponse;
import com.pict.gatesecurity.entity.FacultyAvailability;
import com.pict.gatesecurity.entity.User;
import com.pict.gatesecurity.entity.enums.FacultyAvailabilityStatus;
import com.pict.gatesecurity.entity.enums.HostDepartment;
import com.pict.gatesecurity.entity.enums.UserRole;
import com.pict.gatesecurity.exception.ForbiddenException;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.repository.FacultyAvailabilityRepository;
import com.pict.gatesecurity.repository.UserRepository;
import com.pict.gatesecurity.service.FacultyAvailabilityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FacultyAvailabilityServiceImpl implements FacultyAvailabilityService {

    private final FacultyAvailabilityRepository availabilityRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public FacultyAvailabilityResponse setAvailability(Long facultyId, FacultyAvailabilityRequest request, String actorUsername) {
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + facultyId));

        User actor = userRepository.findByUsername(actorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Actor not found with username: " + actorUsername));

        if (!actor.getId().equals(facultyId) && actor.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("You are not authorized to update availability for this faculty member");
        }

        LocalDate date = request.getAvailabilityDate();
        Optional<FacultyAvailability> existingOpt = availabilityRepository
                .findByFacultyIdAndAvailabilityDateAndDeletedAtIsNull(facultyId, date);

        FacultyAvailability availability;
        if (existingOpt.isPresent()) {
            availability = existingOpt.get();
            availability.setStatus(request.getStatus());
            availability.setNote(request.getNote());
        } else {
            availability = FacultyAvailability.builder()
                    .faculty(faculty)
                    .availabilityDate(date)
                    .status(request.getStatus())
                    .note(request.getNote())
                    .build();
        }

        FacultyAvailability saved = availabilityRepository.save(availability);
        log.info("Saved availability for faculty {} on {}: {}", faculty.getUsername(), date, saved.getStatus());
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public FacultyAvailabilityResponse getAvailabilityForDate(Long facultyId, LocalDate date) {
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + facultyId));

        return availabilityRepository.findByFacultyIdAndAvailabilityDateAndDeletedAtIsNull(facultyId, date)
                .map(this::toResponse)
                .orElseGet(() -> FacultyAvailabilityResponse.builder()
                        .facultyId(faculty.getId())
                        .facultyName(faculty.getFullName())
                        .facultyUsername(faculty.getUsername())
                        .availabilityDate(date)
                        .status(FacultyAvailabilityStatus.AVAILABLE)
                        .note("Default status")
                        .build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacultyAvailabilityResponse> getAvailabilityHistory(Long facultyId, LocalDate startDate, LocalDate endDate) {
        if (!userRepository.existsById(facultyId)) {
            throw new ResourceNotFoundException("Faculty not found with id: " + facultyId);
        }

        List<FacultyAvailability> list;
        if (startDate != null && endDate != null) {
            list = availabilityRepository.findByFacultyIdAndAvailabilityDateBetweenAndDeletedAtIsNullOrderByAvailabilityDateDesc(
                    facultyId, startDate, endDate);
        } else {
            list = availabilityRepository.findByFacultyIdAndDeletedAtIsNullOrderByAvailabilityDateDesc(facultyId);
        }

        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacultyListResponse> getFacultyList(HostDepartment department, String search) {
        // Query users with role FACULTY (also include STAFF if desired, but primarily FACULTY)
        List<User> facultyUsers = userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getActive()) &&
                        (u.getRole() == UserRole.FACULTY || u.getRole() == UserRole.STAFF))
                .filter(u -> department == null || u.getDepartment() == department)
                .filter(u -> search == null || search.trim().isEmpty() ||
                        u.getFullName().toLowerCase().contains(search.trim().toLowerCase()) ||
                        u.getUsername().toLowerCase().contains(search.trim().toLowerCase()))
                .collect(Collectors.toList());

        LocalDate today = LocalDate.now();
        List<FacultyAvailability> todayAvailabilities = availabilityRepository.findAllByAvailabilityDate(today);
        Map<Long, FacultyAvailability> availMap = todayAvailabilities.stream()
                .collect(Collectors.toMap(a -> a.getFaculty().getId(), a -> a, (a1, a2) -> a1));

        return facultyUsers.stream().map(u -> {
            FacultyAvailability fa = availMap.get(u.getId());
            return FacultyListResponse.builder()
                    .id(u.getId())
                    .username(u.getUsername())
                    .fullName(u.getFullName())
                    .department(u.getDepartment())
                    .email(u.getEmail())
                    .phone(u.getPhone())
                    .todayStatus(fa != null ? fa.getStatus() : FacultyAvailabilityStatus.AVAILABLE)
                    .todayNote(fa != null ? fa.getNote() : null)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public FacultyAvailabilityStatus checkAvailabilityStatus(Long facultyId, LocalDate date) {
        return availabilityRepository.findByFacultyIdAndAvailabilityDateAndDeletedAtIsNull(facultyId, date)
                .map(FacultyAvailability::getStatus)
                .orElse(FacultyAvailabilityStatus.AVAILABLE);
    }

    private FacultyAvailabilityResponse toResponse(FacultyAvailability entity) {
        return FacultyAvailabilityResponse.builder()
                .id(entity.getId())
                .facultyId(entity.getFaculty().getId())
                .facultyName(entity.getFaculty().getFullName())
                .facultyUsername(entity.getFaculty().getUsername())
                .availabilityDate(entity.getAvailabilityDate())
                .status(entity.getStatus())
                .note(entity.getNote())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
