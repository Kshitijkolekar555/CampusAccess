package com.pict.gatesecurity.service.impl;

import com.pict.gatesecurity.dto.user.*;
import com.pict.gatesecurity.entity.User;
import com.pict.gatesecurity.entity.enums.UserRole;
import com.pict.gatesecurity.exception.BadRequestException;
import com.pict.gatesecurity.exception.DuplicateResourceException;
import com.pict.gatesecurity.exception.ResourceNotFoundException;
import com.pict.gatesecurity.mapper.UserMapper;
import com.pict.gatesecurity.repository.UserRepository;
import com.pict.gatesecurity.service.AuditLogService;
import com.pict.gatesecurity.service.UserService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public UserResponse createUser(UserCreateRequest request, String performingUsername) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username '" + request.getUsername() + "' is already taken");
        }

        if (StringUtils.hasText(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email '" + request.getEmail() + "' is already registered");
        }

        User performer = userRepository.findByUsername(performingUsername).orElse(null);

        User user = User.builder()
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .active(true)
                .build();

        User savedUser = userRepository.save(user);

        auditLogService.logAction(performer, "CREATE", "User", savedUser.getId(), null, Map.of(
                "username", savedUser.getUsername(),
                "role", savedUser.getRole().name()
        ));

        return userMapper.toResponse(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getUsers(String query, UserRole role, Boolean active, Pageable pageable) {
        Specification<User> spec = (root, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(query)) {
                String searchPattern = "%" + query.toLowerCase() + "%";
                Predicate usernameMatch = cb.like(cb.lower(root.get("username")), searchPattern);
                Predicate fullNameMatch = cb.like(cb.lower(root.get("fullName")), searchPattern);
                Predicate emailMatch = cb.like(cb.lower(root.get("email")), searchPattern);
                predicates.add(cb.or(usernameMatch, fullNameMatch, emailMatch));
            }

            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }

            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return userRepository.findAll(spec, pageable).map(userMapper::toResponse);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest request, String performingUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (StringUtils.hasText(request.getEmail()) && userRepository.existsByEmailAndIdNot(request.getEmail(), id)) {
            throw new DuplicateResourceException("Email '" + request.getEmail() + "' is already in use by another user");
        }

        User performer = userRepository.findByUsername(performingUsername).orElse(null);
        Map<String, Object> oldVal = Map.of("fullName", user.getFullName(), "role", user.getRole().name());

        user.setFullName(request.getFullName());
        user.setRole(request.getRole());
        user.setPhone(request.getPhone());
        user.setEmail(request.getEmail());

        User updatedUser = userRepository.save(user);

        auditLogService.logAction(performer, "UPDATE", "User", updatedUser.getId(), oldVal, Map.of(
                "fullName", updatedUser.getFullName(),
                "role", updatedUser.getRole().name()
        ));

        return userMapper.toResponse(updatedUser);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(String username, UserProfileUpdateRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (StringUtils.hasText(request.getEmail()) && userRepository.existsByEmailAndIdNot(request.getEmail(), user.getId())) {
            throw new DuplicateResourceException("Email '" + request.getEmail() + "' is already in use by another user");
        }

        if (StringUtils.hasText(request.getNewPassword())) {
            if (!StringUtils.hasText(request.getCurrentPassword())) {
                throw new BadRequestException("Current password is required to change password");
            }
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                throw new BadRequestException("Current password does not match");
            }
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        }

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setEmail(request.getEmail());

        User updatedUser = userRepository.save(user);
        auditLogService.logAction(updatedUser, "UPDATE_PROFILE", "User", updatedUser.getId(), null, Map.of("username", username));

        return userMapper.toResponse(updatedUser);
    }

    @Override
    @Transactional
    public UserResponse updateUserStatus(Long id, UserStatusUpdateRequest request, String performingUsername) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        User performer = userRepository.findByUsername(performingUsername).orElse(null);
        Map<String, Object> oldVal = Map.of("active", user.getActive());

        user.setActive(request.getActive());
        User updatedUser = userRepository.save(user);

        auditLogService.logAction(performer, "UPDATE_STATUS", "User", updatedUser.getId(), oldVal, Map.of("active", updatedUser.getActive()));

        return userMapper.toResponse(updatedUser);
    }
}
