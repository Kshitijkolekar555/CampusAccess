package com.pict.gatesecurity.config;

import com.pict.gatesecurity.entity.Gate;
import com.pict.gatesecurity.entity.StudentProfile;
import com.pict.gatesecurity.entity.User;
import com.pict.gatesecurity.entity.enums.UserRole;
import com.pict.gatesecurity.repository.GateRepository;
import com.pict.gatesecurity.repository.StudentProfileRepository;
import com.pict.gatesecurity.repository.UserRepository;
import com.pict.gatesecurity.entity.Visitor;
import com.pict.gatesecurity.repository.VisitorRepository;
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
    private final StudentProfileRepository studentProfileRepository;
    private final VisitorRepository visitorRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
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

        if (userRepository.findFirstByUsernameIgnoreCase("student1").isEmpty()) {
            log.info("Seeding default student user...");
            User s1 = userRepository.save(User.builder()
                    .username("student1")
                    .passwordHash(passwordEncoder.encode("Student123!"))
                    .role(UserRole.STUDENT)
                    .fullName("Rohan Patil")
                    .email("rohan.patil@pict.edu")
                    .phone("9876543210")
                    .active(true)
                    .build());
            studentProfileRepository.save(StudentProfile.builder()
                    .user(s1)
                    .prn("student1")
                    .rollNumber("32101")
                    .department("Computer Engineering")
                    .academicYear("TE")
                    .division("1")
                    .active(true)
                    .build());
        }

        // Seed F24ET034 with default password = enrollment number
        if (userRepository.findFirstByUsernameIgnoreCase("F24ET034").isEmpty()) {
            log.info("Seeding student F24ET034...");
            User f24 = userRepository.save(User.builder()
                    .username("F24ET034")
                    .passwordHash(passwordEncoder.encode("F24ET034"))
                    .role(UserRole.STUDENT)
                    .fullName("Student F24ET034")
                    .email("f24et034@pict.edu")
                    .phone("9876543234")
                    .active(true)
                    .isLateComerPermitted(true)
                    .build());
            studentProfileRepository.save(StudentProfile.builder()
                    .user(f24)
                    .prn("F24ET034")
                    .rollNumber("32134")
                    .department("E&TC")
                    .academicYear("TE")
                    .division("1")
                    .active(true)
                    .build());
        }

        // Seed S25ET034 with default password = enrollment number
        if (userRepository.findFirstByUsernameIgnoreCase("S25ET034").isEmpty()) {
            log.info("Seeding student S25ET034...");
            User s25 = userRepository.save(User.builder()
                    .username("S25ET034")
                    .passwordHash(passwordEncoder.encode("S25ET034"))
                    .role(UserRole.STUDENT)
                    .fullName("Student S25ET034")
                    .email("s25et034@pict.edu")
                    .phone("9876543235")
                    .active(true)
                    .isLateComerPermitted(true)
                    .build());
            studentProfileRepository.save(StudentProfile.builder()
                    .user(s25)
                    .prn("S25ET034")
                    .rollNumber("32135")
                    .department("E&TC")
                    .academicYear("SE")
                    .division("2")
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

        // Ensure visitor records for enrolled face IDs exist and are properly mapped
        String truptiFaceId = "0656d574-aaf1-4908-9226-a2827b50913f";
        Gate defaultGate = gateRepository.findAll().stream().findFirst().orElse(null);
        User defaultUser = userRepository.findFirstByOrderByIdAsc().orElse(null);

        var existingTrupti = visitorRepository.findFirstByMobileOrderByTimeInDesc("8767359653");
        if (existingTrupti.isPresent()) {
            Visitor v = existingTrupti.get();
            if (v.getFaceId() == null || !v.getFaceId().equals(truptiFaceId)) {
                v.setFaceId(truptiFaceId);
                if (v.getPhotoPath() == null && v.getPhotoUrl() == null) {
                    v.setPhotoUrl("/uploads/visitor-photos/visitor_1792387071192_aef83a0f.jpg");
                    v.setPhotoPath("/uploads/visitor-photos/visitor_1792387071192_aef83a0f.jpg");
                }
                visitorRepository.save(v);
                log.info("Linked existing visitor {} to enrolled faceId {}", v.getName(), truptiFaceId);
            }
        } else if (visitorRepository.findFirstByFaceIdOrderByTimeInDesc(truptiFaceId).isEmpty() && defaultGate != null) {
            log.info("Seeding default visitor record for enrolled faceId {}...", truptiFaceId);
            visitorRepository.save(Visitor.builder()
                    .name("Trupti")
                    .mobile("8767359653")
                    .purpose("Campus Visit")
                    .hostName("General Inquiry")
                    .hostType(com.pict.gatesecurity.entity.enums.HostType.OTHER)
                    .hostDepartment(com.pict.gatesecurity.entity.enums.HostDepartment.ADMIN)
                    .gate(defaultGate)
                    .timeIn(java.time.OffsetDateTime.now().minusHours(2))
                    .timeOut(java.time.OffsetDateTime.now().minusHours(1))
                    .idProofType("Digital Pass")
                    .idProofNumber("VT-77278")
                    .photoUrl("/uploads/visitor-photos/visitor_1792387071192_aef83a0f.jpg")
                    .photoPath("/uploads/visitor-photos/visitor_1792387071192_aef83a0f.jpg")
                    .faceId(truptiFaceId)
                    .status(com.pict.gatesecurity.entity.enums.PassStatus.COMPLETED)
                    .createdBy(defaultUser)
                    .build());
        }
    }
}
