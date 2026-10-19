package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByUsername(String username);

    Optional<User> findFirstByUsernameIgnoreCase(String username);

    Optional<User> findFirstByOrderByIdAsc();

    Optional<User> findByEmail(String email);

    Optional<User> findFirstByEmailIgnoreCase(String email);

    boolean existsByUsername(String username);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmail(String email);

    boolean existsByUsernameAndIdNot(String username, Long id);

    boolean existsByEmailAndIdNot(String email, Long id);
}
