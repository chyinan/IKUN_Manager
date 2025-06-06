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

 Date: 06/06/2025 11:13:43
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for carousel_images
-- ----------------------------
DROP TABLE IF EXISTS `carousel_images`;
CREATE TABLE `carousel_images`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '图片存储路径',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '图片标题',
  `link_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '点击跳转链接',
  `display_order` int NULL DEFAULT 0 COMMENT '显示顺序，越小越靠前',
  `is_active` tinyint(1) NULL DEFAULT 1 COMMENT '是否激活 (1=是, 0=否)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '轮播图图片表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of carousel_images
-- ----------------------------
INSERT INTO `carousel_images` VALUES (3, 'carousel/banner-1749001721811-990541769.jpg', '', 'www.baidu.com', 0, 1, '2025-06-04 09:48:41', '2025-06-04 10:53:26');

-- ----------------------------
-- Table structure for class
-- ----------------------------
DROP TABLE IF EXISTS `class`;
CREATE TABLE `class`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '班级ID',
  `class_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '班级名称',
  `teacher` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '班主任',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '班级描述',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_class_name`(`class_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 23 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '班级表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of class
-- ----------------------------
INSERT INTO `class` VALUES (1, '高三(1)班', '王老师', 'test', '2025-04-02 19:15:11', '2025-04-13 00:44:55');
INSERT INTO `class` VALUES (2, '高三(2)班', '李老师', '666', '2025-04-02 19:15:11', '2025-04-20 01:47:30');
INSERT INTO `class` VALUES (3, '高二(1)班', '张老师', NULL, '2025-04-02 19:15:11', '2025-04-02 19:15:11');

