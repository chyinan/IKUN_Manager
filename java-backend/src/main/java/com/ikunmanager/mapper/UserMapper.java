package com.ikunmanager.mapper;

import com.ikunmanager.model.User;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface UserMapper {
    List<User> findAll();
    User findByUsername(String username);
    int insert(User user);
}
