package com.ikunmanager.service;

import com.ikunmanager.model.IkunClass;
import com.ikunmanager.mapper.ClassMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClassService {

    @Autowired
    private ClassMapper classMapper;

    public List<IkunClass> getAllClasses(String className) {
        return classMapper.findAll(className);
    }

    public IkunClass getClassById(Long id) {
        return classMapper.findById(id);
    }

    public IkunClass addClass(IkunClass ikunClass) {
        classMapper.insert(ikunClass);
        return ikunClass;
    }

    public IkunClass updateClass(IkunClass ikunClass) {
        classMapper.update(ikunClass);
        return classMapper.findById(ikunClass.getId());
    }

    public void deleteClass(Long id) {
        classMapper.delete(id);
    }
} 