package com.ikunmanager.controller;

import com.ikunmanager.common.ApiResponse;
import com.ikunmanager.model.Exam;
import com.ikunmanager.service.ExamService;
import com.ikunmanager.dto.ExamStatsDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam")
public class ExamController {

    @Autowired
    private ExamService examService;

    @GetMapping("/list")
    public ApiResponse<List<Exam>> getAllExams(@RequestParam(required = false) String examName,
                                             @RequestParam(required = false) String examType) {
        List<Exam> exams = examService.getAllExams(examName, examType);
        return ApiResponse.ok(exams);
    }

    @GetMapping("/{id}")
    public ApiResponse<Exam> getExamById(@PathVariable Long id) {
        Exam exam = examService.getExamById(id);
        if (exam != null) {
            return ApiResponse.ok(exam);
        } else {
            return ApiResponse.error(404, "Exam not found.");
        }
    }

    @PostMapping("/add")
    public ApiResponse<Exam> addExam(@RequestBody Exam exam) {
        Exam newExam = examService.addExam(exam);
        return ApiResponse.ok(newExam);
    }

    @PutMapping("/update")
    public ApiResponse<Exam> updateExam(@RequestBody Exam exam) {
        Exam updatedExam = examService.updateExam(exam);
        return ApiResponse.ok(updatedExam);
    }

    @DeleteMapping("/delete/{id}")
    public ApiResponse<Void> deleteExam(@PathVariable Long id) {
        examService.deleteExam(id);
        return ApiResponse.ok(null);
    }

    @GetMapping("/types")
    public ApiResponse<List<String>> getExamTypes() {
        List<String> types = examService.getDistinctExamTypes();
        return ApiResponse.ok(types);
    }

    @GetMapping("/stats")
    public ApiResponse<ExamStatsDTO> getExamStats() {
        try {
            ExamStatsDTO stats = examService.getExamStatistics();
            return ApiResponse.ok(stats);
        } catch (Exception e) {
            return ApiResponse.error(500, "获取考试统计数据失败: " + e.getMessage());
        }
    }
} 