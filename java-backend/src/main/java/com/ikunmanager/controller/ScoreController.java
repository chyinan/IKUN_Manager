package com.ikunmanager.controller;

import com.github.pagehelper.PageInfo;
import com.ikunmanager.common.ApiResponse;
import com.ikunmanager.model.Score;
import com.ikunmanager.dto.ScoreDetailDTO;
import com.ikunmanager.dto.ExamTaken;
import com.ikunmanager.service.ScoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/score")
public class ScoreController {

    @Autowired
    private ScoreService scoreService;

    @GetMapping("/list")
    public ApiResponse<PageInfo<Score>> getScoreList(
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long examId,
            @RequestParam(required = false) String subject,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        PageInfo<Score> pageInfo = scoreService.getScoresByPage(studentId, examId, subject, pageNum, pageSize);
        return ApiResponse.ok(pageInfo);
    }

    @GetMapping("/{id}")
    public ApiResponse<Score> getScoreById(@PathVariable Long id) {
        Score score = scoreService.getScoreById(id);
        if (score != null) {
            return ApiResponse.ok(score);
        } else {
            return ApiResponse.error(404, "Score not found.");
        }
    }

    @PostMapping("/add")
    public ApiResponse<Score> addScore(@RequestBody Score score) {
        Score newScore = scoreService.addScore(score);
        return ApiResponse.ok(newScore);
    }

    @PutMapping("/update")
    public ApiResponse<Score> updateScore(@RequestBody Score score) {
        Score updatedScore = scoreService.updateScore(score);
        return ApiResponse.ok(updatedScore);
    }

    @DeleteMapping("/delete/{id}")
    public ApiResponse<Void> deleteScore(@PathVariable Long id) {
        scoreService.deleteScore(id);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/batchDelete")
    public ApiResponse<Void> batchDeleteScores(@RequestBody List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return ApiResponse.error(400, "请选择要删除的成绩");
        }
        scoreService.batchDeleteScores(ids);
        return ApiResponse.ok(null);
    }

    @GetMapping("/student/{studentId}/exam/{examId}")
    public ApiResponse<List<Score>> getScoresByStudentAndExam(
            @PathVariable Long studentId, @PathVariable Long examId) {
        List<Score> scores = scoreService.getScoresByStudentAndExam(studentId, examId);
        return ApiResponse.ok(scores);
    }

    @GetMapping("/student/{studentId}/exam/{examId}/subject/{subject}")
    public ApiResponse<Score> getScoreByStudentExamAndSubject(
            @PathVariable Long studentId, @PathVariable Long examId, @PathVariable String subject) {
        Score score = scoreService.getScoreByStudentExamAndSubject(studentId, examId, subject);
        if (score != null) {
            return ApiResponse.ok(score);
        } else {
            return ApiResponse.error(404, "Score not found.");
        }
    }

    @GetMapping("/exam/{examId}/class/{classId}")
    public ApiResponse<List<ScoreDetailDTO>> getScoresByExamAndClass(
            @PathVariable Long examId, @PathVariable Long classId) {
        List<ScoreDetailDTO> scores = scoreService.getScoresByExamAndClass(examId, classId);
        return ApiResponse.ok(scores);
    }

    @GetMapping("/student/{studentId}/exams-taken")
    public ApiResponse<List<ExamTaken>> getExamsTakenByStudentId(@PathVariable Long studentId) {
        List<ExamTaken> exams = scoreService.getExamsTakenByStudentId(studentId);
        return ApiResponse.ok(exams);
    }

    @GetMapping("/student/{studentId}/upcoming-exams")
    public ApiResponse<List<ExamTaken>> getStudentUpcomingExams(@PathVariable Long studentId) {
        List<ExamTaken> upcomingExams = scoreService.getStudentUpcomingExams(studentId);
        return ApiResponse.ok(upcomingExams);
    }
} 