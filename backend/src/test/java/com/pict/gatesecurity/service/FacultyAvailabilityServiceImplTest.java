package com.pict.gatesecurity.service;

import com.pict.gatesecurity.dto.faculty.FacultyAvailabilityRequest;
import com.pict.gatesecurity.dto.faculty.FacultyAvailabilityResponse;
import com.pict.gatesecurity.dto.faculty.FacultyListResponse;
import com.pict.gatesecurity.entity.FacultyAvailability;
import com.pict.gatesecurity.entity.User;
import com.pict.gatesecurity.entity.enums.FacultyAvailabilityStatus;
import com.pict.gatesecurity.entity.enums.HostDepartment;
import com.pict.gatesecurity.entity.enums.UserRole;
import com.pict.gatesecurity.exception.ForbiddenException;
import com.pict.gatesecurity.repository.FacultyAvailabilityRepository;
import com.pict.gatesecurity.repository.UserRepository;
import com.pict.gatesecurity.service.impl.FacultyAvailabilityServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FacultyAvailabilityServiceImplTest {

    @Mock
    private FacultyAvailabilityRepository availabilityRepository;

    @Mock
    private UserRepository userRepository;

    private FacultyAvailabilityServiceImpl availabilityService;

    private User facultyUser;
    private User otherUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        availabilityService = new FacultyAvailabilityServiceImpl(availabilityRepository, userRepository);

        facultyUser = User.builder()
                .id(10L)
                .username("faculty1")
                .fullName("Dr. Sharma")
                .role(UserRole.FACULTY)
                .department(HostDepartment.CE)
                .active(true)
                .build();

        otherUser = User.builder()
                .id(20L)
                .username("guard1")
                .fullName("Ramesh Guard")
                .role(UserRole.GUARD)
                .active(true)
                .build();

        adminUser = User.builder()
                .id(1L)
                .username("admin")
                .fullName("System Admin")
                .role(UserRole.ADMIN)
                .active(true)
                .build();
    }

    @Test
    void testSetAvailability_Success_NewRecord() {
        FacultyAvailabilityRequest request = FacultyAvailabilityRequest.builder()
                .availabilityDate(LocalDate.now())
                .status(FacultyAvailabilityStatus.BUSY)
                .note("In meetings until 3pm")
                .build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(facultyUser));
        when(userRepository.findByUsername("faculty1")).thenReturn(Optional.of(facultyUser));
        when(availabilityRepository.findByFacultyIdAndAvailabilityDateAndDeletedAtIsNull(10L, LocalDate.now()))
                .thenReturn(Optional.empty());

        FacultyAvailability saved = FacultyAvailability.builder()
                .id(100L)
                .faculty(facultyUser)
                .availabilityDate(LocalDate.now())
                .status(FacultyAvailabilityStatus.BUSY)
                .note("In meetings until 3pm")
                .createdAt(OffsetDateTime.now())
                .build();
        when(availabilityRepository.save(any(FacultyAvailability.class))).thenReturn(saved);

        FacultyAvailabilityResponse res = availabilityService.setAvailability(10L, request, "faculty1");

        assertNotNull(res);
        assertEquals(FacultyAvailabilityStatus.BUSY, res.getStatus());
        assertEquals("In meetings until 3pm", res.getNote());
        verify(availabilityRepository, times(1)).save(any(FacultyAvailability.class));
    }

    @Test
    void testSetAvailability_Forbidden_WhenNotSelfOrAdmin() {
        FacultyAvailabilityRequest request = FacultyAvailabilityRequest.builder()
                .availabilityDate(LocalDate.now())
                .status(FacultyAvailabilityStatus.OUT_OF_CAMPUS)
                .build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(facultyUser));
        when(userRepository.findByUsername("guard1")).thenReturn(Optional.of(otherUser));

        assertThrows(ForbiddenException.class, () ->
                availabilityService.setAvailability(10L, request, "guard1"));

        verify(availabilityRepository, never()).save(any());
    }

    @Test
    void testGetAvailabilityForDate_DefaultWhenNotFound() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(facultyUser));
        when(availabilityRepository.findByFacultyIdAndAvailabilityDateAndDeletedAtIsNull(10L, LocalDate.now()))
                .thenReturn(Optional.empty());

        FacultyAvailabilityResponse res = availabilityService.getAvailabilityForDate(10L, LocalDate.now());

        assertNotNull(res);
        assertEquals(FacultyAvailabilityStatus.AVAILABLE, res.getStatus());
        assertEquals("Dr. Sharma", res.getFacultyName());
    }

    @Test
    void testGetFacultyList_WithDepartmentFilter() {
        when(userRepository.findAll()).thenReturn(List.of(facultyUser));
        when(availabilityRepository.findAllByAvailabilityDate(any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        List<FacultyListResponse> list = availabilityService.getFacultyList(HostDepartment.CE, null);

        assertEquals(1, list.size());
        assertEquals("Dr. Sharma", list.get(0).getFullName());
        assertEquals(FacultyAvailabilityStatus.AVAILABLE, list.get(0).getTodayStatus());
    }
}
