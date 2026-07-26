package com.pict.gatesecurity.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    private boolean success;
    private int statusCode;
    private String message;
    private T data;
    private Object errors;
    @Builder.Default
    private OffsetDateTime timestamp = OffsetDateTime.now();

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .statusCode(200)
                .message(message)
                .data(data)
                .timestamp(OffsetDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> success(T data) {
        return success(data, "Operation completed successfully");
    }

    public static <T> ApiResponse<T> created(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .statusCode(201)
                .message(message)
                .data(data)
                .timestamp(OffsetDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> error(int statusCode, String message, Object errors) {
        return ApiResponse.<T>builder()
                .success(false)
                .statusCode(statusCode)
                .message(message)
                .errors(errors)
                .timestamp(OffsetDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> error(int statusCode, String message) {
        return error(statusCode, message, null);
    }
}
