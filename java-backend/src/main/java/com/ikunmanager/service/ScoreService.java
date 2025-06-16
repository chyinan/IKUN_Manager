package com.ikunmanager.service;

import com.github.pagehelper.PageInfo;
import com.ikunmanager.model.Score;
import com.ikunmanager.dto.ScoreDetailDTO;
import com.ikunmanager.dto.ExamTaken;
import java.util.List;

public interface ScoreService {
    PageInfo<Score> getScoresByPage(Long studentId, Long examId, String subject, int pageNum, int pageSize);
    Score getScoreById(Long id);
    Score addScore(Score score);
    Score updateScore(Score score);
    void deleteScore(Long id);
    void batchDeleteScores(List<Long> ids);
    List<Score> getScoresByStudentAndExam(Long studentId, Long examId);
    Score getScoreByStudentExamAndSubject(Long studentId, Long examId, String subject);
    List<ScoreDetailDTO> getScoresByExamAndClass(Long examId, Long classId);
    List<ExamTaken> getExamsTakenByStudentId(Long studentId);
    List<ExamTaken> getStudentUpcomingExams(Long studentId);

    /**
     * 生成学生成绩报告
     * @param studentId 学生ID
     * @param examId 考试ID
     * @return 学生成绩报告 DTO
     */
    com.ikunmanager.dto.StudentScoreReport getStudentScoreReport(Long studentId, Long examId);
} 