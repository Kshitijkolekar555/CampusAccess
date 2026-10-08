package com.pict.gatesecurity.config;

import com.pict.gatesecurity.entity.Gate;
import com.pict.gatesecurity.entity.User;
import com.pict.gatesecurity.entity.enums.UserRole;
import com.pict.gatesecurity.repository.GateRepository;
import com.pict.gatesecurity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final GateRepository gateRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.pict.gatesecurity.service.FacultyService facultyService;

    @Override
    @Transactional
    public void run(String... args) {
        // Seed faculties from faculties.json if empty
        facultyService.seedFacultiesFromJson();
        // Seed default gates if none exist
        if (gateRepository.count() == 0) {
            log.info("Seeding default campus gates...");
            gateRepository.save(Gate.builder()
                    .name("Gate 1 - Main Entrance")
                    .location("PICT Main Entrance — Trimurti Chowk, Dhankawadi")
                    .active(true)
                    .build());

            gateRepository.save(Gate.builder()
                    .name("Gate 2 - Hostel Entrance")
                    .location("PICT Student Hostel Gate")
                    .active(true)
                    .build());

            gateRepository.save(Gate.builder()
                    .name("Gate 3 - Rear Entrance")
                    .location("PICT Back Gate")
                    .active(true)
                    .build());
            log.info("Successfully seeded campus gates.");
        }

        // Seed default admin user if missing
        if (userRepository.findByUsername("admin").isEmpty()) {
            log.info("Seeding default admin user...");
            userRepository.save(User.builder()
                    .username("admin")
                    .passwordHash(passwordEncoder.encode("ChangeMe@123"))
                    .role(UserRole.ADMIN)
                    .fullName("PICT Administrator")
                    .email("admin@pict.edu")
                    .active(true)
                    .build());
        }

        // Seed default guard user if missing
        if (userRepository.findByUsername("guard1").isEmpty()) {
            log.info("Seeding default guard user...");
            userRepository.save(User.builder()
                    .username("guard1")
                    .passwordHash(passwordEncoder.encode("Guard123!"))
                    .role(UserRole.GUARD)
                    .fullName("Security Guard Ramesh")
                    .email("guard1@pict.edu")
                    .active(true)
                    .build());
        }

        if (userRepository.findByUsername("Guard001").isEmpty()) {
            log.info("Seeding Guard001 user...");
            userRepository.save(User.builder()
                    .username("Guard001")
                    .passwordHash(passwordEncoder.encode("Guard123!"))
                    .role(UserRole.GUARD)
                    .fullName("Security Guard 001")
                    .email("guard001@pict.edu")
                    .active(true)
                    .build());
        }

        userRepository.findByUsername("guard1@123").ifPresentOrElse(
            u -> {
                u.setPasswordHash(passwordEncoder.encode("Guard123_"));
                userRepository.save(u);
            },
            () -> {
                userRepository.save(User.builder()
                        .username("guard1@123")
                        .passwordHash(passwordEncoder.encode("Guard123_"))
                        .role(UserRole.SECURITY_GUARD)
                        .fullName("Security Guard 123")
                        .email("guard1123@pict.edu")
                        .active(true)
                        .build());
            }
        );

        if (userRepository.findByUsername("student1").isEmpty()) {
            log.info("Seeding default student user...");
            userRepository.save(User.builder()
                    .username("student1")
                    .passwordHash(passwordEncoder.encode("Student123!"))
                    .role(UserRole.STUDENT)
                    .fullName("Rohan Patil")
                    .email("rohan.patil@pict.edu")
                    .phone("9876543210")
                    .active(true)
                    .build());
        }

        if (userRepository.findByUsername("warden1").isEmpty()) {
            log.info("Seeding default warden user...");
            userRepository.save(User.builder()
                    .username("warden1")
                    .passwordHash(passwordEncoder.encode("Warden123!"))
                    .role(UserRole.HOSTEL_WARDEN)
                    .fullName("Mrs. S. Kulkarni (Warden Block B)")
                    .email("warden.kulkarni@pict.edu")
                    .phone("9812345678")
                    .active(true)
                    .build());
        }
    }
}
