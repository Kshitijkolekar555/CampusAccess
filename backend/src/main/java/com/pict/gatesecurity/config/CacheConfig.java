package com.pict.gatesecurity.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.CaffeineSpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_ADMIN_DASHBOARD = "adminDashboard";
    public static final String CACHE_GUARD_DASHBOARD = "guardDashboard";
    public static final String CACHE_WARDEN_DASHBOARD = "wardenDashboard";
    public static final String CACHE_DAILY_TRENDS = "dailyTrends";
    public static final String CACHE_WEEKLY_TRENDS = "weeklyTrends";
    public static final String CACHE_MONTHLY_TRENDS = "monthlyTrends";
    public static final String CACHE_DEPARTMENT_ANALYTICS = "departmentAnalytics";
    public static final String CACHE_GATE_ANALYTICS = "gateAnalytics";
    public static final String CACHE_VEHICLE_ANALYTICS = "vehicleAnalytics";
    public static final String CACHE_VISITOR_ANALYTICS = "visitorAnalytics";
    public static final String CACHE_GUARD_PERFORMANCE = "guardPerformance";
    public static final String CACHE_RECENT_ACTIVITIES = "recentActivities";

    @Bean
    @ConditionalOnProperty(name = "app.cache.type", havingValue = "caffeine", matchIfMissing = true)
    public CacheManager caffeineCacheManager(@Value("${app.cache.caffeine-spec:maximumSize=200,expireAfterWrite=30s}") String caffeineSpec) {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeineSpec(CaffeineSpec.parse(caffeineSpec));
        cacheManager.setAllowNullValues(false);
        return cacheManager;
    }

    @Bean
    @ConditionalOnProperty(name = "app.cache.type", havingValue = "redis")
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.afterPropertiesSet();
        return template;
    }
}
