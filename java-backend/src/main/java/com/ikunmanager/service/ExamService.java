package com.ikunmanager.service;

import com.ikunmanager.common.CustomException;
import com.ikunmanager.mapper.ClassMapper;
import com.ikunmanager.mapper.ExamMapper;
import com.ikunmanager.mapper.SubjectMapper;
import com.ikunmanager.model.Exam;
import com.ikunmanager.model.IkunClass;
import com.ikunmanager.model.Subject;
import com.ikunmanager.dto.ExamStatsDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExamService {

    @Autowired
    private ExamMapper examMapper;
    @Autowired
    private ClassMapper classMapper;
    @Autowired
    private SubjectMapper subjectMapper;

    public List<Exam> getAllExams(String examName, String examType) {
        List<Exam> exams = examMapper.findAllExams(examName, examType);
        // Populate transient fields (classNames, subjectNames)
        exams.forEach(this::populateTransientFields);
        return exams;
    }

    public Exam getExamById(Long id) {
        Exam exam = examMapper.findExamById(id);
        if (exam != null) {
            populateTransientFields(exam);
        }
        return exam;
    }

    @Transactional
    public Exam addExam(Exam exam) {
        // Set initial status to 0 (未开始) if not provided
        if (exam.getStatus() == null) {
            exam.setStatus(0);
        }

        // Save subjects as a comma-separated string based on subjectIds
        if (exam.getSubjectIds() != null && !exam.getSubjectIds().isEmpty()) {
            String subjectNames = exam.getSubjectIds().stream()
                    .map(subjectMapper::findById)
                    .map(Subject::getSubjectName)
                    .collect(Collectors.joining(","));
            exam.setSubjects(subjectNames);
        }

        examMapper.insertExam(exam);

        // Insert exam-class links
        if (exam.getClassIds() != null && !exam.getClassIds().isEmpty()) {
            for (Long classId : exam.getClassIds()) {
                IkunClass ikunClass = classMapper.findById(classId);
                if (ikunClass == null) {
                    throw new CustomException(HttpStatus.BAD_REQUEST.value(), "Class with ID " + classId + " not found.");
                }
                examMapper.insertExamClassLink(exam.getId(), classId);
            }
        }

        // Insert exam-subject links (with default scores/weights)
        if (exam.getSubjectIds() != null && !exam.getSubjectIds().isEmpty()) {
            for (Long subjectId : exam.getSubjectIds()) {
                Subject subject = subjectMapper.findById(subjectId);
                if (subject == null) {
                    throw new CustomException(HttpStatus.BAD_REQUEST.value(), "Subject with ID " + subjectId + " not found.");
                }
                examMapper.insertExamSubjectLink(exam.getId(), subjectId);
            }
        }

        populateTransientFields(exam); // Populate transient fields for the returned object
        return exam;
    }

    @Transactional
    public Exam updateExam(Exam exam) {
        Exam existingExam = examMapper.findExamById(exam.getId());
        if (existingExam == null) {
            throw new CustomException(HttpStatus.NOT_FOUND.value(), "Exam not found.");
        }

        // Update subjects string
        if (exam.getSubjectIds() != null && !exam.getSubjectIds().isEmpty()) {
            String subjectNames = exam.getSubjectIds().stream()
                    .map(subjectMapper::findById)
                    .map(Subject::getSubjectName)
                    .collect(Collectors.joining(","));
            exam.setSubjects(subjectNames);
        } else {
            exam.setSubjects(null);
        }

        examMapper.updateExam(exam);

        // Update exam-class links: delete old and insert new
        examMapper.deleteExamClassLinkByExamId(exam.getId());
        if (exam.getClassIds() != null && !exam.getClassIds().isEmpty()) {
            for (Long classId : exam.getClassIds()) {
                IkunClass ikunClass = classMapper.findById(classId);
                if (ikunClass == null) {
                    throw new CustomException(HttpStatus.BAD_REQUEST.value(), "Class with ID " + classId + " not found.");
                }
                examMapper.insertExamClassLink(exam.getId(), classId);
            }
        }

        // Update exam-subject links: delete old and insert new
        examMapper.deleteExamSubjectLinkByExamId(exam.getId());
        if (exam.getSubjectIds() != null && !exam.getSubjectIds().isEmpty()) {
            for (Long subjectId : exam.getSubjectIds()) {
                Subject subject = subjectMapper.findById(subjectId);
                if (subject == null) {
                    throw new CustomException(HttpStatus.BAD_REQUEST.value(), "Subject with ID " + subjectId + " not found.");
                }
                examMapper.insertExamSubjectLink(exam.getId(), subjectId);
            }
        }

        populateTransientFields(exam); // Populate transient fields for the returned object
        return exam;
    }

    @Transactional
    public void deleteExam(Long id) {
        // Delete associated class and subject links first to maintain referential integrity
        examMapper.deleteExamClassLinkByExamId(id);
        examMapper.deleteExamSubjectLinkByExamId(id);
        examMapper.deleteExam(id);
    }

    public List<String> getDistinctExamTypes() {
        return examMapper.findDistinctExamTypes();
    }

    // Helper method to populate transient fields for an Exam object
    private void populateTransientFields(Exam exam) {
        // Populate class names and IDs
        List<String> classNames = examMapper.findClassNamesByExamId(exam.getId());
        exam.setClassNames(classNames);
        List<Long> classIds = examMapper.findClassIdsByExamId(exam.getId());
        exam.setClassIds(classIds);

        // Populate subject IDs (names are already in exam.subjects, which is a DB field)
        List<Long> subjectIds = examMapper.findSubjectIdsByExamId(exam.getId());
        exam.setSubjectIds(subjectIds);
    }

    // Method to update exam status based on current date/time
    public void updateExamStatusScheduler() {
        List<Exam> allExams = examMapper.findAllExams(null, null);
        LocalDateTime now = LocalDateTime.now();

        for (Exam exam : allExams) {
            int currentStatus = exam.getStatus();
            int newStatus = currentStatus;

            // Assuming examDate is the start time, duration is in minutes
            LocalDateTime startTime = exam.getExamDate();
            LocalDateTime endTime = startTime.plusMinutes(exam.getDuration());

            if (now.isBefore(startTime) && currentStatus != 0) {
                newStatus = 0; // 未开始
            } else if (now.isAfter(startTime) && now.isBefore(endTime) && currentStatus != 1) {
                newStatus = 1; // 进行中
            } else if (now.isAfter(endTime) && currentStatus != 2) {
                newStatus = 2; // 已结束
            }

            if (newStatus != currentStatus) {
                exam.setStatus(newStatus);
                examMapper.updateExam(exam); // Update status in DB
            }
        }
    }

    public ExamStatsDTO getExamStatistics() {
        ExamStatsDTO stats = new ExamStatsDTO();

        // 考试总数
        Long totalExams = examMapper.getTotalExams();
        stats.setTotal(totalExams);

        // 考试类型分布
        stats.setTypeDistribution(examMapper.getExamTypeDistribution());

        return stats;
    }
} 