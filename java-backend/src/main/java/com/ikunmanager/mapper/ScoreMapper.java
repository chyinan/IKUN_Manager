package com.ikunmanager.mapper;

import com.ikunmanager.model.Score;
import com.ikunmanager.dto.ScoreDetailDTO;
import com.ikunmanager.dto.ExamTaken;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ScoreMapper {

    List<Score> findByPage(@Param("studentId") Long studentId,
                           @Param("examId") Long examId,
                           @Param("subject") String subject);

    int countByPage(@Param("studentId") Long studentId,
                    @Param("examId") Long examId,
                    @Param("subject") String subject);

    Score findById(@Param("id") Long id);

    int insert(Score score);

    int update(Score score);

    int deleteById(@Param("id") Long id);

    int deleteByIds(@Param("ids") List<Long> ids);

    List<Score> findByStudentIdAndExamId(@Param("studentId") Long studentId, @Param("examId") Long examId);

    // 新增：根据学生ID、考试ID和科目查找成绩
    Score findByStudentIdAndExamIdAndSubject(@Param("studentId") Long studentId,
                                           @Param("examId") Long examId,
                                           @Param("subject") String subject);

    // 新增：根据考试ID和班级ID获取成绩详情列表
    List<ScoreDetailDTO> findScoresByExamAndClass(@Param("examId") Long examId, @Param("classId") Long classId);

    /**
     * 获取学生已参加的所有考试列表
     * @param studentId 学生ID
     * @return 考试列表
     */
    List<ExamTaken> findExamsTakenByStudentId(@Param("studentId") Long studentId);

    /**
     * 获取学生即将进行的考试列表
     * @param studentId 学生ID
     * @return 考试列表
     */
    List<ExamTaken> findStudentUpcomingExams(@Param("studentId") Long studentId);

} 