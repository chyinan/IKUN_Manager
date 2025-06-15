package com.ikunmanager.mapper;

import com.ikunmanager.model.Score;
import com.ikunmanager.dto.ScoreDetailDTO;
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

} 