package com.ikunmanager.mapper;

import com.ikunmanager.model.Exam;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Map;

@Mapper
public interface ExamMapper {
    List<Exam> findAllExams(@Param("examName") String examName, @Param("examType") String examType);
    Exam findExamById(@Param("id") Long id);
    int insertExam(Exam exam);
    int updateExam(Exam exam);
    int deleteExam(@Param("id") Long id);

    // Exam-Class Link
    void insertExamClassLink(@Param("examId") Long examId, @Param("classId") Long classId);
    void deleteExamClassLinkByExamId(@Param("examId") Long examId);

    // Exam-Subject Link
    void insertExamSubjectLink(@Param("examId") Long examId, @Param("subjectId") Long subjectId);
    void deleteExamSubjectLinkByExamId(@Param("examId") Long examId);

    // Utility method to get existing exam types
    List<String> findDistinctExamTypes();

    // Helper methods for populating transient fields
    List<String> findClassNamesByExamId(@Param("examId") Long examId);
    List<Long> findClassIdsByExamId(@Param("examId") Long examId);
    List<String> findSubjectNamesByExamId(@Param("examId") Long examId);
    List<Long> findSubjectIdsByExamId(@Param("examId") Long examId);

    // 获取考试总数
    Long getTotalExams();

    // 获取考试类型分布
    List<Map<String, Object>> getExamTypeDistribution();
} 