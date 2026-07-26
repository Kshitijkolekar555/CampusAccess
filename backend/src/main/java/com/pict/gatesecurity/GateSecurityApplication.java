package com.pict.gatesecurity;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GateSecurityApplication {
    public static void main(String[] args) {
        SpringApplication.run(GateSecurityApplication.class, args);
    }
}