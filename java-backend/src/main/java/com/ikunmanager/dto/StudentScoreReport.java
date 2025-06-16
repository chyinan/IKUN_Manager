package com.ikunmanager.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * 学生成绩报告 DTO，结构与前端 StudentScoreReport 接口保持一致。
 */
@Data
public class StudentScoreReport {

    @JsonProperty("student_info")
    private StudentInfoSection studentInfo;

    @JsonProperty("class_info")
    private ClassInfoSection classInfo;

    @JsonProperty("exam_info")
    private ExamInfoSection examInfo;

    @JsonProperty("subject_details")
    private List<SubjectScoreDetail> subjectDetails;

    @JsonProperty("total_score_details")
    private TotalScoreDetails totalScoreDetails;

    // 内部静态类定义 ↓
    @Data
    public static class StudentInfoSection {
        private Long id;
        private String name;
        @JsonProperty("student_id_str")
        private String studentIdStr;
    }

    @Data
    public static class ClassInfoSection {
        private Long id;
        private String name; // 允许 null
    }

    @Data
    public static class ExamInfoSection {
        private Long id;
        private String name;
        private String date; // yyyy-MM-dd
        private List<String> subjects;
    }

    @Data
    public static class SubjectScoreDetail {
        @JsonProperty("subject")
        private String subject;
        @JsonProperty("student_score")
        private Double studentScore; // 允许 null
        @JsonProperty("class_average_score")
        private Double classAverageScore; // 允许 null
        @JsonProperty("class_rank")
        private Integer classRank; // 允许 null
    }

    @Data
    public static class TotalScoreDetails {
        @JsonProperty("student_total_score")
        private Double studentTotalScore;
        @JsonProperty("class_average_total_score")
        private Double classAverageTotalScore;
        @JsonProperty("class_total_score_rank")
        private Integer classTotalScoreRank; // 允许 null
        @JsonProperty("grade_total_score_rank")
        private Integer gradeTotalScoreRank; // 允许 null
    }
} 