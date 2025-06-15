package com.ikunmanager.mapper;

import com.ikunmanager.model.User;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface UserMapper {
    List<User> findAll();
    User findByUsername(String username);
    User findById(Long id);
    int insert(User user);
    int update(User user);
}
