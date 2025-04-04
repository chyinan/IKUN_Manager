-- 考试表
CREATE TABLE `exam` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `exam_name` varchar(100) NOT NULL COMMENT '考试名称',
  `exam_type` varchar(50) NOT NULL COMMENT '考试类型(月考/期中/期末/模拟考)',
  `exam_date` datetime NOT NULL COMMENT '考试日期时间',
  `duration` int NOT NULL COMMENT '考试时长(分钟)',
  `subjects` varchar(255) NOT NULL COMMENT '考试科目(多个科目用逗号分隔)',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '状态(0:未开始,1:进行中,2:已结束)',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_exam_date` (`exam_date`),
  KEY `idx_exam_type` (`exam_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考试表';

-- 考试班级关联表
CREATE TABLE `exam_class` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `exam_id` bigint(20) NOT NULL COMMENT '考试ID',
  `class_id` bigint(20) NOT NULL COMMENT '班级ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_exam_class` (`exam_id`,`class_id`),
  KEY `idx_exam_id` (`exam_id`),
  KEY `idx_class_id` (`class_id`),
  CONSTRAINT `fk_ec_exam` FOREIGN KEY (`exam_id`) REFERENCES `exam` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考试班级关联表';

-- 考试科目表
CREATE TABLE `subject` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `subject_name` varchar(50) NOT NULL COMMENT '科目名称',
  `subject_code` varchar(20) NOT NULL COMMENT '科目代码',
  `description` varchar(255) DEFAULT NULL COMMENT '科目描述',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_subject_name` (`subject_name`),
  UNIQUE KEY `uk_subject_code` (`subject_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考试科目表';

-- 插入基础科目数据
INSERT INTO `subject` (`subject_name`, `subject_code`, `description`) VALUES
('语文', 'CHINESE', '中国语言文学'),
('数学', 'MATH', '数学基础与应用'),
('英语', 'ENGLISH', '英语语言与文化'),
('物理', 'PHYSICS', '物理学基础'),
('化学', 'CHEMISTRY', '化学基础与实验'),
('生物', 'BIOLOGY', '生物学基础'),
('历史', 'HISTORY', '历史与文化'),
('地理', 'GEOGRAPHY', '地理与环境'),
('政治', 'POLITICS', '思想政治'),
('信息技术', 'IT', '计算机与信息技术');

CREATE TABLE `student_score` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `student_id` bigint(20) NOT NULL COMMENT '学生ID',
  `exam_id` bigint(20) DEFAULT NULL COMMENT '考试ID',
  `subject` varchar(20) NOT NULL COMMENT '科目',
  `score` decimal(5,2) NOT NULL COMMENT '成绩',
  `exam_time` date NOT NULL COMMENT '考试时间',
  `exam_type` varchar(20) NOT NULL COMMENT '考试类型(月考/期中/期末)',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_exam_id` (`exam_id`),
  CONSTRAINT `fk_score_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`),
  CONSTRAINT `fk_score_exam` FOREIGN KEY (`exam_id`) REFERENCES `exam` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学生成绩表(关联考试)';
