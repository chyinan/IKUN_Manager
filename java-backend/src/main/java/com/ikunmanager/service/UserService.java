package com.ikunmanager.service;

import com.ikunmanager.model.User;

public interface UserService {
    User findByUsername(String username);
    User saveUser(User user);
    User updateUser(User user);
}
