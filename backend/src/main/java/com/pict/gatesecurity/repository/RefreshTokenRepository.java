package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    void deleteByUserId(Long userId);

    void deleteByExpiresAtBefore(OffsetDateTime dateTime);
}
