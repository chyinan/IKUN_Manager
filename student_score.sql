/*
 Navicat Premium Data Transfer

 Source Server         : localhost_3306
 Source Server Type    : MySQL
 Source Server Version : 80040 (8.0.40)
 Source Host           : localhost:3306
 Source Schema         : ikun_db

 Target Server Type    : MySQL
 Target Server Version : 80040 (8.0.40)
 File Encoding         : 65001

 Date: 04/04/2025 01:36:23
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for student_score
-- ----------------------------
DROP TABLE IF EXISTS `student_score`;
CREATE TABLE `student_score`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '成绩ID',
  `student_id` bigint NOT NULL COMMENT '学生ID',
  `exam_id` bigint NOT NULL COMMENT '考试ID',
  `subject` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '科目名称',
  `score` decimal(5, 1) NOT NULL COMMENT '成绩 (允许一位小数)',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_student_exam_subject`(`student_id` ASC, `exam_id` ASC, `subject` ASC) USING BTREE,
  INDEX `idx_student_id`(`student_id` ASC) USING BTREE,
  INDEX `idx_exam_id`(`exam_id` ASC) USING BTREE,
  CONSTRAINT `fk_score_exam` FOREIGN KEY (`exam_id`) REFERENCES `exam` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_score_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 43 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '学生成绩表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of student_score
-- ----------------------------
INSERT INTO `student_score` VALUES (1, 1, 1, '语文', 85.5, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (2, 1, 1, '数学', 92.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (3, 1, 1, '英语', 78.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (4, 1, 1, '物理', 88.5, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (5, 1, 1, '化学', 81.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (6, 1, 1, '生物', 76.5, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (7, 2, 1, '语文', 90.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (8, 2, 1, '数学', 88.5, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (9, 2, 1, '英语', 95.5, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (10, 2, 1, '物理', 75.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (11, 2, 1, '化学', 85.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (12, 2, 1, '生物', 82.5, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (13, 1, 2, '语文', 88.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (14, 1, 2, '数学', 95.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (15, 1, 2, '英语', 82.5, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (16, 1, 2, '物理', 90.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (17, 1, 2, '化学', 84.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (18, 1, 2, '生物', 79.5, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (19, 6, 1, '语文', 75.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (20, 6, 1, '数学', 68.5, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (21, 6, 1, '英语', 80.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (22, 6, 1, '物理', 65.5, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (23, 6, 1, '化学', 72.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (24, 6, 1, '生物', 69.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (25, 7, 3, '语文', 91.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (26, 7, 3, '数学', 94.5, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (27, 7, 3, '英语', 89.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (28, 7, 3, '物理', 92.5, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (29, 7, 3, '化学', 88.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (30, 7, 3, '生物', 85.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (31, 11, 5, '语文', 82.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (32, 11, 5, '数学', 77.5, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (33, 11, 5, '英语', 85.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (34, 11, 5, '物理', 79.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (35, 11, 5, '化学', 74.5, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (36, 11, 5, '生物', 81.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (37, 14, 5, '语文', 93.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (38, 14, 5, '数学', 89.5, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (39, 14, 5, '英语', 96.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (40, 14, 5, '物理', 85.5, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (41, 14, 5, '化学', 90.0, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student_score` VALUES (42, 14, 5, '生物', 88.5, '2025-04-02 19:15:11', '2025-04-02 19:15:11');

SET FOREIGN_KEY_CHECKS = 1;