-- ----------------------------
-- Table structure for department
-- ----------------------------
DROP TABLE IF EXISTS `department`;
CREATE TABLE `department`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `dept_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '部门名称',
  `manager` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '部门主管',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '部门描述',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_dept_name`(`dept_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 32 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '部门表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of department
-- ----------------------------
INSERT INTO `department` VALUES (1, '技术部', '张三', '负责公司技术研发工作', '2025-01-18 10:47:36', '2025-04-12 23:49:24');
INSERT INTO `department` VALUES (2, '市场部', '李四', '负责市场营销和推广', '2025-01-18 10:47:36', '2025-01-18 10:47:36');
INSERT INTO `department` VALUES (3, '人事部', '王五', '负责人力资源管理', '2025-01-18 10:47:36', '2025-01-18 10:47:36');
INSERT INTO `department` VALUES (4, '财务部', '赵六', '负责公司财务', '2025-01-18 10:47:36', '2025-02-21 21:17:56');

-- ----------------------------
-- Table structure for employee
-- ----------------------------
DROP TABLE IF EXISTS `employee`;
CREATE TABLE `employee`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `emp_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '工号',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '姓名',
  `gender` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '性别',
  `age` int NOT NULL COMMENT '年龄',
  `position` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '职位',
  `dept_id` bigint NOT NULL COMMENT '所属部门ID',
  `salary` decimal(10, 2) NOT NULL COMMENT '薪资',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '状态(在职/离职)',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '联系电话',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '邮箱',
  `join_date` date NOT NULL COMMENT '入职时间',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_emp_id`(`emp_id` ASC) USING BTREE,
  INDEX `idx_dept_id`(`dept_id` ASC) USING BTREE,
  CONSTRAINT `fk_emp_dept` FOREIGN KEY (`dept_id`) REFERENCES `department` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 29 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '员工表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of employee
-- ----------------------------
INSERT INTO `employee` VALUES (1, 'EMP001', '张三', '男', 28, '开发工程师', 1, 15000.00, '在职', '13800138001', 'zhangsan@test.com', '2024-01-01', '2025-01-18 11:36:20', '2025-01-18 11:36:20');
INSERT INTO `employee` VALUES (2, 'EMP002', '李四', '女', 26, '产品经理', 1, 12000.00, '在职', '13800138002', 'lisi@test.com', '2024-01-01', '2025-01-18 11:36:20', '2025-01-18 11:36:20');
INSERT INTO `employee` VALUES (3, 'EMP003', '王五', '男', 33, '销售经理', 2, 10000.00, '离职', '13800138003', 'wangwu@test.com', '2023-12-29', '2025-01-18 11:36:20', '2025-02-19 17:13:09');
INSERT INTO `employee` VALUES (6, 'EMP010', '卢本伟', '女', 18, '斗地主职业选手', 4, 13000.00, '在职', '', '', '2025-02-16', '2025-02-19 17:41:39', '2025-02-25 22:26:56');
INSERT INTO `employee` VALUES (21, 'EMP009', '赵9', '女', 40, '市场专员', 2, 8000.00, '离职', '13700001111', NULL, '2021-08-19', '2025-04-12 21:30:02', '2025-04-12 21:30:02');

-- ----------------------------
-- Table structure for exam
-- ----------------------------
DROP TABLE IF EXISTS `exam`;
CREATE TABLE `exam`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '考试ID',
  `exam_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '考试名称',
  `exam_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '考试类型(月考/期中/期末等)',
  `exam_date` datetime NOT NULL COMMENT '考试日期时间',
  `duration` int NULL DEFAULT NULL COMMENT '考试时长(分钟)',
  `subjects` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '考试科目(逗号分隔)',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '状态(0:未开始, 1:进行中, 2:已结束)',
  `remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_exam_date`(`exam_date` ASC) USING BTREE,
  INDEX `idx_exam_type`(`exam_type` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 17 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '考试表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of exam
-- ----------------------------
INSERT INTO `exam` VALUES (1, '2025年3月高三月考', '月考', '2025-03-15 00:00:00', 60, '语文,数学,英语,物理,化学,生物', 2, NULL, '2025-04-02 19:15:11', '2025-04-20 01:34:58');
INSERT INTO `exam` VALUES (2, '2024年秋季高三期中考试', '期中', '2024-11-10 09:00:00', NULL, '语文,数学,英语,物理,化学,生物', 0, NULL, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `exam` VALUES (3, '2024年秋季高三期末考试', '期末', '2025-01-20 09:00:00', NULL, '语文,数学,英语,物理,化学,生物', 2, NULL, '2025-04-02 19:15:11', '2025-04-20 01:34:52');
INSERT INTO `exam` VALUES (4, '2025年4月高三月考', '月考', '2025-04-15 00:00:00', 160, '语文,数学,英语,物理,化学,生物', 2, 'test', '2025-04-02 19:15:11', '2025-06-06 10:45:30');
INSERT INTO `exam` VALUES (5, '2024年秋季高二期末考试', '期末', '2025-01-18 09:00:00', NULL, '语文,数学,英语,物理,化学,生物', 0, NULL, '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `exam` VALUES (16, '2025年6月期末考试', '期末', '2025-06-07 10:46:11', 793, '', 0, '高考', '2025-06-06 10:46:30', '2025-06-06 10:46:30');

-- ----------------------------
-- Table structure for exam_class_link
-- ----------------------------
DROP TABLE IF EXISTS `exam_class_link`;
CREATE TABLE `exam_class_link`  (
  `exam_id` bigint NOT NULL COMMENT '考试ID',
  `class_id` bigint NOT NULL COMMENT '班级ID',
  PRIMARY KEY (`exam_id`, `class_id`) USING BTREE,
  INDEX `idx_exam_id`(`exam_id` ASC) USING BTREE,
  INDEX `idx_class_id`(`class_id` ASC) USING BTREE,
  CONSTRAINT `fk_ecl_class` FOREIGN KEY (`class_id`) REFERENCES `class` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ecl_exam` FOREIGN KEY (`exam_id`) REFERENCES `exam` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '考试-班级关联表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of exam_class_link
-- ----------------------------

-- ----------------------------
-- Table structure for exam_subject
-- ----------------------------
DROP TABLE IF EXISTS `exam_subject`;
CREATE TABLE `exam_subject`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `exam_id` bigint NOT NULL COMMENT '考试ID',
  `subject_id` bigint NOT NULL COMMENT '科目ID',
  `full_score` decimal(5, 2) NOT NULL DEFAULT 100.00 COMMENT '满分',
  `pass_score` decimal(5, 2) NOT NULL DEFAULT 60.00 COMMENT '及格分数',
  `weight` decimal(3, 2) NOT NULL DEFAULT 1.00 COMMENT '权重',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_exam_subject`(`exam_id` ASC, `subject_id` ASC) USING BTREE,
  INDEX `idx_exam_id`(`exam_id` ASC) USING BTREE,
  INDEX `idx_subject_id`(`subject_id` ASC) USING BTREE,
  CONSTRAINT `fk_es_exam` FOREIGN KEY (`exam_id`) REFERENCES `exam` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_es_subject` FOREIGN KEY (`subject_id`) REFERENCES `subject` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 143 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '考试科目关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of exam_subject
-- ----------------------------
INSERT INTO `exam_subject` VALUES (1, 1, 1, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (2, 1, 3, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (3, 1, 2, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (4, 2, 1, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (5, 2, 2, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (6, 3, 1, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (7, 3, 3, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (8, 3, 4, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (9, 3, 2, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (10, 3, 5, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (11, 4, 1, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (12, 4, 3, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (13, 4, 6, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (14, 4, 4, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (15, 4, 2, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (16, 4, 5, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (17, 5, 1, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (18, 5, 3, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (19, 5, 2, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (44, 16, 4, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (45, 17, 1, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (46, 17, 3, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (47, 17, 6, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (48, 17, 4, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (49, 17, 2, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (50, 17, 5, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (51, 18, 1, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (52, 18, 3, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (53, 18, 6, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (54, 18, 4, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (55, 18, 2, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (56, 18, 5, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (57, 19, 1, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (58, 19, 3, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (59, 19, 6, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (60, 19, 4, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (61, 19, 2, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (62, 19, 5, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (63, 20, 1, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (64, 20, 3, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (65, 20, 6, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (66, 20, 4, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (67, 20, 2, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (68, 20, 5, 100.00, 60.00, 1.00, '2025-03-17 08:42:51');
INSERT INTO `exam_subject` VALUES (128, 21, 1, 100.00, 60.00, 1.00, '2025-03-17 18:33:58');
INSERT INTO `exam_subject` VALUES (129, 21, 2, 100.00, 60.00, 1.00, '2025-03-17 18:33:58');
INSERT INTO `exam_subject` VALUES (130, 21, 3, 100.00, 60.00, 1.00, '2025-03-17 18:33:58');
INSERT INTO `exam_subject` VALUES (131, 21, 4, 100.00, 60.00, 1.00, '2025-03-17 18:33:58');
INSERT INTO `exam_subject` VALUES (132, 21, 5, 100.00, 60.00, 1.00, '2025-03-17 18:33:58');
INSERT INTO `exam_subject` VALUES (133, 21, 6, 100.00, 60.00, 1.00, '2025-03-17 18:33:58');
INSERT INTO `exam_subject` VALUES (134, 1, 4, 100.00, 60.00, 1.00, '2025-03-17 18:33:58');
INSERT INTO `exam_subject` VALUES (135, 1, 5, 100.00, 60.00, 1.00, '2025-03-17 18:33:58');
INSERT INTO `exam_subject` VALUES (136, 1, 6, 100.00, 60.00, 1.00, '2025-03-17 18:33:58');
INSERT INTO `exam_subject` VALUES (137, 23, 1, 100.00, 60.00, 1.00, '2025-03-17 18:33:58');
INSERT INTO `exam_subject` VALUES (138, 23, 2, 100.00, 60.00, 1.00, '2025-03-17 18:33:58');
INSERT INTO `exam_subject` VALUES (139, 23, 3, 100.00, 60.00, 1.00, '2025-03-17 18:33:58');
INSERT INTO `exam_subject` VALUES (140, 23, 4, 100.00, 60.00, 1.00, '2025-03-17 18:33:58');
INSERT INTO `exam_subject` VALUES (141, 23, 5, 100.00, 60.00, 1.00, '2025-03-17 18:33:58');
INSERT INTO `exam_subject` VALUES (142, 23, 6, 100.00, 60.00, 1.00, '2025-03-17 18:33:58');

-- ----------------------------
-- Table structure for student
-- ----------------------------
DROP TABLE IF EXISTS `student`;
CREATE TABLE `student`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '学生ID',
  `student_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '学号',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '姓名',
  `gender` char(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '性别',
  `class_id` bigint NOT NULL COMMENT '所属班级ID',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '联系电话',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '邮箱',
  `user_id` bigint NULL DEFAULT NULL COMMENT '关联用户ID',
  `join_date` date NULL DEFAULT NULL COMMENT '入学时间',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_student_id`(`student_id` ASC) USING BTREE,
  INDEX `idx_class_id`(`class_id` ASC) USING BTREE,
  INDEX `idx_student_user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `fk_student_class` FOREIGN KEY (`class_id`) REFERENCES `class` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_student_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 34 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '学生表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of student
-- ----------------------------
INSERT INTO `student` VALUES (1, 'S2023001', '张伟', '男', 1, '15876627195', '101@qq.com', 8, '2023-09-01', '2025-04-02 19:15:11', '2025-06-04 23:49:05');
INSERT INTO `student` VALUES (2, 'S2023002', '王芳', '女', 1, '2', '2', NULL, '2023-09-01', '2025-04-02 19:15:11', '2025-04-02 19:35:30');
INSERT INTO `student` VALUES (3, 'S2023003', '李娜', '女', 1, '3', '3', NULL, '2023-09-01', '2025-04-02 19:15:11', '2025-04-02 19:35:31');
INSERT INTO `student` VALUES (4, 'S2023004', '刘强', '男', 1, '4', '4', NULL, '2023-09-01', '2025-04-02 19:15:11', '2025-04-02 19:35:32');
INSERT INTO `student` VALUES (5, 'S2023005', '陈浩', '男', 1, '5', '5', NULL, '2023-09-01', '2025-04-02 19:15:11', '2025-04-02 19:35:42');
INSERT INTO `student` VALUES (6, 'S2023011', '赵敏', '女', 2, '13800138001', 'zhangsan@test.com', NULL, '2023-09-01', '2025-04-02 19:15:11', '2025-04-07 09:37:11');
INSERT INTO `student` VALUES (7, 'S2023012', '周杰', '男', 2, '13800138001', 'zhangsan@test.com', NULL, '2023-09-01', '2025-04-02 19:15:11', '2025-04-07 09:39:11');
INSERT INTO `student` VALUES (8, 'S2023013', '吴磊', '男', 2, NULL, NULL, NULL, '2023-09-01', '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student` VALUES (9, 'S2023014', '郑娟', '女', 2, NULL, NULL, NULL, '2023-09-01', '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student` VALUES (10, 'S2023015', '孙悦', '女', 2, NULL, NULL, NULL, '2023-09-01', '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student` VALUES (11, 'S2024001', '马超', '男', 3, NULL, NULL, NULL, '2024-09-01', '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student` VALUES (12, 'S2024002', '关羽', '男', 3, NULL, NULL, NULL, '2024-09-01', '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student` VALUES (13, 'S2024003', '黄月英', '女', 3, NULL, NULL, NULL, '2024-09-01', '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student` VALUES (14, 'S2024004', '孙尚香', '女', 3, NULL, NULL, NULL, '2024-09-01', '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student` VALUES (15, 'S2024005', '诸葛亮', '男', 3, NULL, NULL, NULL, '2024-09-01', '2025-04-02 19:15:11', '2025-04-02 19:15:11');

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
) ENGINE = InnoDB AUTO_INCREMENT = 183 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '学生成绩表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of student_score
-- ----------------------------
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
INSERT INTO `student_score` VALUES (43, 1, 4, '语文', 100.0, '2025-04-04 02:29:11', '2025-04-05 23:58:19');
INSERT INTO `student_score` VALUES (44, 1, 4, '数学', 100.0, '2025-04-04 02:29:11', '2025-04-05 23:57:51');
INSERT INTO `student_score` VALUES (45, 1, 4, '英语', 100.0, '2025-04-04 02:29:11', '2025-04-06 01:17:20');
INSERT INTO `student_score` VALUES (46, 1, 4, '物理', 37.5, '2025-04-04 02:29:11', '2025-06-04 10:58:28');
INSERT INTO `student_score` VALUES (47, 1, 4, '化学', 100.0, '2025-04-04 02:29:11', '2025-04-04 02:29:11');
INSERT INTO `student_score` VALUES (48, 1, 4, '生物', 100.0, '2025-04-04 02:29:11', '2025-04-04 02:29:11');
INSERT INTO `student_score` VALUES (49, 1, 1, '语文', 99.0, '2025-04-04 02:29:57', '2025-04-04 02:31:26');
INSERT INTO `student_score` VALUES (50, 1, 1, '数学', 100.0, '2025-04-04 02:29:57', '2025-04-04 02:29:57');
INSERT INTO `student_score` VALUES (51, 1, 1, '英语', 66.0, '2025-04-04 02:29:57', '2025-04-04 02:31:26');
INSERT INTO `student_score` VALUES (52, 1, 1, '物理', 77.0, '2025-04-04 02:29:57', '2025-04-04 02:31:26');
INSERT INTO `student_score` VALUES (53, 1, 1, '化学', 100.0, '2025-04-04 02:29:57', '2025-04-04 02:29:57');
INSERT INTO `student_score` VALUES (54, 1, 1, '生物', 88.0, '2025-04-04 02:29:57', '2025-04-04 02:31:26');
INSERT INTO `student_score` VALUES (61, 6, 2, '语文', 0.0, '2025-04-04 16:23:19', '2025-04-04 16:23:19');
INSERT INTO `student_score` VALUES (62, 6, 2, '数学', 0.0, '2025-04-04 16:23:19', '2025-04-04 16:23:19');
INSERT INTO `student_score` VALUES (63, 6, 2, '英语', 0.0, '2025-04-04 16:23:19', '2025-04-04 16:23:19');
INSERT INTO `student_score` VALUES (64, 6, 2, '物理', 0.0, '2025-04-04 16:23:19', '2025-04-04 16:23:19');
INSERT INTO `student_score` VALUES (65, 6, 2, '化学', 0.0, '2025-04-04 16:23:19', '2025-04-04 16:23:19');
INSERT INTO `student_score` VALUES (66, 6, 2, '生物', 100.0, '2025-04-04 16:23:19', '2025-04-04 16:23:19');
INSERT INTO `student_score` VALUES (160, 2, 4, '语文', 68.0, '2025-06-05 10:26:03', '2025-06-05 10:26:03');
INSERT INTO `student_score` VALUES (161, 2, 4, '数学', 76.0, '2025-06-05 10:26:03', '2025-06-05 10:26:03');
INSERT INTO `student_score` VALUES (162, 2, 4, '英语', 87.0, '2025-06-05 10:26:03', '2025-06-05 10:26:03');
INSERT INTO `student_score` VALUES (163, 2, 4, '物理', 78.0, '2025-06-05 10:26:03', '2025-06-05 10:26:03');
INSERT INTO `student_score` VALUES (164, 2, 4, '化学', 76.0, '2025-06-05 10:26:03', '2025-06-05 10:26:03');
INSERT INTO `student_score` VALUES (165, 2, 4, '生物', 90.0, '2025-06-05 10:26:03', '2025-06-05 10:26:03');
INSERT INTO `student_score` VALUES (166, 3, 4, '语文', 76.0, '2025-06-05 10:26:22', '2025-06-05 10:26:22');
INSERT INTO `student_score` VALUES (167, 3, 4, '数学', 64.0, '2025-06-05 10:26:22', '2025-06-05 10:26:22');
INSERT INTO `student_score` VALUES (168, 3, 4, '物理', 86.0, '2025-06-05 10:26:22', '2025-06-05 10:26:22');
INSERT INTO `student_score` VALUES (169, 3, 4, '化学', 79.0, '2025-06-05 10:26:22', '2025-06-05 10:26:22');
INSERT INTO `student_score` VALUES (170, 3, 4, '生物', 89.0, '2025-06-05 10:26:22', '2025-06-05 10:26:22');
INSERT INTO `student_score` VALUES (171, 6, 4, '语文', 65.0, '2025-06-05 10:26:41', '2025-06-05 10:26:41');
INSERT INTO `student_score` VALUES (172, 6, 4, '数学', 66.0, '2025-06-05 10:26:41', '2025-06-05 10:26:41');
INSERT INTO `student_score` VALUES (173, 6, 4, '英语', 90.0, '2025-06-05 10:26:41', '2025-06-05 10:26:41');
INSERT INTO `student_score` VALUES (174, 6, 4, '物理', 69.0, '2025-06-05 10:26:41', '2025-06-05 10:26:41');
INSERT INTO `student_score` VALUES (175, 6, 4, '化学', 98.0, '2025-06-05 10:26:41', '2025-06-05 10:26:41');
INSERT INTO `student_score` VALUES (176, 6, 4, '生物', 75.0, '2025-06-05 10:26:41', '2025-06-05 10:26:41');
INSERT INTO `student_score` VALUES (177, 3, 1, '语文', 98.0, '2025-06-05 10:27:08', '2025-06-05 10:27:08');
INSERT INTO `student_score` VALUES (178, 3, 1, '数学', 77.0, '2025-06-05 10:27:08', '2025-06-05 10:27:08');
INSERT INTO `student_score` VALUES (179, 3, 1, '英语', 66.0, '2025-06-05 10:27:08', '2025-06-05 10:27:08');
INSERT INTO `student_score` VALUES (180, 3, 1, '物理', 88.0, '2025-06-05 10:27:08', '2025-06-05 10:27:08');
INSERT INTO `student_score` VALUES (181, 3, 1, '化学', 97.0, '2025-06-05 10:27:08', '2025-06-05 10:27:08');
INSERT INTO `student_score` VALUES (182, 3, 1, '生物', 76.0, '2025-06-05 10:27:08', '2025-06-05 10:27:08');

-- ----------------------------
-- Table structure for subject
-- ----------------------------
DROP TABLE IF EXISTS `subject`;
CREATE TABLE `subject`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '科目ID',
  `subject_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '科目名称',
  `subject_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '科目代码',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_subject_name`(`subject_name` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '科目表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of subject
-- ----------------------------
INSERT INTO `subject` VALUES (1, '语文', 'CHINESE', '2025-04-02 19:15:10', '2025-04-02 19:15:10');
INSERT INTO `subject` VALUES (2, '数学', 'MATH', '2025-04-02 19:15:10', '2025-04-02 19:15:10');
INSERT INTO `subject` VALUES (3, '英语', 'ENGLISH', '2025-04-02 19:15:10', '2025-04-02 19:15:10');
INSERT INTO `subject` VALUES (4, '物理', 'PHYSICS', '2025-04-02 19:15:10', '2025-04-02 19:15:10');
INSERT INTO `subject` VALUES (5, '化学', 'CHEMISTRY', '2025-04-02 19:15:10', '2025-04-02 19:15:10');
INSERT INTO `subject` VALUES (6, '生物', 'BIOLOGY', '2025-04-02 19:15:10', '2025-04-02 19:15:10');

-- ----------------------------
-- Table structure for system_config
-- ----------------------------
DROP TABLE IF EXISTS `system_config`;
CREATE TABLE `system_config`  (
  `config_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '配置键',
  `config_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '配置值',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '描述',
  `update_time` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`config_key`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '系统配置表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of system_config
-- ----------------------------
INSERT INTO `system_config` VALUES ('carouselInterval', '2500', 'Configuration for carouselInterval', '2025-06-04 11:18:17');
INSERT INTO `system_config` VALUES ('employeeIdRegex', '^EMP.{3}$', '员工号正则表达式', '2025-04-28 22:31:22');
INSERT INTO `system_config` VALUES ('logRetentionDays', '3', '日志保留天数 (0表示不自动删除)', '2025-04-28 22:31:22');
INSERT INTO `system_config` VALUES ('studentIdRegex', '^S\\\\d{7}$', '学号正则表达式', '2025-04-28 22:31:22');

-- ----------------------------
-- Table structure for system_log
-- ----------------------------
DROP TABLE IF EXISTS `system_log`;
CREATE TABLE `system_log`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '日志类型(system/database/vue)',
  `operation` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '操作类型',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '日志内容',
  `operator` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '操作人',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_create_time`(`create_time` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2888 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '系统日志表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of system_log
-- ----------------------------
INSERT INTO `system_log` VALUES (2665, 'system', 'connect', 'connect 客户端连接: 9CQSLdKRll9dwViBAAAB', 'System', '2025-06-02 19:35:07');
INSERT INTO `system_log` VALUES (2666, 'system', 'disconnect', 'disconnect 客户端断开: 9CQSLdKRll9dwViBAAAB, 原因: client namespace disconnect', 'System', '2025-06-02 19:35:07');
INSERT INTO `system_log` VALUES (2667, 'system', 'connect', 'connect 客户端连接: feobi_90P4F7BAq_AAAD', 'System', '2025-06-02 19:41:07');
INSERT INTO `system_log` VALUES (2668, 'system', 'disconnect', 'disconnect 客户端断开: feobi_90P4F7BAq_AAAD, 原因: client namespace disconnect', 'System', '2025-06-02 19:41:08');
INSERT INTO `system_log` VALUES (2669, 'system', 'connect', 'connect 客户端连接: VRSlIgVOVxu3y92KAAAB', 'System', '2025-06-02 21:59:36');
INSERT INTO `system_log` VALUES (2670, 'system', 'disconnect', 'disconnect 客户端断开: VRSlIgVOVxu3y92KAAAB, 原因: client namespace disconnect', 'System', '2025-06-02 21:59:37');
INSERT INTO `system_log` VALUES (2671, 'system', 'connect', 'connect 客户端连接: 1hW2oxuBHIHx-3f2AAAD', 'System', '2025-06-02 22:12:58');
INSERT INTO `system_log` VALUES (2672, 'system', 'disconnect', 'disconnect 客户端断开: 1hW2oxuBHIHx-3f2AAAD, 原因: client namespace disconnect', 'System', '2025-06-02 22:13:00');
INSERT INTO `system_log` VALUES (2673, 'system', 'connect', 'connect 客户端连接: 12xSnTo4RB55ZIWRAAAB', 'System', '2025-06-03 12:45:25');
INSERT INTO `system_log` VALUES (2674, 'system', 'disconnect', 'disconnect 客户端断开: 12xSnTo4RB55ZIWRAAAB, 原因: client namespace disconnect', 'System', '2025-06-03 12:45:25');
INSERT INTO `system_log` VALUES (2675, 'system', 'connect', 'connect 客户端连接: Y2LaXNIlc_k8pqwzAAAD', 'System', '2025-06-03 12:45:58');
INSERT INTO `system_log` VALUES (2676, 'system', 'disconnect', 'disconnect 客户端断开: Y2LaXNIlc_k8pqwzAAAD, 原因: client namespace disconnect', 'System', '2025-06-03 12:46:02');
INSERT INTO `system_log` VALUES (2677, 'system', 'connect', 'connect 客户端连接: oYUiOaco_EyOsQ1fAAAF', 'System', '2025-06-03 12:46:13');
INSERT INTO `system_log` VALUES (2678, 'system', 'disconnect', 'disconnect 客户端断开: oYUiOaco_EyOsQ1fAAAF, 原因: client namespace disconnect', 'System', '2025-06-03 12:46:14');
INSERT INTO `system_log` VALUES (2679, 'system', 'connect', 'connect 客户端连接: JZIeZfUQ9IsMVmL6AAAH', 'System', '2025-06-03 12:57:09');
INSERT INTO `system_log` VALUES (2680, 'system', 'disconnect', 'disconnect 客户端断开: JZIeZfUQ9IsMVmL6AAAH, 原因: client namespace disconnect', 'System', '2025-06-03 12:57:10');
INSERT INTO `system_log` VALUES (2681, 'system', 'connect', 'connect 客户端连接: 1hsbcwZY3cC-t1tbAAAJ', 'System', '2025-06-03 13:00:04');
INSERT INTO `system_log` VALUES (2682, 'system', 'disconnect', 'disconnect 客户端断开: 1hsbcwZY3cC-t1tbAAAJ, 原因: client namespace disconnect', 'System', '2025-06-03 13:00:04');
INSERT INTO `system_log` VALUES (2683, 'system', 'connect', 'connect 客户端连接: _yo7qqjcWJX0LDcBAAAL', 'System', '2025-06-03 13:04:59');
INSERT INTO `system_log` VALUES (2684, 'system', 'disconnect', 'disconnect 客户端断开: _yo7qqjcWJX0LDcBAAAL, 原因: client namespace disconnect', 'System', '2025-06-03 13:04:59');
INSERT INTO `system_log` VALUES (2685, 'system', 'connect', 'connect 客户端连接: Dwh-w0ASZuFye9UxAAAN', 'System', '2025-06-03 13:05:00');
INSERT INTO `system_log` VALUES (2686, 'system', 'disconnect', 'disconnect 客户端断开: Dwh-w0ASZuFye9UxAAAN, 原因: client namespace disconnect', 'System', '2025-06-03 13:05:02');
INSERT INTO `system_log` VALUES (2687, 'system', 'connect', 'connect 客户端连接: eV0m8C6jr56ubDs7AAAP', 'System', '2025-06-03 13:05:21');
INSERT INTO `system_log` VALUES (2688, 'system', 'disconnect', 'disconnect 客户端断开: eV0m8C6jr56ubDs7AAAP, 原因: client namespace disconnect', 'System', '2025-06-03 13:05:21');
INSERT INTO `system_log` VALUES (2689, 'system', 'connect', 'connect 客户端连接: 3WyShT3FG0BeujbWAAAR', 'System', '2025-06-03 13:09:25');
INSERT INTO `system_log` VALUES (2690, 'system', 'disconnect', 'disconnect 客户端断开: 3WyShT3FG0BeujbWAAAR, 原因: client namespace disconnect', 'System', '2025-06-03 13:09:26');
INSERT INTO `system_log` VALUES (2691, 'system', 'connect', 'connect 客户端连接: fx_BiZi2rPQ4Ucc5AAAT', 'System', '2025-06-03 13:09:50');
INSERT INTO `system_log` VALUES (2692, 'system', 'disconnect', 'disconnect 客户端断开: fx_BiZi2rPQ4Ucc5AAAT, 原因: client namespace disconnect', 'System', '2025-06-03 13:09:51');
INSERT INTO `system_log` VALUES (2693, 'system', 'connect', 'connect 客户端连接: xsmoFJFUzFaRt6iPAAAV', 'System', '2025-06-03 13:17:43');
INSERT INTO `system_log` VALUES (2694, 'system', 'disconnect', 'disconnect 客户端断开: xsmoFJFUzFaRt6iPAAAV, 原因: client namespace disconnect', 'System', '2025-06-03 13:17:43');
INSERT INTO `system_log` VALUES (2695, 'system', 'connect', 'connect 客户端连接: 6tXhlmemKVyH25YKAAAB', 'System', '2025-06-03 15:04:36');
INSERT INTO `system_log` VALUES (2696, 'system', 'disconnect', 'disconnect 客户端断开: 6tXhlmemKVyH25YKAAAB, 原因: client namespace disconnect', 'System', '2025-06-03 15:04:37');
INSERT INTO `system_log` VALUES (2697, 'system', 'connect', 'connect 客户端连接: e85U0i-7w4GA7nqwAAAD', 'System', '2025-06-03 15:07:53');
INSERT INTO `system_log` VALUES (2698, 'system', 'disconnect', 'disconnect 客户端断开: e85U0i-7w4GA7nqwAAAD, 原因: client namespace disconnect', 'System', '2025-06-03 15:07:54');
INSERT INTO `system_log` VALUES (2699, 'system', 'connect', 'connect 客户端连接: fgMcrnqUMBVXOKvUAAAF', 'System', '2025-06-03 16:16:08');
INSERT INTO `system_log` VALUES (2700, 'system', 'disconnect', 'disconnect 客户端断开: fgMcrnqUMBVXOKvUAAAF, 原因: client namespace disconnect', 'System', '2025-06-03 16:16:09');
INSERT INTO `system_log` VALUES (2701, 'system', 'connect', 'connect 客户端连接: l4_VOUbPTc-pqtnvAAAH', 'System', '2025-06-03 16:16:33');
INSERT INTO `system_log` VALUES (2702, 'system', 'disconnect', 'disconnect 客户端断开: l4_VOUbPTc-pqtnvAAAH, 原因: client namespace disconnect', 'System', '2025-06-03 16:16:34');
INSERT INTO `system_log` VALUES (2703, 'system', 'connect', 'connect 客户端连接: 4pXlLj9zqF7gC4XnAAAJ', 'System', '2025-06-03 16:16:38');
INSERT INTO `system_log` VALUES (2704, 'system', 'disconnect', 'disconnect 客户端断开: 4pXlLj9zqF7gC4XnAAAJ, 原因: client namespace disconnect', 'System', '2025-06-03 16:16:49');
INSERT INTO `system_log` VALUES (2705, 'system', 'connect', 'connect 客户端连接: H-sMXkhLUq-y4ykVAAAL', 'System', '2025-06-03 16:16:51');
INSERT INTO `system_log` VALUES (2706, 'system', 'disconnect', 'disconnect 客户端断开: H-sMXkhLUq-y4ykVAAAL, 原因: client namespace disconnect', 'System', '2025-06-03 16:16:51');
INSERT INTO `system_log` VALUES (2707, 'system', 'connect', 'connect 客户端连接: wM-MLIfMQg8cqps1AAAB', 'System', '2025-06-03 20:10:23');
INSERT INTO `system_log` VALUES (2708, 'system', 'disconnect', 'disconnect 客户端断开: wM-MLIfMQg8cqps1AAAB, 原因: client namespace disconnect', 'System', '2025-06-03 20:10:24');
INSERT INTO `system_log` VALUES (2709, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 20:15:57');
INSERT INTO `system_log` VALUES (2710, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 20:15:59');
INSERT INTO `system_log` VALUES (2711, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 20:15:59');
INSERT INTO `system_log` VALUES (2712, 'system', 'connect', 'connect 客户端连接: 8dnbW-8bgWiO4kByAAAD', 'System', '2025-06-03 20:16:05');
INSERT INTO `system_log` VALUES (2713, 'system', 'disconnect', 'disconnect 客户端断开: 8dnbW-8bgWiO4kByAAAD, 原因: client namespace disconnect', 'System', '2025-06-03 20:16:06');
INSERT INTO `system_log` VALUES (2714, 'system', 'connect', 'connect 客户端连接: mY87xaZ0FJ0y9JCRAAAF', 'System', '2025-06-03 20:16:11');
INSERT INTO `system_log` VALUES (2715, 'system', 'disconnect', 'disconnect 客户端断开: mY87xaZ0FJ0y9JCRAAAF, 原因: client namespace disconnect', 'System', '2025-06-03 20:16:11');
INSERT INTO `system_log` VALUES (2716, 'system', 'connect', 'connect 客户端连接: 5yjkDMTxpO7hvDXJAAAH', 'System', '2025-06-03 20:16:15');
INSERT INTO `system_log` VALUES (2717, 'system', 'disconnect', 'disconnect 客户端断开: 5yjkDMTxpO7hvDXJAAAH, 原因: client namespace disconnect', 'System', '2025-06-03 20:16:16');
INSERT INTO `system_log` VALUES (2718, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 20:16:19');
INSERT INTO `system_log` VALUES (2719, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 20:16:27');
INSERT INTO `system_log` VALUES (2720, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 20:16:31');
INSERT INTO `system_log` VALUES (2721, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 20:16:32');
INSERT INTO `system_log` VALUES (2722, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 20:16:32');
INSERT INTO `system_log` VALUES (2723, 'system', 'connect', 'connect 客户端连接: yyK-_KQY6TMtksO8AAAJ', 'System', '2025-06-03 20:16:38');
INSERT INTO `system_log` VALUES (2724, 'system', 'disconnect', 'disconnect 客户端断开: yyK-_KQY6TMtksO8AAAJ, 原因: client namespace disconnect', 'System', '2025-06-03 20:16:39');
INSERT INTO `system_log` VALUES (2725, 'system', 'connect', 'connect 客户端连接: qXQdOzhlNQ_vlMDTAAAL', 'System', '2025-06-03 20:16:42');
INSERT INTO `system_log` VALUES (2726, 'system', 'disconnect', 'disconnect 客户端断开: qXQdOzhlNQ_vlMDTAAAL, 原因: transport close', 'System', '2025-06-03 20:18:57');
INSERT INTO `system_log` VALUES (2727, 'system', 'connect', 'connect 客户端连接: MQi3o9vubIjiFUynAAAN', 'System', '2025-06-03 20:18:59');
INSERT INTO `system_log` VALUES (2728, 'system', 'disconnect', 'disconnect 客户端断开: MQi3o9vubIjiFUynAAAN, 原因: client namespace disconnect', 'System', '2025-06-03 20:30:41');
INSERT INTO `system_log` VALUES (2729, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 20:39:20');
INSERT INTO `system_log` VALUES (2730, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 20:39:21');
INSERT INTO `system_log` VALUES (2731, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 21:04:53');
INSERT INTO `system_log` VALUES (2732, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 21:04:55');
INSERT INTO `system_log` VALUES (2733, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 21:05:03');
INSERT INTO `system_log` VALUES (2734, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 21:08:51');
INSERT INTO `system_log` VALUES (2735, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 21:08:56');
INSERT INTO `system_log` VALUES (2736, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 21:12:35');
INSERT INTO `system_log` VALUES (2737, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 21:17:00');
INSERT INTO `system_log` VALUES (2738, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 21:17:12');
INSERT INTO `system_log` VALUES (2739, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 21:23:35');
INSERT INTO `system_log` VALUES (2740, 'system', 'connect', 'connect 客户端连接: VTKYYtqwqzmNtrDcAAAB', 'System', '2025-06-03 21:23:38');
INSERT INTO `system_log` VALUES (2741, 'system', 'disconnect', 'disconnect 客户端断开: VTKYYtqwqzmNtrDcAAAB, 原因: client namespace disconnect', 'System', '2025-06-03 21:23:39');
INSERT INTO `system_log` VALUES (2742, 'system', 'connect', 'connect 客户端连接: TdybAt4ccuz4L3huAAAD', 'System', '2025-06-03 21:23:40');
INSERT INTO `system_log` VALUES (2743, 'system', 'disconnect', 'disconnect 客户端断开: TdybAt4ccuz4L3huAAAD, 原因: client namespace disconnect', 'System', '2025-06-03 21:23:40');
INSERT INTO `system_log` VALUES (2744, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 21:23:43');
INSERT INTO `system_log` VALUES (2745, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 21:23:52');
INSERT INTO `system_log` VALUES (2746, 'system', 'connect', 'connect 客户端连接: JLx2SfqaI5gMq-y_AAAF', 'System', '2025-06-03 21:23:54');
INSERT INTO `system_log` VALUES (2747, 'system', 'disconnect', 'disconnect 客户端断开: JLx2SfqaI5gMq-y_AAAF, 原因: client namespace disconnect', 'System', '2025-06-03 21:23:56');
INSERT INTO `system_log` VALUES (2748, 'auth', '登录成功', '登录成功 用户 \'chyinan\' (角色: student) 登录成功。', 'chyinan', '2025-06-03 21:27:25');
INSERT INTO `system_log` VALUES (2749, 'auth', '登录成功', '登录成功 用户 \'test\' (角色: student) 登录成功。', 'test', '2025-06-03 21:27:37');
INSERT INTO `system_log` VALUES (2750, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-03 21:27:44');
INSERT INTO `system_log` VALUES (2751, 'system', 'connect', 'connect 客户端连接: bODq0sQmKcfygOB0AAAH', 'System', '2025-06-03 21:28:26');
INSERT INTO `system_log` VALUES (2752, 'system', 'disconnect', 'disconnect 客户端断开: bODq0sQmKcfygOB0AAAH, 原因: client namespace disconnect', 'System', '2025-06-03 21:28:27');
INSERT INTO `system_log` VALUES (2753, 'auth', '登录成功', '登录成功 用户 \'chyinan\' (角色: student) 登录成功。', 'chyinan', '2025-06-03 21:41:21');
INSERT INTO `system_log` VALUES (2754, 'system', 'connect', 'connect 客户端连接: Fmpi2LBh_xaQilp8AAAB', 'System', '2025-06-03 23:31:52');
INSERT INTO `system_log` VALUES (2755, 'system', 'disconnect', 'disconnect 客户端断开: Fmpi2LBh_xaQilp8AAAB, 原因: client namespace disconnect', 'System', '2025-06-03 23:31:52');
INSERT INTO `system_log` VALUES (2756, 'system', 'connect', 'connect 客户端连接: c3F8D-UheWYVJnBGAAAD', 'System', '2025-06-03 23:32:04');
INSERT INTO `system_log` VALUES (2757, 'system', 'disconnect', 'disconnect 客户端断开: c3F8D-UheWYVJnBGAAAD, 原因: client namespace disconnect', 'System', '2025-06-03 23:32:05');
INSERT INTO `system_log` VALUES (2758, 'system', 'connect', 'connect 客户端连接: 0dnFCuE8ST-ryscAAAAF', 'System', '2025-06-03 23:51:09');
INSERT INTO `system_log` VALUES (2759, 'system', 'disconnect', 'disconnect 客户端断开: 0dnFCuE8ST-ryscAAAAF, 原因: client namespace disconnect', 'System', '2025-06-03 23:51:10');
INSERT INTO `system_log` VALUES (2760, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-04 00:51:27');
INSERT INTO `system_log` VALUES (2761, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-04 08:33:16');
INSERT INTO `system_log` VALUES (2762, 'system', 'connect', 'connect 客户端连接: bIQLDyO0JrIxplBaAAAB', 'System', '2025-06-04 08:33:31');
INSERT INTO `system_log` VALUES (2763, 'system', 'disconnect', 'disconnect 客户端断开: bIQLDyO0JrIxplBaAAAB, 原因: client namespace disconnect', 'System', '2025-06-04 08:33:38');
INSERT INTO `system_log` VALUES (2764, 'system', 'connect', 'connect 客户端连接: oy2J-WduyC7ZiJGRAAAD', 'System', '2025-06-04 08:34:13');
INSERT INTO `system_log` VALUES (2765, 'system', 'disconnect', 'disconnect 客户端断开: oy2J-WduyC7ZiJGRAAAD, 原因: client namespace disconnect', 'System', '2025-06-04 08:34:14');
INSERT INTO `system_log` VALUES (2766, 'management', '添加轮播图', '添加轮播图 添加了新的轮播图: ID=2, 文件名=\'banner-1749001699777-319216274.jpg\', 标题=\'学校\'', 'admin', '2025-06-04 09:48:19');
INSERT INTO `system_log` VALUES (2767, 'management', '删除轮播图', '删除轮播图 删除了轮播图: ID=2, 文件名=\'banner-1749001699777-319216274.jpg\', 标题=\'学校\'', 'admin', '2025-06-04 09:48:23');
INSERT INTO `system_log` VALUES (2768, 'management', '添加轮播图', '添加轮播图 添加了新的轮播图: ID=3, 文件名=\'banner-1749001721811-990541769.jpg\', 标题=\'学校\'', 'admin', '2025-06-04 09:48:41');
INSERT INTO `system_log` VALUES (2769, 'management', '更新轮播图', '更新轮播图 更新了轮播图: ID=3, 更新内容: {\"title\":\"学校1\",\"link_url\":\"www.baidu.com\",\"display_order\":0,\"is_active\":1}', 'admin', '2025-06-04 09:51:29');
INSERT INTO `system_log` VALUES (2770, 'auth', '登录成功', '登录成功 用户 \'chyinan\' (角色: student) 登录成功。', 'chyinan', '2025-06-04 09:57:03');
INSERT INTO `system_log` VALUES (2771, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-04 10:53:14');
INSERT INTO `system_log` VALUES (2772, 'management', '更新轮播图', '更新轮播图 更新了轮播图: ID=3, 更新内容: {\"title\":\"\",\"link_url\":\"www.baidu.com\",\"display_order\":0,\"is_active\":1}', 'admin', '2025-06-04 10:53:26');
INSERT INTO `system_log` VALUES (2773, 'auth', '登录成功', '登录成功 用户 \'chyinan\' (角色: student) 登录成功。', 'chyinan', '2025-06-04 10:53:35');
INSERT INTO `system_log` VALUES (2774, 'auth', '登录成功', '登录成功 用户 \'chyinan\' (角色: student) 登录成功。', 'chyinan', '2025-06-04 10:56:46');
INSERT INTO `system_log` VALUES (2775, 'system', 'connect', 'connect 客户端连接: 4qIJ7Sm0cFEXDtxIAAAB', 'System', '2025-06-04 10:57:13');
INSERT INTO `system_log` VALUES (2776, 'system', 'disconnect', 'disconnect 客户端断开: 4qIJ7Sm0cFEXDtxIAAAB, 原因: client namespace disconnect', 'System', '2025-06-04 10:57:14');
INSERT INTO `system_log` VALUES (2777, 'auth', '登录成功', '登录成功 用户 \'chyinan\' (角色: student) 登录成功。', 'chyinan', '2025-06-04 10:57:18');
INSERT INTO `system_log` VALUES (2778, 'database', '保存/更新成绩', '保存/更新成绩 admin 保存/更新了学生 \"张伟\" (ID: 1) 在考试 \"2025年4月高三月考\" (ID: 4) 的 6 门科目成绩.', 'admin', '2025-06-04 10:58:08');
INSERT INTO `system_log` VALUES (2779, 'database', '保存/更新成绩', '保存/更新成绩 admin 保存/更新了学生 \"张伟\" (ID: 1) 在考试 \"2025年4月高三月考\" (ID: 4) 的 6 门科目成绩.', 'admin', '2025-06-04 10:58:13');
INSERT INTO `system_log` VALUES (2780, 'database', '保存/更新成绩', '保存/更新成绩 admin 保存/更新了学生 \"张伟\" (ID: 1) 在考试 \"2025年4月高三月考\" (ID: 4) 的 6 门科目成绩.', 'admin', '2025-06-04 10:58:16');
INSERT INTO `system_log` VALUES (2781, 'database', '保存/更新成绩', '保存/更新成绩 admin 保存/更新了学生 \"张伟\" (ID: 1) 在考试 \"2025年4月高三月考\" (ID: 4) 的 6 门科目成绩.', 'admin', '2025-06-04 10:58:21');
INSERT INTO `system_log` VALUES (2782, 'database', '保存/更新成绩', '保存/更新成绩 admin 保存/更新了学生 \"张伟\" (ID: 1) 在考试 \"2025年4月高三月考\" (ID: 4) 的 6 门科目成绩.', 'admin', '2025-06-04 10:58:28');
INSERT INTO `system_log` VALUES (2783, 'management', '添加轮播图', '添加轮播图 添加了新的轮播图: ID=4, 文件名=\'logo-1749005984943-973906139.png\', 标题=\'\'', 'admin', '2025-06-04 10:59:44');
INSERT INTO `system_log` VALUES (2784, 'management', '删除轮播图', '删除轮播图 删除了轮播图: ID=4, 文件名=\'logo-1749005984943-973906139.png\', 标题=\'\'', 'admin', '2025-06-04 11:00:16');
INSERT INTO `system_log` VALUES (2785, 'management', '添加轮播图', '添加轮播图 添加了新的轮播图: ID=5, 文件名=\'QQ20250413-205039-1749006085268-712866392.png\', 标题=\'\'', 'admin', '2025-06-04 11:01:25');
INSERT INTO `system_log` VALUES (2786, 'management', '更新轮播图', '更新轮播图 更新了轮播图: ID=5, 更新内容: {\"title\":\"\",\"link_url\":\"\",\"display_order\":1,\"is_active\":1}', 'admin', '2025-06-04 11:01:28');
INSERT INTO `system_log` VALUES (2787, 'system', 'connect', 'connect 客户端连接: LaHAObNoaOyune_eAAAD', 'System', '2025-06-04 11:04:39');
INSERT INTO `system_log` VALUES (2788, 'system', 'disconnect', 'disconnect 客户端断开: LaHAObNoaOyune_eAAAD, 原因: client namespace disconnect', 'System', '2025-06-04 11:04:40');
INSERT INTO `system_log` VALUES (2789, 'system', 'connect', 'connect 客户端连接: Ru2YJfMwISxYx1JdAAAF', 'System', '2025-06-04 11:04:41');
INSERT INTO `system_log` VALUES (2790, 'system', 'disconnect', 'disconnect 客户端断开: Ru2YJfMwISxYx1JdAAAF, 原因: transport close', 'System', '2025-06-04 11:05:10');
INSERT INTO `system_log` VALUES (2791, 'system', 'connect', 'connect 客户端连接: jAeMOOMxy92TiVBfAAAH', 'System', '2025-06-04 11:05:13');
INSERT INTO `system_log` VALUES (2792, 'system', 'disconnect', 'disconnect 客户端断开: jAeMOOMxy92TiVBfAAAH, 原因: client namespace disconnect', 'System', '2025-06-04 11:06:55');
INSERT INTO `system_log` VALUES (2793, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-04 11:07:13');
INSERT INTO `system_log` VALUES (2794, 'auth', '登录成功', '登录成功 用户 \'chyinan\' (角色: student) 登录成功。', 'chyinan', '2025-06-04 11:11:26');
INSERT INTO `system_log` VALUES (2795, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-04 11:11:46');
INSERT INTO `system_log` VALUES (2796, 'system', 'connect', 'connect 客户端连接: 6rRtE0GTW8aZYZbWAAAB', 'System', '2025-06-04 11:16:22');
INSERT INTO `system_log` VALUES (2797, 'system', 'disconnect', 'disconnect 客户端断开: 6rRtE0GTW8aZYZbWAAAB, 原因: client namespace disconnect', 'System', '2025-06-04 11:16:23');
INSERT INTO `system_log` VALUES (2798, 'system', 'connect', 'connect 客户端连接: r2ZFqjFPvFBQAxV2AAAD', 'System', '2025-06-04 11:16:52');
INSERT INTO `system_log` VALUES (2799, 'system', 'disconnect', 'disconnect 客户端断开: r2ZFqjFPvFBQAxV2AAAD, 原因: client namespace disconnect', 'System', '2025-06-04 11:16:55');
INSERT INTO `system_log` VALUES (2800, 'system', 'connect', 'connect 客户端连接: 2TA8brb4tgDezoMgAAAF', 'System', '2025-06-04 11:18:55');
INSERT INTO `system_log` VALUES (2801, 'system', 'disconnect', 'disconnect 客户端断开: 2TA8brb4tgDezoMgAAAF, 原因: client namespace disconnect', 'System', '2025-06-04 11:18:56');
INSERT INTO `system_log` VALUES (2802, 'auth', '登录成功', '登录成功 用户 \'chyinan\' (角色: student) 登录成功。', 'chyinan', '2025-06-04 11:19:23');
INSERT INTO `system_log` VALUES (2803, 'auth', '登录成功', '登录成功 用户 \'chyinan\' (角色: student) 登录成功。', 'chyinan', '2025-06-04 11:54:06');
INSERT INTO `system_log` VALUES (2804, 'auth', '登录成功', '登录成功 用户 \'admin\' (角色: admin) 登录成功。', 'admin', '2025-06-04 14:03:55');
INSERT INTO `system_log` VALUES (2805, 'auth', '登录成功', '登录成功 用户 \'chyinan\' (角色: student) 登录成功。', 'chyinan', '2025-06-04 14:04:04');
INSERT INTO `system_log` VALUES (2806, 'auth', '登录成功', '登录成功 用户 \'chyinan\' (角色: student) 登录成功。', 'chyinan', '2025-06-04 14:10:09');
INSERT INTO `system_log` VALUES (2807, 'auth', '登录成功', '登录成功 用户 \'chyinan\' (角色: student) 登录成功。', 'chyinan', '2025-06-04 14:10:12');
INSERT INTO `system_log` VALUES (2808, 'auth', '登录成功', '登录成功 用户 \'chyinan\' (角色: student) 登录成功。', 'chyinan', '2025-06-04 14:10:22');
INSERT INTO `system_log` VALUES (2809, 'system', 'connect', 'connect 客户端连接: Cu_lYvqUysahQKIDAAAB', 'System', '2025-06-04 15:03:44');
INSERT INTO `system_log` VALUES (2810, 'system', 'disconnect', 'disconnect 客户端断开: Cu_lYvqUysahQKIDAAAB, 原因: client namespace disconnect', 'System', '2025-06-04 15:03:45');
INSERT INTO `system_log` VALUES (2811, 'auth', '登录成功', '登录成功 用户 \'chyinan\' (角色: student) 登录成功。', 'chyinan', '2025-06-04 15:04:04');
INSERT INTO `system_log` VALUES (2812, 'management', '删除轮播图', '删除轮播图 删除了轮播图: ID=5, 文件名=\'QQ20250413-205039-1749006085268-712866392.png\', 标题=\'\'', 'admin', '2025-06-04 15:13:25');
INSERT INTO `system_log` VALUES (2813, 'auth', 'login_success', 'login_success 用户 \'admin\' (ID: 1, Role: admin) 登录成功。', 'admin', '2025-06-04 15:33:31');
INSERT INTO `system_log` VALUES (2814, 'auth', 'login_success', 'login_success 用户 \'admin\' (ID: 1, Role: admin) 登录成功。', 'admin', '2025-06-04 15:33:33');
INSERT INTO `system_log` VALUES (2815, 'auth', 'login_success', 'login_success 用户 \'admin\' (ID: 1, Role: admin) 登录成功。', 'admin', '2025-06-04 15:33:47');
INSERT INTO `system_log` VALUES (2816, 'auth', 'login_success', 'login_success 用户 \'admin\' (ID: 1, Role: admin) 登录成功。', 'admin', '2025-06-04 15:37:29');
INSERT INTO `system_log` VALUES (2817, 'auth', 'login_success', 'login_success 用户 \'admin\' (ID: 1, Role: admin) 登录成功。', 'admin', '2025-06-04 16:33:17');
INSERT INTO `system_log` VALUES (2818, 'auth', 'login_success', 'login_success 用户 \'chyinan\' (ID: 3, Role: student) 登录成功。', 'chyinan', '2025-06-04 16:33:25');
INSERT INTO `system_log` VALUES (2819, 'auth', 'login_success', 'login_success 用户 \'admin\' (ID: 1, Role: admin) 登录成功。', 'admin', '2025-06-04 17:55:01');
INSERT INTO `system_log` VALUES (2820, 'system', 'connect', 'connect 客户端连接: eU6Mx3B64ou0FvwEAAAB', 'System', '2025-06-04 17:55:05');
INSERT INTO `system_log` VALUES (2821, 'system', 'disconnect', 'disconnect 客户端断开: eU6Mx3B64ou0FvwEAAAB, 原因: client namespace disconnect', 'System', '2025-06-04 17:55:06');
INSERT INTO `system_log` VALUES (2822, 'auth', 'login_success', 'login_success 用户 \'chyinan\' (ID: 3, Role: student) 登录成功。', 'chyinan', '2025-06-04 18:00:58');
INSERT INTO `system_log` VALUES (2823, 'auth', '登录成功', '登录成功 用户 \'admin\' (ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-04 19:48:56');
INSERT INTO `system_log` VALUES (2824, 'auth', '登录成功', '登录成功 用户 \'chyinan\' (ID: 3, Role: student) 登录成功.', 'chyinan', '2025-06-04 19:50:02');
INSERT INTO `system_log` VALUES (2825, 'auth', '登录失败', '登录失败 用户 \'S2023001\' 不存在.', 'S2023001', '2025-06-04 20:06:50');
INSERT INTO `system_log` VALUES (2826, 'auth', '登录失败', '登录失败 用户 \'S2023001\' 不存在.', 'S2023001', '2025-06-04 20:07:04');
INSERT INTO `system_log` VALUES (2827, 'auth', '登录成功', '登录成功 用户 \'admin\' (ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-04 20:22:17');
INSERT INTO `system_log` VALUES (2828, 'auth', '登录失败', '登录失败 账户创建失败（数据库操作失败），学号：\'S2023001\'', 'S2023001', '2025-06-04 20:22:32');
INSERT INTO `system_log` VALUES (2829, 'auth', '登录失败', '登录失败 账户创建失败（数据库操作失败），学号：\'S2023001\'', 'S2023001', '2025-06-04 20:22:39');
INSERT INTO `system_log` VALUES (2830, 'auth', '登录失败', '登录失败 账户创建失败（数据库操作失败），学号：\'S2023001\'', 'S2023001', '2025-06-04 20:29:17');
INSERT INTO `system_log` VALUES (2831, 'user', '创建用户', '创建用户 为学号 \'S2023001\' 自动创建新用户，ID: 5.', 'system', '2025-06-04 20:36:37');
INSERT INTO `system_log` VALUES (2832, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (ID: 5, Role: student) 登录成功. (使用学号 \'S2023001\')', 'S2023001', '2025-06-04 20:36:37');
INSERT INTO `system_log` VALUES (2833, 'user', '创建用户', '创建用户 为学号 \'S2023001\' 自动创建新用户，ID: 6.', 'system', '2025-06-04 20:55:55');
INSERT INTO `system_log` VALUES (2834, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (ID: 6, Role: student) 登录成功. (使用学号 \'S2023001\')', 'S2023001', '2025-06-04 20:55:55');
INSERT INTO `system_log` VALUES (2835, 'user', '创建用户', '创建用户 为学号 \'S2023001\' 自动创建新用户，ID: 7.', 'system', '2025-06-04 20:57:52');
INSERT INTO `system_log` VALUES (2836, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 7, Role: student) 登录成功. (使用学号 \'S2023001\')', 'S2023001', '2025-06-04 20:57:52');
INSERT INTO `system_log` VALUES (2837, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-04 21:34:18');
INSERT INTO `system_log` VALUES (2838, 'auth', '登录成功', '登录成功 用户 \'chyinan\' (显示名: \'N/A\', ID: 3, Role: student) 登录成功.', 'chyinan', '2025-06-04 21:34:23');
INSERT INTO `system_log` VALUES (2839, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 7, Role: student) 登录成功.', 'S2023001', '2025-06-04 21:34:40');
INSERT INTO `system_log` VALUES (2840, 'error', '更新用户资料失败', '更新用户资料失败 用户ID 7 更新资料时出错: Unknown column \'phone\' in \'field list\'', 'User:7', '2025-06-04 21:49:04');
INSERT INTO `system_log` VALUES (2841, 'error', '更新用户资料失败', '更新用户资料失败 用户ID 7 更新资料时出错: Unknown column \'phone\' in \'field list\'', 'User:7', '2025-06-04 21:53:35');
INSERT INTO `system_log` VALUES (2842, 'error', '更新用户资料失败', '更新用户资料失败 用户ID 7 更新资料时出错: Unknown column \'phone\' in \'field list\'', 'User:7', '2025-06-04 21:53:57');
INSERT INTO `system_log` VALUES (2843, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 7, Role: student) 登录成功.', 'S2023001', '2025-06-04 21:55:00');
INSERT INTO `system_log` VALUES (2844, 'user', '更新资料', '更新资料 用户ID 7 (N/A) 更新了资料: email', 'User:7', '2025-06-04 21:55:21');
INSERT INTO `system_log` VALUES (2845, 'user', '更新学生联系方式', '更新学生联系方式 学生 (用户ID 7) 更新了联系方式: email, phone', 'User:7', '2025-06-04 21:55:21');
INSERT INTO `system_log` VALUES (2846, 'user', '更新个人资料', '更新个人资料 用户 \'S2023001\' 更新了个人资料 (email, phone)。', 'S2023001', '2025-06-04 21:55:21');
INSERT INTO `system_log` VALUES (2847, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 7, Role: student) 登录成功.', 'S2023001', '2025-06-04 22:39:56');
INSERT INTO `system_log` VALUES (2848, 'auth', '登录失败', '登录失败 账户创建失败（数据库操作失败），学号：\'S2023001\'', 'S2023001', '2025-06-04 22:41:00');
INSERT INTO `system_log` VALUES (2849, 'auth', '登录失败', '登录失败 账户创建失败（数据库操作失败），学号：\'S2023001\'', 'S2023001', '2025-06-04 22:41:10');
INSERT INTO `system_log` VALUES (2850, 'auth', '登录失败', '登录失败 账户创建失败（数据库操作失败），学号：\'S2023001\'', 'S2023001', '2025-06-04 22:42:06');
INSERT INTO `system_log` VALUES (2851, 'user', '创建用户', '创建用户 为学号 \'S2023001\' 自动创建新用户，ID: 8.', 'system', '2025-06-04 22:48:27');
INSERT INTO `system_log` VALUES (2852, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功. (使用学号 \'S2023001\')', 'S2023001', '2025-06-04 22:48:27');
INSERT INTO `system_log` VALUES (2853, 'user', '更新资料', '更新资料 用户ID 8 (N/A) 更新了资料: email', 'User:8', '2025-06-04 22:49:13');
INSERT INTO `system_log` VALUES (2854, 'user', '更新学生联系方式', '更新学生联系方式 学生 (用户ID 8) 更新了联系方式: email, phone', 'User:8', '2025-06-04 22:49:13');
INSERT INTO `system_log` VALUES (2855, 'user', '更新个人资料', '更新个人资料 用户 \'S2023001\' 更新了个人资料 (email, phone)。', 'S2023001', '2025-06-04 22:49:13');
INSERT INTO `system_log` VALUES (2856, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-04 22:56:19');
INSERT INTO `system_log` VALUES (2857, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-04 23:42:02');
INSERT INTO `system_log` VALUES (2858, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-04 23:45:02');
INSERT INTO `system_log` VALUES (2859, 'user', '更新资料', '更新资料 用户ID 8 (N/A) 更新了资料: email', 'User:8', '2025-06-04 23:49:05');
INSERT INTO `system_log` VALUES (2860, 'user', '更新学生联系方式', '更新学生联系方式 学生 (用户ID 8) 更新了联系方式: email', 'User:8', '2025-06-04 23:49:05');
INSERT INTO `system_log` VALUES (2861, 'user', '更新个人资料', '更新个人资料 用户 \'S2023001\' 更新了个人资料 (email)。', 'S2023001', '2025-06-04 23:49:05');
INSERT INTO `system_log` VALUES (2862, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-05 00:29:34');
INSERT INTO `system_log` VALUES (2863, 'system', '自动清理日志', '自动清理日志 成功删除 107 条 3 天前的旧日志', 'system-cron', '2025-06-05 02:00:00');
INSERT INTO `system_log` VALUES (2864, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-05 08:45:29');
INSERT INTO `system_log` VALUES (2865, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-05 09:23:38');
INSERT INTO `system_log` VALUES (2866, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-05 09:39:57');
INSERT INTO `system_log` VALUES (2867, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-05 09:52:05');
INSERT INTO `system_log` VALUES (2868, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-05 10:09:37');
INSERT INTO `system_log` VALUES (2869, 'database', '保存/更新成绩', '保存/更新成绩 admin 保存/更新了学生 \"王芳\" (ID: 2) 在考试 \"2025年4月高三月考\" (ID: 4) 的 6 门科目成绩.', 'admin', '2025-06-05 10:26:03');
INSERT INTO `system_log` VALUES (2870, 'database', '保存/更新成绩', '保存/更新成绩 admin 保存/更新了学生 \"李娜\" (ID: 3) 在考试 \"2025年4月高三月考\" (ID: 4) 的 5 门科目成绩.', 'admin', '2025-06-05 10:26:22');
INSERT INTO `system_log` VALUES (2871, 'database', '保存/更新成绩', '保存/更新成绩 admin 保存/更新了学生 \"赵敏\" (ID: 6) 在考试 \"2025年4月高三月考\" (ID: 4) 的 6 门科目成绩.', 'admin', '2025-06-05 10:26:41');
INSERT INTO `system_log` VALUES (2872, 'database', '保存/更新成绩', '保存/更新成绩 admin 保存/更新了学生 \"李娜\" (ID: 3) 在考试 \"2025年3月高三月考\" (ID: 1) 的 6 门科目成绩.', 'admin', '2025-06-05 10:27:08');
INSERT INTO `system_log` VALUES (2873, 'system', 'connect', 'connect 客户端连接: 8EZJPtdo8PFqPZBjAAAB', 'System', '2025-06-05 10:27:35');
INSERT INTO `system_log` VALUES (2874, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-05 10:32:19');
INSERT INTO `system_log` VALUES (2875, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-05 13:08:19');
INSERT INTO `system_log` VALUES (2876, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-05 13:08:38');
INSERT INTO `system_log` VALUES (2877, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 00:38:45');
INSERT INTO `system_log` VALUES (2878, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 08:25:09');
INSERT INTO `system_log` VALUES (2879, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 08:38:02');
INSERT INTO `system_log` VALUES (2880, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 08:44:50');
INSERT INTO `system_log` VALUES (2881, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 08:54:01');
INSERT INTO `system_log` VALUES (2882, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 09:33:38');
INSERT INTO `system_log` VALUES (2883, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 09:39:22');
INSERT INTO `system_log` VALUES (2884, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 09:54:41');
INSERT INTO `system_log` VALUES (2885, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 10:45:03');
INSERT INTO `system_log` VALUES (2886, 'database', '修改考试', '修改考试 admin 修改了考试 \"2025年4月高三月考\" (ID: 4) 的信息. 更新字段: exam_name, exam_type, status', 'admin', '2025-06-06 10:45:30');
INSERT INTO `system_log` VALUES (2887, 'database', '新增考试', '新增考试 admin 新增了考试 \"2025年6月期末考试\" (类型: 期末, ID: 16)', 'admin', '2025-06-06 10:46:30');

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户名',
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '邮箱',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '头像URL',
  `create_time` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'student' COMMENT 'User role (e.g., admin, student, teacher)',
  `display_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '显示名称/真实姓名',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_username`(`username` ASC) USING BTREE,
  UNIQUE INDEX `uk_email`(`email` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES (1, 'admin', '$2b$10$yGelu4IUCHu6sGk7WsIgxOOWp/WqJCd1oQkC8V6quTdrYE3AONoHm', 'admin@test.com', 'avatar-1-1748925908680-419831104.png', '2025-02-20 21:45:19', '2025-06-03 17:19:44', 'admin', NULL);
INSERT INTO `user` VALUES (2, 'test', '$2b$10$MshDQphPxvIRK6mNiVd1f.8HhPV9ysV84hyUiRglzIzdXfuB0ETeC', 'test@example.com', NULL, '2025-02-20 21:45:19', '2025-04-06 02:07:25', 'student', NULL);
INSERT INTO `user` VALUES (3, 'chyinan', '$2b$10$LeimjP0GK2OC9DObsO9WvuvHdksCwQsXNVA3uHNjIBadcuD3nBgb6', '1817175451@qq.com', 'avatar-3-1745847609124-586820353.png', '2025-02-20 21:51:36', '2025-04-28 21:40:09', 'student', NULL);
INSERT INTO `user` VALUES (8, 'S2023001', '$2b$10$vvCCMqjv930BKa1I6IUYKeBt5HyDktViy/4unT.mQTAKfAHE1qczW', '101@qq.com', NULL, '2025-06-04 22:48:28', '2025-06-04 23:49:05', 'student', '张伟');

-- ----------------------------
-- View structure for v_class_score_stats
-- ----------------------------
DROP VIEW IF EXISTS `v_class_score_stats`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_class_score_stats` AS select `c`.`id` AS `class_id`,`c`.`class_name` AS `class_name`,`c`.`teacher` AS `class_teacher`,`e`.`id` AS `exam_id`,`e`.`exam_name` AS `exam_name`,`e`.`exam_type` AS `exam_type`,date_format(`e`.`exam_date`,'%Y-%m-%d') AS `exam_date`,`ss`.`subject` AS `subject`,count(distinct `ss`.`student_id`) AS `student_count`,round(avg(`ss`.`score`),2) AS `average_score`,max(`ss`.`score`) AS `highest_score`,min(`ss`.`score`) AS `lowest_score`,round(std(`ss`.`score`),2) AS `score_stddev`,sum((case when (`ss`.`score` >= coalesce(`es`.`pass_score`,60.00)) then 1 else 0 end)) AS `passed_count`,round(((sum((case when (`ss`.`score` >= coalesce(`es`.`pass_score`,60.00)) then 1 else 0 end)) / count(distinct `ss`.`student_id`)) * 100),2) AS `pass_rate`,round(((sum((case when (`ss`.`score` >= 90) then 1 else 0 end)) / count(distinct `ss`.`student_id`)) * 100),2) AS `excellent_rate` from (((((`student_score` `ss` join `student` `s` on((`ss`.`student_id` = `s`.`id`))) join `class` `c` on((`s`.`class_id` = `c`.`id`))) join `exam` `e` on((`ss`.`exam_id` = `e`.`id`))) left join `subject` `sub` on((`ss`.`subject` = `sub`.`subject_name`))) left join `exam_subject` `es` on(((`ss`.`exam_id` = `es`.`exam_id`) and (`sub`.`id` = `es`.`subject_id`)))) group by `c`.`id`,`e`.`id`,`ss`.`subject`;

-- ----------------------------
-- View structure for v_student_score_stats
-- ----------------------------
DROP VIEW IF EXISTS `v_student_score_stats`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_student_score_stats` AS select `ss`.`id` AS `score_id`,`ss`.`student_id` AS `student_id`,`s`.`student_id` AS `student_number`,`s`.`name` AS `student_name`,`s`.`gender` AS `gender`,`c`.`id` AS `class_id`,`c`.`class_name` AS `class_name`,`c`.`teacher` AS `class_teacher`,`e`.`id` AS `exam_id`,`e`.`exam_name` AS `exam_name`,`e`.`exam_type` AS `exam_type`,date_format(`e`.`exam_date`,'%Y-%m-%d') AS `exam_date`,`e`.`status` AS `exam_status`,`ss`.`subject` AS `subject`,`sub`.`id` AS `subject_id`,`sub`.`subject_code` AS `subject_code`,`ss`.`score` AS `score`,coalesce(`es`.`full_score`,100.00) AS `full_score`,coalesce(`es`.`pass_score`,60.00) AS `pass_score`,coalesce(`es`.`weight`,1.00) AS `weight`,(`ss`.`score` >= coalesce(`es`.`pass_score`,60.00)) AS `is_passed`,round(((`ss`.`score` / coalesce(`es`.`full_score`,100.00)) * 100),2) AS `score_percentage`,(case when (`ss`.`score` >= 90) then '优秀' when (`ss`.`score` >= 80) then '良好' when (`ss`.`score` >= 70) then '中等' when (`ss`.`score` >= 60) then '及格' else '不及格' end) AS `score_level`,`ss`.`exam_time` AS `exam_time`,`ss`.`create_time` AS `create_time`,`ss`.`update_time` AS `update_time` from (((((`student_score` `ss` join `student` `s` on((`ss`.`student_id` = `s`.`id`))) join `class` `c` on((`s`.`class_id` = `c`.`id`))) join `exam` `e` on((`ss`.`exam_id` = `e`.`id`))) left join `subject` `sub` on((`ss`.`subject` = `sub`.`subject_name`))) left join `exam_subject` `es` on(((`ss`.`exam_id` = `es`.`exam_id`) and (`sub`.`id` = `es`.`subject_id`))));

-- ----------------------------
-- View structure for v_student_score_summary
-- ----------------------------
DROP VIEW IF EXISTS `v_student_score_summary`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_student_score_summary` AS select `ss`.`student_id` AS `student_id`,`s`.`student_id` AS `student_number`,`s`.`name` AS `student_name`,`c`.`class_name` AS `class_name`,`e`.`id` AS `exam_id`,`e`.`exam_name` AS `exam_name`,`e`.`exam_type` AS `exam_type`,date_format(`e`.`exam_date`,'%Y-%m-%d') AS `exam_date`,count(distinct `ss`.`subject`) AS `subject_count`,sum(`ss`.`score`) AS `total_score`,round(avg(`ss`.`score`),2) AS `average_score`,sum((case when (`ss`.`score` >= coalesce(`es`.`pass_score`,60.00)) then 1 else 0 end)) AS `passed_subjects`,round(((sum((case when (`ss`.`score` >= coalesce(`es`.`pass_score`,60.00)) then 1 else 0 end)) / count(distinct `ss`.`subject`)) * 100),2) AS `pass_rate`,max(`ss`.`score`) AS `highest_score`,min(`ss`.`score`) AS `lowest_score`,max(`ss`.`update_time`) AS `last_update_time` from (((((`student_score` `ss` join `student` `s` on((`ss`.`student_id` = `s`.`id`))) join `class` `c` on((`s`.`class_id` = `c`.`id`))) join `exam` `e` on((`ss`.`exam_id` = `e`.`id`))) left join `subject` `sub` on((`ss`.`subject` = `sub`.`subject_name`))) left join `exam_subject` `es` on(((`ss`.`exam_id` = `es`.`exam_id`) and (`sub`.`id` = `es`.`subject_id`)))) group by `ss`.`student_id`,`e`.`id`;

SET FOREIGN_KEY_CHECKS = 1;
