package com.ikunmanager.service;

import com.ikunmanager.common.CustomException;
import com.ikunmanager.mapper.SubjectMapper;
import com.ikunmanager.model.Subject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SubjectService {

    @Autowired
    private SubjectMapper subjectMapper;

    public List<Subject> getAllSubjects() {
        return subjectMapper.findAll();
    }

    public Subject getSubjectById(Long id) {
        return subjectMapper.findById(id);
    }

    public Subject addSubject(Subject subject) {
        // Check if subject with same name already exists
        Subject existingSubject = subjectMapper.findBySubjectName(subject.getSubjectName());
        if (existingSubject != null) {
            throw new CustomException(HttpStatus.CONFLICT.value(), "Subject with name '" + subject.getSubjectName() + "' already exists.");
        }
        subject.setCreateTime(LocalDateTime.now());
        subject.setUpdateTime(LocalDateTime.now());
        subjectMapper.insertSubject(subject);
        return subject;
    }

    public Subject updateSubject(Subject subject) {
        Subject existingSubject = subjectMapper.findById(subject.getId());
        if (existingSubject == null) {
            throw new CustomException(HttpStatus.NOT_FOUND.value(), "Subject not found.");
        }
        // Check for duplicate name if name is being changed
        if (!existingSubject.getSubjectName().equals(subject.getSubjectName())) {
            Subject subjectWithNewName = subjectMapper.findBySubjectName(subject.getSubjectName());
            if (subjectWithNewName != null && !subjectWithNewName.getId().equals(subject.getId())) {
                throw new CustomException(HttpStatus.CONFLICT.value(), "Subject with name '" + subject.getSubjectName() + "' already exists.");
            }
        }
        subject.setUpdateTime(LocalDateTime.now());
        subjectMapper.updateSubject(subject);
        return subject;
    }

    public void deleteSubject(Long id) {
        Subject existingSubject = subjectMapper.findById(id);
        if (existingSubject == null) {
            throw new CustomException(HttpStatus.NOT_FOUND.value(), "Subject not found.");
        }
        subjectMapper.deleteSubject(id);
    }
} 