package com.ikunmanager.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理器，将自定义业务异常和未知异常统一封装为 ApiResponse，
 * 避免 Spring Boot 默认将 RuntimeException 直接映射为 500。
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 处理业务自定义异常
     */
    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ApiResponse<Void>> handleCustomException(CustomException ex) {
        int code = ex.getCode();
        // 若 code 不在合法 HTTP 状态码范围，则默认用 400
        HttpStatus status = HttpStatus.resolve(code);
        if (status == null) {
            status = HttpStatus.BAD_REQUEST;
        }
        ApiResponse<Void> body = ApiResponse.error(status, ex.getMessage());
        return new ResponseEntity<>(body, status);
    }

    /**
     * 处理其它未知异常，统一返回 500
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception ex) {
        ex.printStackTrace(); // 记录堆栈
        ApiResponse<Void> body = ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR, "服务器内部错误");
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * 处理 Spring Security 认证异常（例如用户名或密码错误）
     */
    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthenticationException(org.springframework.security.core.AuthenticationException ex) {
        // 记录堆栈方便调试，但不暴露给前端
        ex.printStackTrace();
        ApiResponse<Void> body = ApiResponse.error(HttpStatus.UNAUTHORIZED, "用户名或密码错误");
        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }
} 