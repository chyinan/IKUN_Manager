package com.ikunmanager.service.impl;

import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.ikunmanager.dto.ScoreDetailDTO;
import com.ikunmanager.mapper.ScoreMapper;
import com.ikunmanager.model.Score;
import com.ikunmanager.service.ScoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ScoreServiceImpl implements ScoreService {

    @Autowired
    private ScoreMapper scoreMapper;

    @Override
    public PageInfo<Score> getScoresByPage(Long studentId, Long examId, String subject, int pageNum, int pageSize) {
        PageHelper.startPage(pageNum, pageSize);
        List<Score> scores = scoreMapper.findByPage(studentId, examId, subject);
        return new PageInfo<>(scores);
    }

    @Override
    public Score getScoreById(Long id) {
        return scoreMapper.findById(id);
    }

    @Override
    public Score addScore(Score score) {
        scoreMapper.insert(score);
        return score;
    }

    @Override
    public Score updateScore(Score score) {
        scoreMapper.update(score);
        return score;
    }

    @Override
    public void deleteScore(Long id) {
        scoreMapper.deleteById(id);
    }

    @Override
    public void batchDeleteScores(List<Long> ids) {
        scoreMapper.deleteByIds(ids);
    }

    @Override
    public List<Score> getScoresByStudentAndExam(Long studentId, Long examId) {
        return scoreMapper.findByStudentIdAndExamId(studentId, examId);
    }

    @Override
    public Score getScoreByStudentExamAndSubject(Long studentId, Long examId, String subject) {
        return scoreMapper.findByStudentIdAndExamIdAndSubject(studentId, examId, subject);
    }

    @Override
    public List<ScoreDetailDTO> getScoresByExamAndClass(Long examId, Long classId) {
        return scoreMapper.findScoresByExamAndClass(examId, classId);
    }
} 