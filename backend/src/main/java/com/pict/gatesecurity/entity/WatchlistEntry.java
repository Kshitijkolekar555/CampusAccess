package com.pict.gatesecurity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "watchlist")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WatchlistEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 15)
    private String mobile;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "added_by", nullable = false,
            foreignKey = @ForeignKey(name = "fk_watchlist_added_by"))
    private User addedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
