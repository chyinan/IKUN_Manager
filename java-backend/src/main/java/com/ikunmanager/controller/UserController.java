package com.ikunmanager.controller;

import com.ikunmanager.common.ApiResponse;
import com.ikunmanager.mapper.UserMapper;
import com.ikunmanager.model.User;
import com.ikunmanager.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserMapper userMapper;
    private final UserService userService;

    @Autowired
    public UserController(UserMapper userMapper, UserService userService) {
        this.userMapper = userMapper;
        this.userService = userService;
    }

    @GetMapping("/info")
    public ApiResponse<User> getUserInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        User user = userMapper.findByUsername(currentUsername);
        System.out.println("Backend User Info fetched: " + user);
        return ApiResponse.ok(user);
    }

    @GetMapping
    public ApiResponse<List<User>> getAllUsers() {
        return ApiResponse.ok(userMapper.findAll());
    }

    @PutMapping("/profile")
    public ApiResponse<User> updateUserProfile(@RequestBody User user) {
        // Get currently authenticated user's ID for security
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        User existingUser = userMapper.findByUsername(currentUsername);

        if (existingUser == null) {
            return ApiResponse.error(404, "User not found");
        }

        // Ensure the ID in the request body matches the authenticated user's ID
        // Or, you might choose to ignore the ID from the request body and always use existingUser.getId()
        user.setId(existingUser.getId()); // IMPORTANT: Ensure we update the correct user

        User updatedUser = userService.updateUser(user);
        return ApiResponse.ok(updatedUser);
    }
}
