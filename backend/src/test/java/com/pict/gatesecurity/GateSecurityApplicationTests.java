package com.pict.gatesecurity;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class GateSecurityApplicationTests {

    @Test
    void printHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        String hash = encoder.encode("ChangeMe@123");
        System.out.println("===HASH_START===" + hash + "===HASH_END===");
        System.out.println("===VERIFY_CHECK===" + encoder.matches("ChangeMe@123", hash));
    }
}
