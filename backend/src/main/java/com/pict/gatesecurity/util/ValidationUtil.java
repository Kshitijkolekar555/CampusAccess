package com.pict.gatesecurity.util;

import java.util.Set;

public class ValidationUtil {

    public static final String INDIAN_PHONE_REGEX = "^[6-9][0-9]{9}$";
    public static final String INDIAN_VEHICLE_REGEX = "^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$";
    public static final String OPTIONAL_INDIAN_VEHICLE_REGEX = "^([A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4})?$";
    public static final String PASSWORD_STRENGTH_REGEX = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$";
    public static final String NAME_REGEX = "^[a-zA-Z\\s.']{2,150}$";
    public static final String PRN_REGEX = "^[A-Z0-9]{8,20}$";

    private static final Set<String> MEANINGLESS_TEXTS = Set.of(
            "abc", "test", "aaa", "123", "asdf", "qwer", "xyz", "temp", "n/a", "na", "null", "none", "..."
    );

    /**
     * Normalizes Indian phone number by removing +91, spaces, dashes and non-digit chars.
     */
    public static String normalizePhone(String phone) {
        if (phone == null) {
            return null;
        }
        String cleaned = phone.replaceAll("[^0-9]", "");
        if (cleaned.length() > 10 && cleaned.startsWith("91")) {
            cleaned = cleaned.substring(2);
        }
        if (cleaned.length() > 10 && cleaned.startsWith("0")) {
            cleaned = cleaned.substring(1);
        }
        return cleaned;
    }

    /**
     * Normalizes vehicle registration number to standard uppercase without spaces or dashes.
     * e.g. "mh 12 ab 1234" -> "MH12AB1234"
     */
    public static String normalizeVehicleNumber(String vehicle) {
        if (vehicle == null) {
            return null;
        }
        String cleaned = vehicle.trim().replaceAll("[\\s\\-]", "").toUpperCase();
        return cleaned.isEmpty() ? null : cleaned;
    }

    /**
     * Normalizes email address to lowercase and trimmed string.
     */
    public static String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        return email.trim().toLowerCase();
    }

    /**
     * Normalizes full names by trimming and collapsing multiple spaces.
     */
    public static String normalizeName(String name) {
        if (name == null) {
            return null;
        }
        return name.trim().replaceAll("\\s+", " ");
    }

    /**
     * Checks if a user provided text (e.g. purpose or notes) is meaningless filler text.
     */
    public static boolean isMeaninglessText(String text) {
        if (text == null || text.isBlank()) {
            return true;
        }
        String normalized = text.trim().toLowerCase();
        if (normalized.length() < 3) {
            return true;
        }
        if (MEANINGLESS_TEXTS.contains(normalized)) {
            return true;
        }
        // Check repeated single character e.g. "aaaaa" or "....."
        if (normalized.chars().distinct().count() == 1) {
            return true;
        }
        return false;
    }
}
