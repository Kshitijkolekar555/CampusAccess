package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.staff.StaffBreakResponse;
import com.pict.gatesecurity.entity.StaffBreakLog;
import com.pict.gatesecurity.entity.User;
import com.pict.gatesecurity.exception.BadRequestException;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.repository.StaffBreakLogRepository;
import com.pict.gatesecurity.repository.UserRepository;
import com.pict.gatesecurity.service.StaffBreakService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaffBreakServiceImpl implements StaffBreakService {

    private final StaffBreakLogRepository staffBreakLogRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public StaffBreakResponse startBreak(String username, String note) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        staffBreakLogRepository.findByUserIdAndStatus(user.getId(), "ONGOING").ifPresent(b -> {
            throw new BadRequestException("You already have an active break started at " + b.getStartTime());
        });

        StaffBreakLog breakLog = StaffBreakLog.builder()
                .user(user)
                .startTime(OffsetDateTime.now())
                .status("ONGOING")
                .note(note)
                .build();

        StaffBreakLog saved = staffBreakLogRepository.save(breakLog);
        log.info("Staff break started for user: {}", username);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public StaffBreakResponse endBreak(String username, String note) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        StaffBreakLog activeBreak = staffBreakLogRepository.findByUserIdAndStatus(user.getId(), "ONGOING")
                .orElseThrow(() -> new BadRequestException("No active break found to end"));

        OffsetDateTime now = OffsetDateTime.now();
        activeBreak.setEndTime(now);
        activeBreak.setStatus("COMPLETED");

        long minutes = Duration.between(activeBreak.getStartTime(), now).toMinutes();
        activeBreak.setDurationMinutes((int) Math.max(1, minutes));

        if (note != null && !note.isBlank()) {
            activeBreak.setNote(activeBreak.getNote() != null ? activeBreak.getNote() + " | End note: " + note : note);
        }

        StaffBreakLog saved = staffBreakLogRepository.save(activeBreak);
        log.info("Staff break ended for user: {} (duration: {} mins)", username, saved.getDurationMinutes());
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public StaffBreakResponse getActiveBreak(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        return staffBreakLogRepository.findByUserIdAndStatus(user.getId(), "ONGOING")
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StaffBreakResponse> getMyBreakHistory(String username, Pageable pageable) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        return staffBreakLogRepository.findByUserIdOrderByStartTimeDesc(user.getId(), pageable)
                .map(this::mapToResponse);
    }

    private StaffBreakResponse mapToResponse(StaffBreakLog log) {
        return StaffBreakResponse.builder()
                .id(log.getId())
                .userId(log.getUser().getId())
                .username(log.getUser().getUsername())
                .fullName(log.getUser().getFullName())
                .startTime(log.getStartTime())
                .endTime(log.getEndTime())
                .durationMinutes(log.getDurationMinutes())
                .status(log.getStatus())
                .note(log.getNote())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
