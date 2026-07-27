package com.pict.gatesecurity.config;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MetricsConfig {

    @Bean
    public Counter visitorCheckInCounter(MeterRegistry registry) {
        return Counter.builder("campus.visitor.checkin")
                .description("Total visitor check-ins")
                .tag("type", "counter")
                .register(registry);
    }

    @Bean
    public Counter visitorCheckOutCounter(MeterRegistry registry) {
        return Counter.builder("campus.visitor.checkout")
                .description("Total visitor check-outs")
                .tag("type", "counter")
                .register(registry);
    }

    @Bean
    public Counter vehicleEntryCounter(MeterRegistry registry) {
        return Counter.builder("campus.vehicle.entry")
                .description("Total vehicle entries")
                .tag("type", "counter")
                .register(registry);
    }

    @Bean
    public Counter notificationSentCounter(MeterRegistry registry) {
        return Counter.builder("campus.notification.sent")
                .description("Total notifications sent")
                .tag("type", "counter")
                .register(registry);
    }

    @Bean
    public Counter notificationFailedCounter(MeterRegistry registry) {
        return Counter.builder("campus.notification.failed")
                .description("Total notification failures")
                .tag("type", "counter")
                .register(registry);
    }

    @Bean
    public Counter gatePassIssuedCounter(MeterRegistry registry) {
        return Counter.builder("campus.gatepass.issued")
                .description("Total gate passes issued")
                .tag("type", "counter")
                .register(registry);
    }

    @Bean
    public Counter outpassIssuedCounter(MeterRegistry registry) {
        return Counter.builder("campus.outpass.issued")
                .description("Total hostel outpasses issued")
                .tag("type", "counter")
                .register(registry);
    }

    @Bean
    public Timer searchQueryTimer(MeterRegistry registry) {
        return Timer.builder("campus.search.query")
                .description("Search query execution time")
                .publishPercentiles(0.5, 0.75, 0.95, 0.99)
                .publishPercentileHistogram()
                .register(registry);
    }

    @Bean
    public Timer dashboardLoadTimer(MeterRegistry registry) {
        return Timer.builder("campus.dashboard.load")
                .description("Dashboard data load time")
                .publishPercentiles(0.5, 0.75, 0.95, 0.99)
                .publishPercentileHistogram()
                .register(registry);
    }
}
