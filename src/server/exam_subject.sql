-- 创建考试科目关联表
CREATE TABLE `exam_subject` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `exam_id` bigint(20) NOT NULL COMMENT '考试ID',
  `subject_id` bigint(20) NOT NULL COMMENT '科目ID',
  `full_score` decimal(5,2) NOT NULL DEFAULT 100.00 COMMENT '满分',
  `pass_score` decimal(5,2) NOT NULL DEFAULT 60.00 COMMENT '及格分数',
  `weight` decimal(3,2) NOT NULL DEFAULT 1.00 COMMENT '权重',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_exam_subject` (`exam_id`,`subject_id`),
  KEY `idx_exam_id` (`exam_id`),
  KEY `idx_subject_id` (`subject_id`),
  CONSTRAINT `fk_es_exam` FOREIGN KEY (`exam_id`) REFERENCES `exam` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_es_subject` FOREIGN KEY (`subject_id`) REFERENCES `subject` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考试科目关联表';

-- 初始化数据：从考试表的subjects字段填充考试科目关联表
INSERT INTO `exam_subject` (`exam_id`, `subject_id`)
SELECT 
    e.id AS exam_id,
    s.id AS subject_id
FROM 
    `exam` e
CROSS JOIN 
    `subject` s
WHERE 
    FIND_IN_SET(s.subject_name, e.subjects) > 0; 