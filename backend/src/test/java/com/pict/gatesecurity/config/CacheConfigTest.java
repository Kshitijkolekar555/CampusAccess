package com.pict.gatesecurity.config;

import com.pict.gatesecurity.dto.dashboard.AdminDashboardResponse;
import com.pict.gatesecurity.dto.dashboard.GuardSelfDashboardResponse;
import com.pict.gatesecurity.dto.dashboard.WardenDashboardResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.cache.CacheAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.cache.support.AbstractValueAdaptingCache;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = CacheConfig.class, properties = {
        "spring.cache.type=caffeine",
        "app.cache.caffeine-spec=maximumSize=10,expireAfterWrite=5s"
})
@ActiveProfiles("local")
class CacheConfigTest {

    @Autowired
    private CacheManager cacheManager;

    @Test
    void cacheManager_shouldBeCaffeine() {
        assertNotNull(cacheManager);
        assertTrue(cacheManager.getCacheNames().iterator().hasNext());
    }

    @Test
    void adminDashboardCache_shouldBeAvailable() {
        assertNotNull(cacheManager.getCache(CacheConfig.CACHE_ADMIN_DASHBOARD));
    }

    @Test
    void guardDashboardCache_shouldBeAvailable() {
        assertNotNull(cacheManager.getCache(CacheConfig.CACHE_GUARD_DASHBOARD));
    }

    @Test
    void wardenDashboardCache_shouldBeAvailable() {
        assertNotNull(cacheManager.getCache(CacheConfig.CACHE_WARDEN_DASHBOARD));
    }

    @Test
    void dailyTrendsCache_shouldBeAvailable() {
        assertNotNull(cacheManager.getCache(CacheConfig.CACHE_DAILY_TRENDS));
    }

    @Test
    void weeklyTrendsCache_shouldBeAvailable() {
        assertNotNull(cacheManager.getCache(CacheConfig.CACHE_WEEKLY_TRENDS));
    }

    @Test
    void monthlyTrendsCache_shouldBeAvailable() {
        assertNotNull(cacheManager.getCache(CacheConfig.CACHE_MONTHLY_TRENDS));
    }

    @Test
    void departmentAnalyticsCache_shouldBeAvailable() {
        assertNotNull(cacheManager.getCache(CacheConfig.CACHE_DEPARTMENT_ANALYTICS));
    }

    @Test
    void gateAnalyticsCache_shouldBeAvailable() {
        assertNotNull(cacheManager.getCache(CacheConfig.CACHE_GATE_ANALYTICS));
    }

    @Test
    void vehicleAnalyticsCache_shouldBeAvailable() {
        assertNotNull(cacheManager.getCache(CacheConfig.CACHE_VEHICLE_ANALYTICS));
    }

    @Test
    void visitorAnalyticsCache_shouldBeAvailable() {
        assertNotNull(cacheManager.getCache(CacheConfig.CACHE_VISITOR_ANALYTICS));
    }

    @Test
    void guardPerformanceCache_shouldBeAvailable() {
        assertNotNull(cacheManager.getCache(CacheConfig.CACHE_GUARD_PERFORMANCE));
    }

    @Test
    void recentActivitiesCache_shouldBeAvailable() {
        assertNotNull(cacheManager.getCache(CacheConfig.CACHE_RECENT_ACTIVITIES));
    }
}
