package com.ikunmanager.service.impl;

import com.github.pagehelper.PageHelper;
import com.github.pagehelper.PageInfo;
import com.ikunmanager.dto.ScoreDetailDTO;
import com.ikunmanager.dto.ExamTaken;
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

    @Autowired
    private com.ikunmanager.mapper.StudentMapper studentMapper;

    @Autowired
    private com.ikunmanager.mapper.ClassMapper classMapper;

    @Autowired
    private com.ikunmanager.mapper.ExamMapper examMapper;

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

    @Override
    public List<ExamTaken> getExamsTakenByStudentId(Long studentId) {
        return scoreMapper.findExamsTakenByStudentId(studentId);
    }

    @Override
    public List<ExamTaken> getStudentUpcomingExams(Long studentId) {
        return scoreMapper.findStudentUpcomingExams(studentId);
    }

    @Override
    public com.ikunmanager.dto.StudentScoreReport getStudentScoreReport(Long studentId, Long examId) {
        // 构造报告对象
        com.ikunmanager.dto.StudentScoreReport report = new com.ikunmanager.dto.StudentScoreReport();

        // 1. 基础信息
        // 获取学生信息、班级信息
        com.ikunmanager.model.Student student = studentMapper.findById(studentId);
        if (student == null) {
            return null;
        }
        com.ikunmanager.model.IkunClass ikunClass = null;
        if (student.getClassId() != null) {
            ikunClass = classMapper.findById(student.getClassId());
        }

        com.ikunmanager.dto.StudentScoreReport.StudentInfoSection studentInfoSection = new com.ikunmanager.dto.StudentScoreReport.StudentInfoSection();
        studentInfoSection.setId(student.getId());
        studentInfoSection.setName(student.getName());
        studentInfoSection.setStudentIdStr(student.getStudentId());
        report.setStudentInfo(studentInfoSection);

        com.ikunmanager.dto.StudentScoreReport.ClassInfoSection classInfoSection = new com.ikunmanager.dto.StudentScoreReport.ClassInfoSection();
        if (ikunClass != null) {
            classInfoSection.setId(ikunClass.getId());
            classInfoSection.setName(ikunClass.getClassName());
        }
        report.setClassInfo(classInfoSection);

        // 2. 考试信息
        com.ikunmanager.model.Exam exam = examMapper.findExamById(examId);
        if (exam == null) {
            return null;
        }
        com.ikunmanager.dto.StudentScoreReport.ExamInfoSection examInfoSection = new com.ikunmanager.dto.StudentScoreReport.ExamInfoSection();
        examInfoSection.setId(exam.getId());
        examInfoSection.setName(exam.getExamName());
        examInfoSection.setDate(exam.getExamDate() != null ? exam.getExamDate().toLocalDate().toString() : null);
        if (exam.getSubjects() != null) {
            examInfoSection.setSubjects(java.util.Arrays.asList(exam.getSubjects().split("[,，]")));
        }
        report.setExamInfo(examInfoSection);

        // 3. 获取学生该次考试所有科目成绩
        java.util.List<com.ikunmanager.model.Score> studentScores = scoreMapper.findByStudentIdAndExamId(studentId, examId);

        // 4. 获取同班同考所有成绩，用于计算平均
        java.util.List<com.ikunmanager.dto.ScoreDetailDTO> classScores = null;
        if (ikunClass != null) {
            classScores = scoreMapper.findScoresByExamAndClass(examId, ikunClass.getId());
        }

        java.util.Map<String, java.util.List<com.ikunmanager.dto.ScoreDetailDTO>> classScoresBySubject = new java.util.HashMap<>();
        if (classScores != null) {
            for (com.ikunmanager.dto.ScoreDetailDTO dto : classScores) {
                classScoresBySubject.computeIfAbsent(dto.getSubject(), k -> new java.util.ArrayList<>()).add(dto);
            }
        }

        // Subject details
        java.util.List<com.ikunmanager.dto.StudentScoreReport.SubjectScoreDetail> subjectDetailList = new java.util.ArrayList<>();
        double studentTotal = 0;

        for (com.ikunmanager.model.Score score : studentScores) {
            com.ikunmanager.dto.StudentScoreReport.SubjectScoreDetail detail = new com.ikunmanager.dto.StudentScoreReport.SubjectScoreDetail();
            detail.setSubject(score.getSubject());
            if (score.getScore() != null) {
                detail.setStudentScore(score.getScore().doubleValue());
                studentTotal += score.getScore().doubleValue();
            }

            // compute class average
            java.util.List<com.ikunmanager.dto.ScoreDetailDTO> sameSubjectScores = classScoresBySubject.get(score.getSubject());
            if (sameSubjectScores != null && !sameSubjectScores.isEmpty()) {
                double avg = sameSubjectScores.stream()
                        .mapToDouble(s -> s.getScore() != null ? s.getScore().doubleValue() : 0.0)
                        .average().orElse(Double.NaN);
                if (!Double.isNaN(avg)) {
                    detail.setClassAverageScore(Math.round(avg * 100.0) / 100.0);
                }
            }

            // 计算班级排名
            if (sameSubjectScores != null && !sameSubjectScores.isEmpty()) {
                java.util.List<com.ikunmanager.dto.ScoreDetailDTO> sorted = new java.util.ArrayList<>(sameSubjectScores);
                sorted.sort((a,b)->{
                    double as = a.getScore() != null ? a.getScore().doubleValue() : 0.0;
                    double bs = b.getScore() != null ? b.getScore().doubleValue() : 0.0;
                    return Double.compare(bs, as); // 降序
                });
                int rank = 1;
                for (com.ikunmanager.dto.ScoreDetailDTO dtoRank : sorted) {
                    if (dtoRank.getStudentId().equals(studentId)) {
                        break;
                    }
                    rank++;
                }
                detail.setClassRank(rank);
            }

            subjectDetailList.add(detail);
        }

        report.setSubjectDetails(subjectDetailList);

        // Total scores
        com.ikunmanager.dto.StudentScoreReport.TotalScoreDetails total = new com.ikunmanager.dto.StudentScoreReport.TotalScoreDetails();
        total.setStudentTotalScore(studentTotal);

        // compute class average total score & 总分班级排名
        if (classScores != null && !classScores.isEmpty()) {
            java.util.Map<Long, java.lang.Double> totalByStudent = new java.util.HashMap<>();
            for (com.ikunmanager.dto.ScoreDetailDTO dto : classScores) {
                totalByStudent.merge(dto.getStudentId(), dto.getScore() != null ? dto.getScore().doubleValue() : 0.0, Double::sum);
            }

            double classAvgTotal = totalByStudent.values().stream().mapToDouble(Double::doubleValue).average().orElse(Double.NaN);
            if (!Double.isNaN(classAvgTotal)) {
                total.setClassAverageTotalScore(Math.round(classAvgTotal * 100.0) / 100.0);
            }

            java.util.List<java.util.Map.Entry<Long, Double>> totalList = new java.util.ArrayList<>(totalByStudent.entrySet());
            totalList.sort((e1,e2)->Double.compare(e2.getValue(), e1.getValue()));
            int rankTotal = 1;
            for (java.util.Map.Entry<Long, Double> entry : totalList) {
                if (entry.getKey().equals(studentId)) {
                    break;
                }
                rankTotal++;
            }
            total.setClassTotalScoreRank(rankTotal);
        }

        // 计算年级总分排名（同一次考试所有学生，不限班级）
        java.util.List<com.ikunmanager.dto.ScoreDetailDTO> gradeScores = scoreMapper.findScoresByExamAndClass(examId, null);
        if (gradeScores != null && !gradeScores.isEmpty()) {
            java.util.Map<Long, java.lang.Double> gradeTotalByStudent = new java.util.HashMap<>();
            for (com.ikunmanager.dto.ScoreDetailDTO dto : gradeScores) {
                gradeTotalByStudent.merge(dto.getStudentId(), dto.getScore() != null ? dto.getScore().doubleValue() : 0.0, Double::sum);
            }
            java.util.List<java.util.Map.Entry<Long, Double>> gradeList = new java.util.ArrayList<>(gradeTotalByStudent.entrySet());
            gradeList.sort((e1, e2) -> Double.compare(e2.getValue(), e1.getValue()));
            int gradeRank = 1;
            for (java.util.Map.Entry<Long, Double> entry : gradeList) {
                if (entry.getKey().equals(studentId)) {
                    break;
                }
                gradeRank++;
            }
            total.setGradeTotalScoreRank(gradeRank);
        } else {
            total.setGradeTotalScoreRank(null);
        }

        report.setTotalScoreDetails(total);

        return report;
    }
} 