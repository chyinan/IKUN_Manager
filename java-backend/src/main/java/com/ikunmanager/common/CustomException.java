package com.ikunmanager.common;

import org.springframework.http.HttpStatus;

public class CustomException extends RuntimeException {
    private final int code;

    public CustomException(int code, String message) {
        super(message);
        this.code = code;
    }

    public CustomException(HttpStatus status, String message) {
        this(status.value(), message);
    }

    public int getCode() {
        return code;
    }
} 