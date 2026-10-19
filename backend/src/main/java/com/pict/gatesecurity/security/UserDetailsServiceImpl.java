package com.pict.gatesecurity.security;

import com.pict.gatesecurity.entity.StudentProfile;
import com.pict.gatesecurity.entity.User;
import com.pict.gatesecurity.entity.enums.UserRole;
import com.pict.gatesecurity.repository.StudentProfileRepository;
import com.pict.gatesecurity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Loads user details from the database for Spring Security authentication.
 * Inactive users are treated as disabled — Spring Security will reject them.
 * Supports case-insensitive matching and on-demand provisioning for institutional student enrollment numbers.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final PasswordEncoder fallbackPasswordEncoder = new BCryptPasswordEncoder(12);

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String cleanUsername = username != null ? username.trim() : "";

        User user = userRepository.findFirstByUsernameIgnoreCase(cleanUsername)
                .orElseGet(() -> userRepository.findFirstByEmailIgnoreCase(cleanUsername)
                        .orElseGet(() -> studentProfileRepository.findFirstByPrnIgnoreCase(cleanUsername)
                                .map(StudentProfile::getUser)
                                .orElse(null)));

        if (user == null) {
            // Auto-provision student account for institutional enrollment format (e.g. F24ET034, S25ET034)
            if (cleanUsername.matches("(?i)^[A-Z0-9_-]{4,25}$")) {
                String upper = cleanUsername.toUpperCase();
                log.info("Auto-provisioning institutional student account for enrollment number: {}", upper);
                User newStudent = User.builder()
                        .username(upper)
                        .passwordHash(fallbackPasswordEncoder.encode(upper))
                        .role(UserRole.STUDENT)
                        .fullName("Student " + upper)
                        .email(upper.toLowerCase() + "@pict.edu")
                        .phone("9876543210")
                        .active(true)
                        .isLateComerPermitted(true)
                        .build();
                user = userRepository.save(newStudent);

                StudentProfile profile = StudentProfile.builder()
                        .user(user)
                        .prn(upper)
                        .rollNumber(upper)
                        .department("E&TC")
                        .academicYear("TE")
                        .division("1")
                        .active(true)
                        .build();
                studentProfileRepository.save(profile);
            } else {
                throw new UsernameNotFoundException("User not found: " + username);
            }
        }

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPasswordHash())
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))
                .disabled(!user.getActive())
                .build();
    }
}
