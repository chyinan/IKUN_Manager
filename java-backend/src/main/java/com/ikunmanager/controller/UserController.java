package com.ikunmanager.controller;

import com.ikunmanager.common.ApiResponse;
import com.ikunmanager.mapper.UserMapper;
import com.ikunmanager.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserMapper userMapper;

    @Autowired
    public UserController(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @GetMapping("/info")
    public ApiResponse<User> getUserInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        User user = userMapper.findByUsername(currentUsername);
        return ApiResponse.ok(user);
    }

    @GetMapping
    public ApiResponse<List<User>> getAllUsers() {
        return ApiResponse.ok(userMapper.findAll());
    }
}
