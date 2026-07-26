package com.pict.gatesecurity.repository;

import com.pict.gatesecurity.entity.WatchlistEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WatchlistRepository extends JpaRepository<WatchlistEntry, Long> {

    /**
     * Check if a visitor's mobile or name matches any watchlist entry.
     * Used during visitor check-in to set isBlacklistedMatch flag.
     */
    @Query("SELECT w FROM WatchlistEntry w WHERE w.mobile = :mobile OR LOWER(w.name) = LOWER(:name)")
    List<WatchlistEntry> findMatchingEntries(@Param("mobile") String mobile, @Param("name") String name);
}
