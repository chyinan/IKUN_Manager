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

 Date: 17/06/2025 22:15:29
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for announcements
-- ----------------------------
DROP TABLE IF EXISTS `announcements`;
CREATE TABLE `announcements`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `author_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `status` enum('published','draft') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'draft',
  `is_pinned` tinyint(1) NOT NULL DEFAULT 0,
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of announcements
-- ----------------------------
INSERT INTO `announcements` VALUES (1, '关于 “五一” 假期安排的通知', '<p>尊敬的全体师生：</p><p>根据国家法定节假日安排，结合我校实际情况，现将2024年“五一”劳动节放假安排通知如下：</p><p><strong>一、放假时间</strong></p><p>5月1日（星期三）至5月5日（星期日）放假调休，共5天。4月28日（星期日）、5月11日（星期六）正常上班、上课。</p><p><strong>二、注意事项</strong></p><ol><li>请各部门、各班级在放假前做好安全自查工作，关闭门窗、水电，确保校园安全。</li><li>假期期间，请同学们注意个人安全，遵守交通规则，预防网络诈骗。</li><li>假期结束后，请按时返校，无故不得缺席。</li></ol><p>祝全体师生度过一个愉快、祥和的假期！</p><p>教务处</p><p>2024年4月25日</p>', '教务处', 'published', 1, '2024-04-25 10:00:00', '2025-06-06 14:49:05', '2025-06-06 14:49:05');
INSERT INTO `announcements` VALUES (2, '校园歌手大赛初赛通知', '<h3>校园歌手大赛初赛即将拉开帷幕！</h3><p>展现你的才华，唱响青春的旋律！</p><ul><li><strong>比赛时间：</strong> 2024年5月15日 18:30</li><li><strong>比赛地点：</strong> 学校大礼堂</li><li><strong>报名方式：</strong> 请于5月10日前到学生会办公室报名。</li></ul><p>期待你的声音！</p>', '学生会', 'published', 0, '2024-05-02 15:30:00', '2025-06-06 14:49:05', '2025-06-15 18:58:38');
INSERT INTO `announcements` VALUES (3, '图书馆开放时间调整通知 (草稿)', '<p><br></p>', '图书馆', 'draft', 0, '2025-06-06 15:32:14', '2025-06-06 14:49:05', '2025-06-06 15:35:25');

-- ----------------------------
-- Table structure for assignment_class_link
-- ----------------------------
DROP TABLE IF EXISTS `assignment_class_link`;
CREATE TABLE `assignment_class_link`  (
  `assignment_id` bigint NOT NULL COMMENT '作业ID',
  `class_id` bigint NOT NULL COMMENT '班级ID',
  PRIMARY KEY (`assignment_id`, `class_id`) USING BTREE,
  INDEX `idx_assignment_id`(`assignment_id` ASC) USING BTREE,
  INDEX `idx_class_id`(`class_id` ASC) USING BTREE,
  CONSTRAINT `fk_acl_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_acl_class` FOREIGN KEY (`class_id`) REFERENCES `class` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '作业-班级关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of assignment_class_link
-- ----------------------------

-- ----------------------------
-- Table structure for assignments
-- ----------------------------
DROP TABLE IF EXISTS `assignments`;
CREATE TABLE `assignments`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '作业ID',
  `teacher_id` bigint NOT NULL COMMENT '发布教师用户ID (关联user.id)',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '作业标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '作业内容描述',
  `attachment_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '作业附件URL',
  `due_date` datetime NOT NULL COMMENT '截止日期',
  `status` enum('draft','published','archived') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'draft' COMMENT '作业状态',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_teacher_id`(`teacher_id` ASC) USING BTREE,
  INDEX `idx_due_date`(`due_date` ASC) USING BTREE,
  CONSTRAINT `fk_assignment_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '作业表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of assignments
-- ----------------------------

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
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '轮播图图片表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of carousel_images
-- ----------------------------
INSERT INTO `carousel_images` VALUES (12, 'carousel/8c01db08-78a7-4d46-a5a8-6383ac904671.jpg', '11', 'www.baidu.com', 1, 1, '2025-06-15 18:37:55', '2025-06-15 18:53:41');

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
) ENGINE = InnoDB AUTO_INCREMENT = 24 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '班级表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of class
-- ----------------------------
INSERT INTO `class` VALUES (1, '高三(1)班', '王老师', 'test', '2025-04-02 19:15:11', '2025-04-13 00:44:55');
INSERT INTO `class` VALUES (2, '高三(2)班', '李老师', '666', '2025-04-02 19:15:11', '2025-04-20 01:47:30');
INSERT INTO `class` VALUES (23, '高二(2)班', '赵老师', '用于测试删除保护的班级', '2025-06-07 15:55:01', '2025-06-07 15:55:01');

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
) ENGINE = InnoDB AUTO_INCREMENT = 157 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '部门表' ROW_FORMAT = Dynamic;

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
) ENGINE = InnoDB AUTO_INCREMENT = 155 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '员工表' ROW_FORMAT = Dynamic;

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
INSERT INTO `exam` VALUES (2, '2024年秋季高三期中考试', '期中', '2025-06-07 17:37:16', 5, '语文,数学,英语,物理,化学,生物', 0, '', '2025-04-02 19:15:11', '2025-06-07 17:37:32');
INSERT INTO `exam` VALUES (3, '2024年秋季高三期末考试', '期末', '2025-06-07 19:35:42', 2, '语文,数学,英语,物理,化学,生物', 2, '', '2025-04-02 19:15:11', '2025-06-07 17:36:14');
INSERT INTO `exam` VALUES (4, '2025年4月高三月考', '月考', '2025-04-15 00:00:00', 160, '语文,数学,英语,物理,化学,生物', 2, 'test', '2025-04-02 19:15:11', '2025-06-06 10:45:30');
INSERT INTO `exam` VALUES (5, '2024年秋季高二期末考试', '期末', '2025-06-07 17:36:54', 6, '语文,数学,英语,物理,化学,生物', 0, '', '2025-04-02 19:15:11', '2025-06-07 17:37:13');
INSERT INTO `exam` VALUES (16, '高考', '期末', '2025-06-23 00:00:00', 793, '生物,地理', 0, '111', '2025-06-06 10:46:30', '2025-06-17 02:00:33');

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
INSERT INTO `exam_class_link` VALUES (2, 1);
INSERT INTO `exam_class_link` VALUES (3, 2);
INSERT INTO `exam_class_link` VALUES (3, 23);
INSERT INTO `exam_class_link` VALUES (5, 1);
INSERT INTO `exam_class_link` VALUES (5, 2);
INSERT INTO `exam_class_link` VALUES (16, 1);

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
) ENGINE = InnoDB AUTO_INCREMENT = 214 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '考试科目关联表' ROW_FORMAT = Dynamic;

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
INSERT INTO `exam_subject` VALUES (212, 16, 6, 100.00, 60.00, 1.00, '2025-06-17 02:00:33');
INSERT INTO `exam_subject` VALUES (213, 16, 10, 100.00, 60.00, 1.00, '2025-06-17 02:00:33');

-- ----------------------------
-- Table structure for message_threads
-- ----------------------------
DROP TABLE IF EXISTS `message_threads`;
CREATE TABLE `message_threads`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主题ID',
  `student_user_id` bigint NOT NULL COMMENT '发起对话的学生用户ID (关联 user.id)',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '主题标题',
  `status` enum('open','in_progress','replied','resolved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'open' COMMENT '主题状态: open(待处理), in_progress(受理中), replied(已回复), resolved(已解决), rejected(已拒绝)',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_student_user_id`(`student_user_id` ASC) USING BTREE,
  CONSTRAINT `fk_thread_student_user` FOREIGN KEY (`student_user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '学生信箱主题表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of message_threads
-- ----------------------------
INSERT INTO `message_threads` VALUES (1, 8, '宿舍断电', 'resolved', '2025-06-06 18:27:43', '2025-06-07 20:31:39');
INSERT INTO `message_threads` VALUES (2, 8, '111', 'open', '2025-06-15 21:13:35', '2025-06-15 21:13:35');

-- ----------------------------
-- Table structure for messages
-- ----------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `thread_id` bigint NOT NULL COMMENT '所属主题ID (关联 message_threads.id)',
  `sender_user_id` bigint NOT NULL COMMENT '发送者用户ID (关联 user.id)',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '消息内容',
  `is_read` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已读 (主要用于标记给接收方的状态)',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_thread_id`(`thread_id` ASC) USING BTREE,
  INDEX `idx_sender_user_id`(`sender_user_id` ASC) USING BTREE,
  CONSTRAINT `fk_message_sender_user` FOREIGN KEY (`sender_user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_message_thread` FOREIGN KEY (`thread_id`) REFERENCES `message_threads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '学生信箱消息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of messages
-- ----------------------------
INSERT INTO `messages` VALUES (1, 1, 8, '每晚11点就断电怎么行？？？我还要写代码呢', 1, '2025-06-06 18:27:43');
INSERT INTO `messages` VALUES (2, 1, 8, '请回答', 1, '2025-06-06 18:48:46');
INSERT INTO `messages` VALUES (3, 1, 1, '好的，我已收到，马上责令学校保持不断电', 1, '2025-06-06 18:58:39');
INSERT INTO `messages` VALUES (10, 1, 8, '感谢！', 1, '2025-06-07 20:25:11');
INSERT INTO `messages` VALUES (11, 2, 8, '你好？', 0, '2025-06-15 21:16:17');

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
  CONSTRAINT `fk_student_class` FOREIGN KEY (`class_id`) REFERENCES `class` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_student_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 37 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '学生表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of student
-- ----------------------------
INSERT INTO `student` VALUES (1, 'S2023001', '张伟', '男', 1, '15876627199', '1011@qq.com', 8, '2023-09-01', '2025-04-02 19:15:11', '2025-06-06 15:43:15');
INSERT INTO `student` VALUES (2, 'S2023002', '王芳', '女', 1, '2', '2', NULL, '2023-09-01', '2025-04-02 19:15:11', '2025-04-02 19:35:30');
INSERT INTO `student` VALUES (3, 'S2023003', '李娜', '女', 1, '3', '3', NULL, '2023-09-01', '2025-04-02 19:15:11', '2025-04-02 19:35:31');
INSERT INTO `student` VALUES (4, 'S2023004', '刘强', '男', 1, '4', '4', NULL, '2023-09-01', '2025-04-02 19:15:11', '2025-04-02 19:35:32');
INSERT INTO `student` VALUES (5, 'S2023005', '陈浩', '男', 1, '5', '5', NULL, '2023-09-01', '2025-04-02 19:15:11', '2025-04-02 19:35:42');
INSERT INTO `student` VALUES (6, 'S2023011', '赵敏', '女', 2, '13800138001', 'zhangsan@test.com', NULL, '2023-09-01', '2025-04-02 19:15:11', '2025-04-07 09:37:11');
INSERT INTO `student` VALUES (7, 'S2023012', '周杰', '男', 2, '13800138001', 'zhangsan@test.com', NULL, '2023-09-01', '2025-04-02 19:15:11', '2025-04-07 09:39:11');
INSERT INTO `student` VALUES (8, 'S2023013', '吴磊', '男', 2, NULL, NULL, NULL, '2023-09-01', '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student` VALUES (9, 'S2023014', '郑娟', '女', 2, NULL, NULL, NULL, '2023-09-01', '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student` VALUES (10, 'S2023015', '孙悦', '女', 2, NULL, NULL, NULL, '2023-09-01', '2025-04-02 19:15:11', '2025-04-02 19:15:11');
INSERT INTO `student` VALUES (34, 'S2024006', '黄忠', '男', 23, NULL, NULL, NULL, '2024-09-01', '2025-06-07 15:55:01', '2025-06-07 15:55:01');
INSERT INTO `student` VALUES (35, 'S2024007', '貂蝉', '女', 23, NULL, NULL, NULL, '2024-09-01', '2025-06-07 15:55:01', '2025-06-07 15:55:01');
INSERT INTO `student` VALUES (36, 'S2024008', '吕布', '男', 23, NULL, NULL, NULL, '2024-09-01', '2025-06-07 15:55:01', '2025-06-07 15:55:01');

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
) ENGINE = InnoDB AUTO_INCREMENT = 195 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '学生成绩表' ROW_FORMAT = Dynamic;

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
INSERT INTO `student_score` VALUES (43, 1, 4, '语文', 100.0, '2025-04-04 02:29:11', '2025-06-17 00:59:59');
INSERT INTO `student_score` VALUES (44, 1, 4, '数学', 100.0, '2025-04-04 02:29:11', '2025-06-17 00:59:58');
INSERT INTO `student_score` VALUES (45, 1, 4, '英语', 100.0, '2025-04-04 02:29:11', '2025-06-17 00:59:59');
INSERT INTO `student_score` VALUES (46, 1, 4, '物理', 43.5, '2025-04-04 02:29:11', '2025-06-17 00:59:58');
INSERT INTO `student_score` VALUES (47, 1, 4, '化学', 100.0, '2025-04-04 02:29:11', '2025-06-17 00:59:58');
INSERT INTO `student_score` VALUES (48, 1, 4, '生物', 100.0, '2025-04-04 02:29:11', '2025-06-17 00:59:59');
INSERT INTO `student_score` VALUES (49, 1, 1, '语文', 99.5, '2025-04-04 02:29:57', '2025-06-06 22:27:33');
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
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '科目表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of subject
-- ----------------------------
INSERT INTO `subject` VALUES (1, '语文', 'CHINESE', '2025-04-02 19:15:10', '2025-04-02 19:15:10');
INSERT INTO `subject` VALUES (2, '数学', 'MATH', '2025-04-02 19:15:10', '2025-04-02 19:15:10');
INSERT INTO `subject` VALUES (3, '英语', 'ENGLISH', '2025-04-02 19:15:10', '2025-04-02 19:15:10');
INSERT INTO `subject` VALUES (4, '物理', 'PHYSICS', '2025-04-02 19:15:10', '2025-04-02 19:15:10');
INSERT INTO `subject` VALUES (5, '化学', 'CHEMISTRY', '2025-04-02 19:15:10', '2025-04-02 19:15:10');
INSERT INTO `subject` VALUES (6, '生物', 'BIOLOGY', '2025-04-02 19:15:10', '2025-04-02 19:15:10');
INSERT INTO `subject` VALUES (10, '地理', 'DILI', '2025-06-09 01:14:53', '2025-06-09 01:14:53');
INSERT INTO `subject` VALUES (11, '政治', 'ZZ2', '2025-06-09 01:15:04', '2025-06-16 14:52:22');

-- ----------------------------
-- Table structure for submissions
-- ----------------------------
DROP TABLE IF EXISTS `submissions`;
CREATE TABLE `submissions`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '提交ID',
  `assignment_id` bigint NOT NULL COMMENT '所属作业ID',
  `student_id` bigint NOT NULL COMMENT '提交学生ID (关联student.id)',
  `submission_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '提交的文字内容',
  `submission_file_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '提交的文件URL',
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
  `grade` decimal(5, 2) NULL DEFAULT NULL COMMENT '批改分数',
  `teacher_comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '教师评语',
  `status` enum('submitted','graded','late') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'submitted' COMMENT '提交状态',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_assignment_student`(`assignment_id` ASC, `student_id` ASC) USING BTREE,
  INDEX `idx_assignment_id`(`assignment_id` ASC) USING BTREE,
  INDEX `idx_student_id`(`student_id` ASC) USING BTREE,
  CONSTRAINT `fk_submission_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_submission_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '作业提交表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of submissions
-- ----------------------------

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
INSERT INTO `system_config` VALUES ('logRetentionDays', '1', '日志保留天数 (0表示不自动删除)', '2025-06-15 16:24:21');
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
) ENGINE = InnoDB AUTO_INCREMENT = 3163 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '系统日志表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of system_log
-- ----------------------------
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
INSERT INTO `system_log` VALUES (2888, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 13:05:03');
INSERT INTO `system_log` VALUES (2889, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 13:05:23');
INSERT INTO `system_log` VALUES (2890, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 13:05:30');
INSERT INTO `system_log` VALUES (2891, 'database', '更新', '更新 admin 更新了考试 (ID: 16) 的信息。', 'admin', '2025-06-06 13:11:56');
INSERT INTO `system_log` VALUES (2892, 'database', '更新', '更新 admin 更新了考试 (ID: 16) 的信息。', 'admin', '2025-06-06 13:15:30');
INSERT INTO `system_log` VALUES (2893, 'database', '更新', '更新 admin 更新了考试 (ID: 16) 的信息。', 'admin', '2025-06-06 13:15:51');
INSERT INTO `system_log` VALUES (2894, 'database', '更新', '更新 admin 更新了考试 (ID: 16) 的信息。', 'admin', '2025-06-06 13:16:11');
INSERT INTO `system_log` VALUES (2895, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 13:16:29');
INSERT INTO `system_log` VALUES (2896, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 14:12:20');
INSERT INTO `system_log` VALUES (2897, 'database', '更新', '更新 admin 更新了考试 (ID: 16) 的信息。', 'admin', '2025-06-06 14:12:34');
INSERT INTO `system_log` VALUES (2898, 'database', '更新', '更新 admin 更新了考试 (ID: 16) 的信息。', 'admin', '2025-06-06 14:21:39');
INSERT INTO `system_log` VALUES (2899, 'database', '更新', '更新 admin 更新了考试 (ID: 16) 的信息。', 'admin', '2025-06-06 14:21:56');
INSERT INTO `system_log` VALUES (2900, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 14:34:29');
INSERT INTO `system_log` VALUES (2901, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 15:04:17');
INSERT INTO `system_log` VALUES (2902, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 15:05:41');
INSERT INTO `system_log` VALUES (2903, 'user', '更新资料', '更新资料 用户ID 8 (N/A) 更新了资料: email', 'User:8', '2025-06-06 15:11:42');
INSERT INTO `system_log` VALUES (2904, 'user', '更新学生联系方式', '更新学生联系方式 学生 (用户ID 8) 更新了联系方式: email', 'User:8', '2025-06-06 15:11:42');
INSERT INTO `system_log` VALUES (2905, 'user', '更新个人资料', '更新个人资料 用户 \'S2023001\' 更新了个人资料 (email)。', 'S2023001', '2025-06-06 15:11:42');
INSERT INTO `system_log` VALUES (2906, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 15:20:27');
INSERT INTO `system_log` VALUES (2907, 'system', 'connect', 'connect 客户端连接: i-wQIt26ErlRVKsTAAAB', 'System', '2025-06-06 15:20:30');
INSERT INTO `system_log` VALUES (2908, 'system', 'disconnect', 'disconnect 客户端断开: i-wQIt26ErlRVKsTAAAB, 原因: client namespace disconnect', 'System', '2025-06-06 15:20:35');
INSERT INTO `system_log` VALUES (2909, 'error', '更新通知失败', '更新通知失败 更新通知 (ID: 3) 时出错: Cannot read properties of undefined (reading \'status\')', 'admin', '2025-06-06 15:21:33');
INSERT INTO `system_log` VALUES (2910, 'error', '更新通知失败', '更新通知失败 更新通知 (ID: 3) 时出错: Cannot read properties of undefined (reading \'status\')', 'admin', '2025-06-06 15:28:31');
INSERT INTO `system_log` VALUES (2911, 'error', '更新通知失败', '更新通知失败 更新通知 (ID: 3) 时出错: Cannot read properties of undefined (reading \'status\')', 'admin', '2025-06-06 15:28:54');
INSERT INTO `system_log` VALUES (2912, 'error', '更新通知失败', '更新通知失败 更新通知 (ID: 3) 时出错: Cannot read properties of undefined (reading \'status\')', 'admin', '2025-06-06 15:29:12');
INSERT INTO `system_log` VALUES (2913, 'database', '更新通知', '更新通知 admin 更新了通知: (ID: 3)', 'admin', '2025-06-06 15:32:13');
INSERT INTO `system_log` VALUES (2914, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 15:32:26');
INSERT INTO `system_log` VALUES (2915, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 15:32:38');
INSERT INTO `system_log` VALUES (2916, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 15:32:50');
INSERT INTO `system_log` VALUES (2917, 'database', '更新通知', '更新通知 admin 更新了通知: (ID: 3)', 'admin', '2025-06-06 15:33:10');
INSERT INTO `system_log` VALUES (2918, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 15:33:21');
INSERT INTO `system_log` VALUES (2919, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 15:35:05');
INSERT INTO `system_log` VALUES (2920, 'database', '更新通知', '更新通知 admin 更新了通知: (ID: 3)', 'admin', '2025-06-06 15:35:17');
INSERT INTO `system_log` VALUES (2921, 'database', '更新通知', '更新通知 admin 更新了通知: (ID: 3)', 'admin', '2025-06-06 15:35:25');
INSERT INTO `system_log` VALUES (2922, 'system', 'connect', 'connect 客户端连接: rkDTh6mXXbAPb_buAAAB', 'System', '2025-06-06 15:35:56');
INSERT INTO `system_log` VALUES (2923, 'system', 'disconnect', 'disconnect 客户端断开: rkDTh6mXXbAPb_buAAAB, 原因: client namespace disconnect', 'System', '2025-06-06 15:36:39');
INSERT INTO `system_log` VALUES (2924, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 15:36:52');
INSERT INTO `system_log` VALUES (2925, 'error', '更新用户资料失败', '更新用户资料失败 用户ID 8 更新资料时出错: Unknown column \'phone\' in \'field list\'', 'User:8', '2025-06-06 15:40:15');
INSERT INTO `system_log` VALUES (2926, 'error', '更新用户资料失败', '更新用户资料失败 用户ID 8 更新资料时出错: Unknown column \'phone\' in \'field list\'', 'User:8', '2025-06-06 15:40:25');
INSERT INTO `system_log` VALUES (2927, 'database', '更新用户资料', '更新用户资料 用户 (ID: 8) 资料已成功更新。', 'S2023001', '2025-06-06 15:43:15');
INSERT INTO `system_log` VALUES (2928, 'user', '更新个人资料', '更新个人资料 用户 \'S2023001\' 更新了个人资料 (phone)。', 'S2023001', '2025-06-06 15:43:15');
INSERT INTO `system_log` VALUES (2929, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 15:43:36');
INSERT INTO `system_log` VALUES (2930, 'management', '更新轮播图', '更新轮播图 更新了轮播图: ID=3, 更新内容: {\"title\":\"\",\"link_url\":\"https://www.gzgs.edu.cn/\",\"display_order\":0,\"is_active\":1}', 'admin', '2025-06-06 15:44:27');
INSERT INTO `system_log` VALUES (2931, 'auth', '登录失败', '登录失败 学号 \'S2023002\' 首次登录密码错误.', 'S2023002', '2025-06-06 15:44:44');
INSERT INTO `system_log` VALUES (2932, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 15:44:51');
INSERT INTO `system_log` VALUES (2933, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 15:45:11');
INSERT INTO `system_log` VALUES (2934, 'database', '更新', '更新 admin 更新了考试 (ID: 16) 的信息。', 'admin', '2025-06-06 15:45:38');
INSERT INTO `system_log` VALUES (2935, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 15:45:48');
INSERT INTO `system_log` VALUES (2936, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 15:50:50');
INSERT INTO `system_log` VALUES (2937, 'management', '添加轮播图', '添加轮播图 添加了新的轮播图: ID=6, 文件名=\'09FC374735ADA7DDC94DB16A3A4_F86C84C5_297D2-1749196311075-505485432.jpg\', 标题=\'\'', 'admin', '2025-06-06 15:51:51');
INSERT INTO `system_log` VALUES (2938, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 15:52:01');
INSERT INTO `system_log` VALUES (2939, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 15:57:29');
INSERT INTO `system_log` VALUES (2940, 'system', 'connect', 'connect 客户端连接: gluUSPgse4YLF46TAAAB', 'System', '2025-06-06 15:57:31');
INSERT INTO `system_log` VALUES (2941, 'system', 'disconnect', 'disconnect 客户端断开: gluUSPgse4YLF46TAAAB, 原因: client namespace disconnect', 'System', '2025-06-06 15:57:33');
INSERT INTO `system_log` VALUES (2942, 'management', '添加轮播图', '添加轮播图 添加了新的轮播图: ID=7, 文件名=\'9F0A75F9D91DFE0A048DF29E452_153F41F9_24FE7-1749196672600-349520785.jpg\', 标题=\'\'', 'admin', '2025-06-06 15:57:52');
INSERT INTO `system_log` VALUES (2943, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 15:58:05');
INSERT INTO `system_log` VALUES (2944, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 15:59:23');
INSERT INTO `system_log` VALUES (2945, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 16:04:59');
INSERT INTO `system_log` VALUES (2946, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 16:12:50');
INSERT INTO `system_log` VALUES (2947, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 16:38:26');
INSERT INTO `system_log` VALUES (2948, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 16:56:07');
INSERT INTO `system_log` VALUES (2949, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 16:56:10');
INSERT INTO `system_log` VALUES (2950, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 16:56:20');
INSERT INTO `system_log` VALUES (2951, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 16:57:38');
INSERT INTO `system_log` VALUES (2952, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 17:30:36');
INSERT INTO `system_log` VALUES (2953, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 17:30:53');
INSERT INTO `system_log` VALUES (2954, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 18:09:37');
INSERT INTO `system_log` VALUES (2955, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 18:16:21');
INSERT INTO `system_log` VALUES (2956, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 18:18:04');
INSERT INTO `system_log` VALUES (2957, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 18:19:35');
INSERT INTO `system_log` VALUES (2958, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 18:20:52');
INSERT INTO `system_log` VALUES (2959, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 18:25:43');
INSERT INTO `system_log` VALUES (2960, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 18:27:06');
INSERT INTO `system_log` VALUES (2961, 'mailbox', '创建主题', '创建主题 学生 (用户ID: 8) 创建了新的信箱主题: \"宿舍断电\" (主题ID: 1)', 'User:8', '2025-06-06 18:27:43');
INSERT INTO `system_log` VALUES (2962, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 18:30:46');
INSERT INTO `system_log` VALUES (2963, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 18:31:00');
INSERT INTO `system_log` VALUES (2964, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 18:31:54');
INSERT INTO `system_log` VALUES (2965, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 18:43:15');
INSERT INTO `system_log` VALUES (2966, 'mailbox', '回复消息', '回复消息 用户 (ID: 8) 在主题 (ID: 1) 中发布了新回复', 'User:8', '2025-06-06 18:48:46');
INSERT INTO `system_log` VALUES (2967, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 18:49:15');
INSERT INTO `system_log` VALUES (2968, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 18:49:20');
INSERT INTO `system_log` VALUES (2969, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 18:55:45');
INSERT INTO `system_log` VALUES (2970, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 18:57:51');
INSERT INTO `system_log` VALUES (2971, 'mailbox', '回复消息', '回复消息 用户 (ID: 1) 在主题 (ID: 1) 中发布了新回复', 'User:1', '2025-06-06 18:58:39');
INSERT INTO `system_log` VALUES (2972, 'mailbox', '更新状态', '更新状态 管理员 \'admin\' 将主题 (ID: 1) 的状态更新为 \'resolved\'', 'admin', '2025-06-06 19:11:06');
INSERT INTO `system_log` VALUES (2973, 'mailbox', '更新状态', '更新状态 管理员 \'admin\' 将主题 (ID: 1) 的状态更新为 \'replied\'', 'admin', '2025-06-06 19:11:14');
INSERT INTO `system_log` VALUES (2974, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 19:14:22');
INSERT INTO `system_log` VALUES (2975, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 19:14:30');
INSERT INTO `system_log` VALUES (2976, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 19:19:21');
INSERT INTO `system_log` VALUES (2977, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 19:19:58');
INSERT INTO `system_log` VALUES (2978, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 19:20:09');
INSERT INTO `system_log` VALUES (2979, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 19:30:23');
INSERT INTO `system_log` VALUES (2980, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 19:51:26');
INSERT INTO `system_log` VALUES (2981, 'system', 'connect', 'connect 客户端连接: XvvhXdfrk1YEG6OeAAAB', 'System', '2025-06-06 19:51:28');
INSERT INTO `system_log` VALUES (2982, 'system', 'disconnect', 'disconnect 客户端断开: XvvhXdfrk1YEG6OeAAAB, 原因: client namespace disconnect', 'System', '2025-06-06 19:51:29');
INSERT INTO `system_log` VALUES (2983, 'system', 'connect', 'connect 客户端连接: W5TjfvFzTPUz-IZgAAAD', 'System', '2025-06-06 19:51:30');
INSERT INTO `system_log` VALUES (2984, 'system', 'disconnect', 'disconnect 客户端断开: W5TjfvFzTPUz-IZgAAAD, 原因: client namespace disconnect', 'System', '2025-06-06 19:51:38');
INSERT INTO `system_log` VALUES (2985, 'system', 'connect', 'connect 客户端连接: 57awE9ux4iXG2_fSAAAF', 'System', '2025-06-06 19:51:53');
INSERT INTO `system_log` VALUES (2986, 'system', 'disconnect', 'disconnect 客户端断开: 57awE9ux4iXG2_fSAAAF, 原因: client namespace disconnect', 'System', '2025-06-06 19:51:55');
INSERT INTO `system_log` VALUES (2987, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 19:52:33');
INSERT INTO `system_log` VALUES (2988, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 19:53:31');
INSERT INTO `system_log` VALUES (2989, 'system', 'connect', 'connect 客户端连接: 1KHjxDFm2Th1rSdCAAAB', 'System', '2025-06-06 19:57:31');
INSERT INTO `system_log` VALUES (2990, 'system', 'disconnect', 'disconnect 客户端断开: 1KHjxDFm2Th1rSdCAAAB, 原因: client namespace disconnect', 'System', '2025-06-06 19:57:33');
INSERT INTO `system_log` VALUES (2991, 'system', 'connect', 'connect 客户端连接: w7TS29iCtqrbkLr7AAAB', 'System', '2025-06-06 20:59:00');
INSERT INTO `system_log` VALUES (2992, 'system', 'disconnect', 'disconnect 客户端断开: w7TS29iCtqrbkLr7AAAB, 原因: client namespace disconnect', 'System', '2025-06-06 20:59:02');
INSERT INTO `system_log` VALUES (2993, 'database', '保存/更新成绩', '保存/更新成绩 admin 保存/更新了学生 \"张伟\" (ID: 1) 在考试 \"2025年3月高三月考\" (ID: 1) 的 6 门科目成绩.', 'admin', '2025-06-06 22:27:33');
INSERT INTO `system_log` VALUES (2994, 'system', 'connect', 'connect 客户端连接: MV9TgtQTuy59qFygAAAD', 'System', '2025-06-06 22:27:44');
INSERT INTO `system_log` VALUES (2995, 'system', 'disconnect', 'disconnect 客户端断开: MV9TgtQTuy59qFygAAAD, 原因: client namespace disconnect', 'System', '2025-06-06 22:27:45');
INSERT INTO `system_log` VALUES (2996, 'system', 'connect', 'connect 客户端连接: 1J24sUCjvJMXamg2AAAF', 'System', '2025-06-06 22:30:31');
INSERT INTO `system_log` VALUES (2997, 'system', 'disconnect', 'disconnect 客户端断开: 1J24sUCjvJMXamg2AAAF, 原因: client namespace disconnect', 'System', '2025-06-06 22:30:32');
INSERT INTO `system_log` VALUES (2998, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-06 22:35:04');
INSERT INTO `system_log` VALUES (2999, 'auth', '登录失败', '登录失败 用户 \'admin\' 密码错误.', 'admin', '2025-06-06 22:35:43');
INSERT INTO `system_log` VALUES (3000, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 22:35:47');
INSERT INTO `system_log` VALUES (3001, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 22:48:01');
INSERT INTO `system_log` VALUES (3002, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-06 23:02:35');
INSERT INTO `system_log` VALUES (3003, 'system', 'connect', 'connect 客户端连接: L0FVlF9WbBS7_xcKAAAB', 'System', '2025-06-06 23:52:53');
INSERT INTO `system_log` VALUES (3004, 'system', 'disconnect', 'disconnect 客户端断开: L0FVlF9WbBS7_xcKAAAB, 原因: client namespace disconnect', 'System', '2025-06-06 23:52:55');
INSERT INTO `system_log` VALUES (3005, 'database', '保存/更新成绩', '保存/更新成绩 admin 保存/更新了学生 \"张伟\" (ID: 1) 在考试 \"2025年4月高三月考\" (ID: 4) 的 6 门科目成绩.', 'admin', '2025-06-06 23:53:31');
INSERT INTO `system_log` VALUES (3006, 'system', 'connect', 'connect 客户端连接: jdFVMte2_LbhJm_IAAAD', 'System', '2025-06-06 23:54:10');
INSERT INTO `system_log` VALUES (3007, 'system', 'disconnect', 'disconnect 客户端断开: jdFVMte2_LbhJm_IAAAD, 原因: client namespace disconnect', 'System', '2025-06-06 23:54:12');
INSERT INTO `system_log` VALUES (3008, 'system', 'connect', 'connect 客户端连接: BefG-huNl7Backl2AAAF', 'System', '2025-06-06 23:57:37');
INSERT INTO `system_log` VALUES (3009, 'system', 'disconnect', 'disconnect 客户端断开: BefG-huNl7Backl2AAAF, 原因: client namespace disconnect', 'System', '2025-06-06 23:57:38');
INSERT INTO `system_log` VALUES (3010, 'system', 'connect', 'connect 客户端连接: 8RePJ0XwhfdJhPfLAAAH', 'System', '2025-06-07 00:03:36');
INSERT INTO `system_log` VALUES (3011, 'system', 'disconnect', 'disconnect 客户端断开: 8RePJ0XwhfdJhPfLAAAH, 原因: client namespace disconnect', 'System', '2025-06-07 00:03:37');
INSERT INTO `system_log` VALUES (3012, 'system', 'connect', 'connect 客户端连接: TkLcVkrGd4aFXUwEAAAJ', 'System', '2025-06-07 00:04:05');
INSERT INTO `system_log` VALUES (3013, 'system', 'disconnect', 'disconnect 客户端断开: TkLcVkrGd4aFXUwEAAAJ, 原因: client namespace disconnect', 'System', '2025-06-07 00:04:06');
INSERT INTO `system_log` VALUES (3014, 'system', 'connect', 'connect 客户端连接: JztmyIoBXUuR-D51AAAL', 'System', '2025-06-07 00:23:26');
INSERT INTO `system_log` VALUES (3015, 'system', 'disconnect', 'disconnect 客户端断开: JztmyIoBXUuR-D51AAAL, 原因: client namespace disconnect', 'System', '2025-06-07 00:23:28');
INSERT INTO `system_log` VALUES (3016, 'system', 'connect', 'connect 客户端连接: _eK2YtZ4xHv9YHceAAAN', 'System', '2025-06-07 00:27:38');
INSERT INTO `system_log` VALUES (3017, 'system', 'disconnect', 'disconnect 客户端断开: _eK2YtZ4xHv9YHceAAAN, 原因: client namespace disconnect', 'System', '2025-06-07 00:27:39');
INSERT INTO `system_log` VALUES (3018, 'system', 'connect', 'connect 客户端连接: 6nATz4D223DPAxY0AAAP', 'System', '2025-06-07 00:31:15');
INSERT INTO `system_log` VALUES (3019, 'system', 'disconnect', 'disconnect 客户端断开: 6nATz4D223DPAxY0AAAP, 原因: client namespace disconnect', 'System', '2025-06-07 00:31:16');
INSERT INTO `system_log` VALUES (3020, 'system', 'connect', 'connect 客户端连接: bXJmdUCsxX8ItJMQAAAR', 'System', '2025-06-07 00:31:25');
INSERT INTO `system_log` VALUES (3021, 'system', 'disconnect', 'disconnect 客户端断开: bXJmdUCsxX8ItJMQAAAR, 原因: client namespace disconnect', 'System', '2025-06-07 00:31:29');
INSERT INTO `system_log` VALUES (3022, 'system', 'connect', 'connect 客户端连接: GOLcrqPf6cOMuxqnAAAT', 'System', '2025-06-07 00:42:04');
INSERT INTO `system_log` VALUES (3023, 'system', 'disconnect', 'disconnect 客户端断开: GOLcrqPf6cOMuxqnAAAT, 原因: client namespace disconnect', 'System', '2025-06-07 00:42:06');
INSERT INTO `system_log` VALUES (3024, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-07 00:45:22');
INSERT INTO `system_log` VALUES (3025, 'system', '自动清理日志', '自动清理日志 成功删除 42 条 3 天前的旧日志', 'system-cron', '2025-06-07 02:00:00');
INSERT INTO `system_log` VALUES (3026, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-07 13:47:20');
INSERT INTO `system_log` VALUES (3027, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-07 13:49:13');
INSERT INTO `system_log` VALUES (3028, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-07 14:01:39');
INSERT INTO `system_log` VALUES (3029, 'system', 'connect', 'connect 客户端连接: y67SlL1Omx0rZaSWAAAB', 'System', '2025-06-07 14:07:13');
INSERT INTO `system_log` VALUES (3030, 'system', 'disconnect', 'disconnect 客户端断开: y67SlL1Omx0rZaSWAAAB, 原因: client namespace disconnect', 'System', '2025-06-07 14:07:14');
INSERT INTO `system_log` VALUES (3031, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-07 14:37:51');
INSERT INTO `system_log` VALUES (3032, 'system', 'connect', 'connect 客户端连接: 3CCleJohBonZthT_AAAB', 'System', '2025-06-07 15:17:05');
INSERT INTO `system_log` VALUES (3033, 'system', 'disconnect', 'disconnect 客户端断开: 3CCleJohBonZthT_AAAB, 原因: transport close', 'System', '2025-06-07 15:21:10');
INSERT INTO `system_log` VALUES (3034, 'system', 'connect', 'connect 客户端连接: IHZUuSEo2Abc7cpHAAAD', 'System', '2025-06-07 15:21:12');
INSERT INTO `system_log` VALUES (3035, 'system', 'disconnect', 'disconnect 客户端断开: IHZUuSEo2Abc7cpHAAAD, 原因: transport close', 'System', '2025-06-07 15:27:38');
INSERT INTO `system_log` VALUES (3036, 'system', 'connect', 'connect 客户端连接: 4cAw4OHRtl67QOPJAAAF', 'System', '2025-06-07 15:27:39');
INSERT INTO `system_log` VALUES (3037, 'system', 'disconnect', 'disconnect 客户端断开: 4cAw4OHRtl67QOPJAAAF, 原因: client namespace disconnect', 'System', '2025-06-07 15:29:16');
INSERT INTO `system_log` VALUES (3038, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-07 15:29:18');
INSERT INTO `system_log` VALUES (3039, 'system', 'connect', 'connect 客户端连接: TOzAhZb7ZYs25ZKDAAAH', 'System', '2025-06-07 15:29:20');
INSERT INTO `system_log` VALUES (3040, 'system', 'disconnect', 'disconnect 客户端断开: TOzAhZb7ZYs25ZKDAAAH, 原因: transport close', 'System', '2025-06-07 15:29:23');
INSERT INTO `system_log` VALUES (3041, 'system', 'connect', 'connect 客户端连接: 03HU2AwzOE4-k9zyAAAJ', 'System', '2025-06-07 15:29:23');
INSERT INTO `system_log` VALUES (3042, 'system', 'disconnect', 'disconnect 客户端断开: 03HU2AwzOE4-k9zyAAAJ, 原因: client namespace disconnect', 'System', '2025-06-07 15:29:36');
INSERT INTO `system_log` VALUES (3043, 'database', '删除', '删除班级: 高二(1)班 (ID: 3)', 'system', '2025-06-07 15:34:02');
INSERT INTO `system_log` VALUES (3044, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-07 15:57:14');
INSERT INTO `system_log` VALUES (3045, 'database', '更新', '更新 admin 更新了考试 (ID: 16) 的信息。', 'admin', '2025-06-07 17:21:43');
INSERT INTO `system_log` VALUES (3046, 'database', '更新', '更新 admin 更新了考试 (ID: 16) 的信息。', 'admin', '2025-06-07 17:24:21');
INSERT INTO `system_log` VALUES (3047, 'system', 'connect', 'connect 客户端连接: hnpurn44H2fNWPGKAAAB', 'System', '2025-06-07 17:30:03');
INSERT INTO `system_log` VALUES (3048, 'system', 'disconnect', 'disconnect 客户端断开: hnpurn44H2fNWPGKAAAB, 原因: client namespace disconnect', 'System', '2025-06-07 17:30:03');
INSERT INTO `system_log` VALUES (3049, 'database', '更新', '更新 admin 更新了考试 (ID: 3) 的信息。', 'admin', '2025-06-07 17:36:14');
INSERT INTO `system_log` VALUES (3050, 'database', '更新', '更新 admin 更新了考试 (ID: 5) 的信息。', 'admin', '2025-06-07 17:37:13');
INSERT INTO `system_log` VALUES (3051, 'database', '更新', '更新 admin 更新了考试 (ID: 2) 的信息。', 'admin', '2025-06-07 17:37:32');
INSERT INTO `system_log` VALUES (3052, 'system', 'connect', 'connect 客户端连接: 5SLm_nceQ3pBYx-8AAAD', 'System', '2025-06-07 17:37:59');
INSERT INTO `system_log` VALUES (3053, 'system', 'disconnect', 'disconnect 客户端断开: 5SLm_nceQ3pBYx-8AAAD, 原因: client namespace disconnect', 'System', '2025-06-07 17:38:04');
INSERT INTO `system_log` VALUES (3054, 'system', 'connect', 'connect 客户端连接: r6sx0yw6sBQBJ5v2AAAF', 'System', '2025-06-07 17:38:19');
INSERT INTO `system_log` VALUES (3055, 'system', 'disconnect', 'disconnect 客户端断开: r6sx0yw6sBQBJ5v2AAAF, 原因: client namespace disconnect', 'System', '2025-06-07 17:38:20');
INSERT INTO `system_log` VALUES (3056, 'system', 'connect', 'connect 客户端连接: 70k3Nj0xbUGy5Be9AAAH', 'System', '2025-06-07 17:59:42');
INSERT INTO `system_log` VALUES (3057, 'system', 'disconnect', 'disconnect 客户端断开: 70k3Nj0xbUGy5Be9AAAH, 原因: client namespace disconnect', 'System', '2025-06-07 17:59:44');
INSERT INTO `system_log` VALUES (3058, 'system', 'connect', 'connect 客户端连接: mjMQWw0E7Ya8aOftAAAJ', 'System', '2025-06-07 18:00:30');
INSERT INTO `system_log` VALUES (3059, 'system', 'disconnect', 'disconnect 客户端断开: mjMQWw0E7Ya8aOftAAAJ, 原因: client namespace disconnect', 'System', '2025-06-07 18:00:32');
INSERT INTO `system_log` VALUES (3060, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-07 18:00:47');
INSERT INTO `system_log` VALUES (3061, 'mailbox', '回复消息', '回复消息 用户 (ID: 8) 在主题 (ID: 1) 中发布了新回复', 'User:8', '2025-06-07 20:25:11');
INSERT INTO `system_log` VALUES (3062, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-07 20:31:28');
INSERT INTO `system_log` VALUES (3063, 'system', 'connect', 'connect 客户端连接: iaRvGfKuugMBuWdJAAAB', 'System', '2025-06-07 20:31:29');
INSERT INTO `system_log` VALUES (3064, 'system', 'disconnect', 'disconnect 客户端断开: iaRvGfKuugMBuWdJAAAB, 原因: client namespace disconnect', 'System', '2025-06-07 20:31:33');
INSERT INTO `system_log` VALUES (3065, 'mailbox', '更新状态', '更新状态 管理员 \'admin\' 将主题 (ID: 1) 的状态更新为 \'resolved\'', 'admin', '2025-06-07 20:31:39');
INSERT INTO `system_log` VALUES (3066, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-07 20:31:52');
INSERT INTO `system_log` VALUES (3067, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-08 00:08:27');
INSERT INTO `system_log` VALUES (3068, 'system', 'connect', 'connect 客户端连接: nLWQQ7x2bMlSpJaVAAAD', 'System', '2025-06-08 00:09:41');
INSERT INTO `system_log` VALUES (3069, 'system', 'disconnect', 'disconnect 客户端断开: nLWQQ7x2bMlSpJaVAAAD, 原因: client namespace disconnect', 'System', '2025-06-08 00:09:44');
INSERT INTO `system_log` VALUES (3070, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-08 00:10:32');
INSERT INTO `system_log` VALUES (3071, 'system', '自动清理日志', '自动清理日志 成功删除 115 条 3 天前的旧日志', 'system-cron', '2025-06-08 02:00:00');
INSERT INTO `system_log` VALUES (3072, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-08 13:22:43');
INSERT INTO `system_log` VALUES (3073, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-08 13:23:01');
INSERT INTO `system_log` VALUES (3074, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-08 13:53:43');
INSERT INTO `system_log` VALUES (3075, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-08 14:12:35');
INSERT INTO `system_log` VALUES (3076, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-08 14:16:03');
INSERT INTO `system_log` VALUES (3077, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-08 14:58:52');
INSERT INTO `system_log` VALUES (3078, 'system', 'connect', 'connect 客户端连接: 3S7RC7PSmDuXfsYEAAAB', 'System', '2025-06-08 14:59:13');
INSERT INTO `system_log` VALUES (3079, 'system', 'disconnect', 'disconnect 客户端断开: 3S7RC7PSmDuXfsYEAAAB, 原因: client namespace disconnect', 'System', '2025-06-08 14:59:16');
INSERT INTO `system_log` VALUES (3080, 'database', '更新', '更新 admin 更新了考试 (ID: 16) 的信息。', 'admin', '2025-06-08 14:59:41');
INSERT INTO `system_log` VALUES (3081, 'database', '更新', '更新 admin 更新了考试 (ID: 16) 的信息。', 'admin', '2025-06-08 14:59:58');
INSERT INTO `system_log` VALUES (3082, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-08 15:01:21');
INSERT INTO `system_log` VALUES (3083, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-08 15:13:26');
INSERT INTO `system_log` VALUES (3084, 'system', 'connect', 'connect 客户端连接: lhbC64IPvEbpTLYZAAAD', 'System', '2025-06-08 15:13:38');
INSERT INTO `system_log` VALUES (3085, 'system', 'disconnect', 'disconnect 客户端断开: lhbC64IPvEbpTLYZAAAD, 原因: client namespace disconnect', 'System', '2025-06-08 15:13:39');
INSERT INTO `system_log` VALUES (3086, 'system', 'connect', 'connect 客户端连接: kNYYzpX5_Mxkjdn3AAAF', 'System', '2025-06-08 15:13:43');
INSERT INTO `system_log` VALUES (3087, 'system', 'disconnect', 'disconnect 客户端断开: kNYYzpX5_Mxkjdn3AAAF, 原因: client namespace disconnect', 'System', '2025-06-08 15:13:43');
INSERT INTO `system_log` VALUES (3088, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-08 15:32:06');
INSERT INTO `system_log` VALUES (3089, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-08 16:03:12');
INSERT INTO `system_log` VALUES (3090, 'system', 'connect', 'connect 客户端连接: vsv9TLN2iXxUDvFiAAAB', 'System', '2025-06-08 16:24:08');
INSERT INTO `system_log` VALUES (3091, 'system', 'disconnect', 'disconnect 客户端断开: vsv9TLN2iXxUDvFiAAAB, 原因: transport close', 'System', '2025-06-08 16:29:16');
INSERT INTO `system_log` VALUES (3092, 'system', 'connect', 'connect 客户端连接: zBqF6ubFVbjQJCeMAAAD', 'System', '2025-06-08 16:29:16');
INSERT INTO `system_log` VALUES (3093, 'system', 'disconnect', 'disconnect 客户端断开: zBqF6ubFVbjQJCeMAAAD, 原因: transport close', 'System', '2025-06-08 16:34:53');
INSERT INTO `system_log` VALUES (3094, 'system', 'connect', 'connect 客户端连接: YeswWTchC0DVz-nhAAAF', 'System', '2025-06-08 16:34:54');
INSERT INTO `system_log` VALUES (3095, 'system', 'disconnect', 'disconnect 客户端断开: YeswWTchC0DVz-nhAAAF, 原因: client namespace disconnect', 'System', '2025-06-08 16:35:39');
INSERT INTO `system_log` VALUES (3096, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-08 16:46:37');
INSERT INTO `system_log` VALUES (3097, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-08 16:47:08');
INSERT INTO `system_log` VALUES (3098, 'auth', '登录失败', '登录失败 用户 \'admin\' 密码错误.', 'admin', '2025-06-08 16:47:17');
INSERT INTO `system_log` VALUES (3099, 'auth', '登录失败', '登录失败 用户 \'admin\' 密码错误.', 'admin', '2025-06-08 16:47:18');
INSERT INTO `system_log` VALUES (3100, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-08 16:47:21');
INSERT INTO `system_log` VALUES (3101, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-08 17:42:27');
INSERT INTO `system_log` VALUES (3102, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-08 17:49:02');
INSERT INTO `system_log` VALUES (3103, 'system', 'connect', 'connect 客户端连接: __ohhrfsYXCOHlWfAAAH', 'System', '2025-06-08 17:49:04');
INSERT INTO `system_log` VALUES (3104, 'system', 'disconnect', 'disconnect 客户端断开: __ohhrfsYXCOHlWfAAAH, 原因: transport close', 'System', '2025-06-08 18:43:58');
INSERT INTO `system_log` VALUES (3105, 'system', 'connect', 'connect 客户端连接: 5f90YHdZK2IseJOLAAAJ', 'System', '2025-06-08 20:46:48');
INSERT INTO `system_log` VALUES (3106, 'system', 'disconnect', 'disconnect 客户端断开: 5f90YHdZK2IseJOLAAAJ, 原因: client namespace disconnect', 'System', '2025-06-08 20:52:16');
INSERT INTO `system_log` VALUES (3107, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-08 20:52:28');
INSERT INTO `system_log` VALUES (3108, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-08 20:52:30');
INSERT INTO `system_log` VALUES (3109, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-08 20:52:48');
INSERT INTO `system_log` VALUES (3110, 'system', 'connect', 'connect 客户端连接: RGxbQyQ06_bAx93zAAAL', 'System', '2025-06-08 20:53:42');
INSERT INTO `system_log` VALUES (3111, 'system', 'disconnect', 'disconnect 客户端断开: RGxbQyQ06_bAx93zAAAL, 原因: client namespace disconnect', 'System', '2025-06-08 20:53:55');
INSERT INTO `system_log` VALUES (3112, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-08 20:54:09');
INSERT INTO `system_log` VALUES (3113, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-08 20:54:39');
INSERT INTO `system_log` VALUES (3114, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-08 21:33:50');
INSERT INTO `system_log` VALUES (3115, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-08 21:42:22');
INSERT INTO `system_log` VALUES (3116, 'system', 'connect', 'connect 客户端连接: aOrYOii0jz_FVyD8AAAN', 'System', '2025-06-08 21:48:12');
INSERT INTO `system_log` VALUES (3117, 'system', 'disconnect', 'disconnect 客户端断开: aOrYOii0jz_FVyD8AAAN, 原因: client namespace disconnect', 'System', '2025-06-08 21:48:41');
INSERT INTO `system_log` VALUES (3118, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-08 21:57:42');
INSERT INTO `system_log` VALUES (3119, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-08 23:11:36');
INSERT INTO `system_log` VALUES (3120, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-08 23:22:36');
INSERT INTO `system_log` VALUES (3121, 'database', '更新', '更新 admin 更新了考试 (ID: 16) 的信息。', 'admin', '2025-06-09 00:14:39');
INSERT INTO `system_log` VALUES (3122, 'insert', '添加科目', '添加科目 添加了新科目: test', 'admin', '2025-06-09 00:37:59');
INSERT INTO `system_log` VALUES (3123, 'update', '更新科目', '更新科目 更新了科目 #7 的信息', 'admin', '2025-06-09 00:50:38');
INSERT INTO `system_log` VALUES (3124, 'delete', '删除科目', '删除科目 删除了科目 #7', 'admin', '2025-06-09 00:50:48');
INSERT INTO `system_log` VALUES (3125, 'insert', '添加科目', '添加科目 添加了新科目: test', 'admin', '2025-06-09 00:50:56');
INSERT INTO `system_log` VALUES (3126, 'update', '更新科目', '更新科目 更新了科目 #8 的信息', 'admin', '2025-06-09 01:10:02');
INSERT INTO `system_log` VALUES (3127, 'delete', '删除科目', '删除科目 删除了科目 #8', 'admin', '2025-06-09 01:10:09');
INSERT INTO `system_log` VALUES (3128, 'insert', '添加科目', '添加科目 添加了新科目: test', 'admin', '2025-06-09 01:10:17');
INSERT INTO `system_log` VALUES (3129, 'database', '更新', '更新 admin 更新了考试 (ID: 16) 的信息。', 'admin', '2025-06-09 01:10:29');
INSERT INTO `system_log` VALUES (3130, 'system', 'connect', 'connect 客户端连接: DrY4ZMDzlKvbvBHwAAAB', 'System', '2025-06-09 01:14:02');
INSERT INTO `system_log` VALUES (3131, 'system', 'disconnect', 'disconnect 客户端断开: DrY4ZMDzlKvbvBHwAAAB, 原因: client namespace disconnect', 'System', '2025-06-09 01:14:04');
INSERT INTO `system_log` VALUES (3132, 'insert', '添加科目', '添加科目 添加了新科目: 地理', 'admin', '2025-06-09 01:14:53');
INSERT INTO `system_log` VALUES (3133, 'insert', '添加科目', '添加科目 添加了新科目: 政治', 'admin', '2025-06-09 01:15:04');
INSERT INTO `system_log` VALUES (3134, 'system', '自动清理日志', '自动清理日志 成功删除 55 条 3 天前的旧日志', 'system-cron', '2025-06-09 02:00:00');
INSERT INTO `system_log` VALUES (3135, 'system', 'connect', 'connect 客户端连接: jOCVEZ1OPI2k7jgfAAAB', 'System', '2025-06-09 18:43:42');
INSERT INTO `system_log` VALUES (3136, 'system', 'disconnect', 'disconnect 客户端断开: jOCVEZ1OPI2k7jgfAAAB, 原因: client namespace disconnect', 'System', '2025-06-09 18:43:47');
INSERT INTO `system_log` VALUES (3137, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-09 18:54:50');
INSERT INTO `system_log` VALUES (3138, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-09 18:54:56');
INSERT INTO `system_log` VALUES (3139, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-09 18:56:34');
INSERT INTO `system_log` VALUES (3140, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-09 19:16:19');
INSERT INTO `system_log` VALUES (3141, 'database', '更新', '更新 admin 更新了考试 (ID: 16) 的信息。', 'admin', '2025-06-09 19:16:40');
INSERT INTO `system_log` VALUES (3142, 'database', '更新', '更新 admin 更新了考试 (ID: 16) 的信息。', 'admin', '2025-06-09 21:14:17');
INSERT INTO `system_log` VALUES (3143, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-09 21:14:27');
INSERT INTO `system_log` VALUES (3144, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-09 21:14:42');
INSERT INTO `system_log` VALUES (3145, 'system', 'connect', 'connect 客户端连接: pCquWmPP9ZuVXo4vAAAB', 'System', '2025-06-09 21:15:05');
INSERT INTO `system_log` VALUES (3146, 'system', 'disconnect', 'disconnect 客户端断开: pCquWmPP9ZuVXo4vAAAB, 原因: client namespace disconnect', 'System', '2025-06-09 21:15:07');
INSERT INTO `system_log` VALUES (3147, 'system', 'connect', 'connect 客户端连接: xf_gGFMd6k4FLZAIAAAD', 'System', '2025-06-09 21:53:52');
INSERT INTO `system_log` VALUES (3148, 'system', 'disconnect', 'disconnect 客户端断开: xf_gGFMd6k4FLZAIAAAD, 原因: client namespace disconnect', 'System', '2025-06-09 21:53:54');
INSERT INTO `system_log` VALUES (3149, 'system', 'connect', 'connect 客户端连接: zcSdRPDokDc2gJHjAAAF', 'System', '2025-06-09 22:05:03');
INSERT INTO `system_log` VALUES (3150, 'system', 'disconnect', 'disconnect 客户端断开: zcSdRPDokDc2gJHjAAAF, 原因: transport close', 'System', '2025-06-09 22:05:05');
INSERT INTO `system_log` VALUES (3151, 'system', 'connect', 'connect 客户端连接: ILhB0LJtbRxE-ckjAAAH', 'System', '2025-06-09 22:05:06');
INSERT INTO `system_log` VALUES (3152, 'system', 'disconnect', 'disconnect 客户端断开: ILhB0LJtbRxE-ckjAAAH, 原因: client namespace disconnect', 'System', '2025-06-09 22:05:08');
INSERT INTO `system_log` VALUES (3153, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-09 22:06:02');
INSERT INTO `system_log` VALUES (3154, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-09 22:43:03');
INSERT INTO `system_log` VALUES (3155, 'system', 'connect', 'connect 客户端连接: mTgJRoKmQKCZQ_caAAAJ', 'System', '2025-06-09 22:44:30');
INSERT INTO `system_log` VALUES (3156, 'system', 'disconnect', 'disconnect 客户端断开: mTgJRoKmQKCZQ_caAAAJ, 原因: client namespace disconnect', 'System', '2025-06-09 22:44:31');
INSERT INTO `system_log` VALUES (3157, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-10 16:00:21');
INSERT INTO `system_log` VALUES (3158, 'database', '更新', '更新 admin 更新了考试 (ID: 16) 的信息。', 'admin', '2025-06-10 16:00:56');
INSERT INTO `system_log` VALUES (3159, 'system', 'connect', 'connect 客户端连接: J_6v_5z9NIzGaQ8-AAAB', 'System', '2025-06-10 16:01:01');
INSERT INTO `system_log` VALUES (3160, 'system', 'disconnect', 'disconnect 客户端断开: J_6v_5z9NIzGaQ8-AAAB, 原因: client namespace disconnect', 'System', '2025-06-10 16:01:02');
INSERT INTO `system_log` VALUES (3161, 'auth', '登录成功', '登录成功 用户 \'S2023001\' (显示名: \'张伟\', ID: 8, Role: student) 登录成功.', 'S2023001', '2025-06-10 16:06:48');
INSERT INTO `system_log` VALUES (3162, 'auth', '登录成功', '登录成功 用户 \'admin\' (显示名: \'N/A\', ID: 1, Role: admin) 登录成功.', 'admin', '2025-06-11 14:29:34');

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户名',
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '邮箱',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
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
INSERT INTO `user` VALUES (1, 'admin', '$2a$10$CjLJ2/QuOu3bZGzf3u4SGOvNjDSNdodT/5G.6TQFh.oUsj.MCideG', 'admin@test.com', NULL, 'avatar-1749983233259-9f544742.png', '2025-02-20 21:45:19', '2025-06-15 18:27:13', 'admin', NULL);
INSERT INTO `user` VALUES (2, 'test', '$2b$10$MshDQphPxvIRK6mNiVd1f.8HhPV9ysV84hyUiRglzIzdXfuB0ETeC', 'test@example.com', NULL, NULL, '2025-02-20 21:45:19', '2025-04-06 02:07:25', 'student', NULL);
INSERT INTO `user` VALUES (3, 'chyinan', '$2b$10$LeimjP0GK2OC9DObsO9WvuvHdksCwQsXNVA3uHNjIBadcuD3nBgb6', '1817175451@qq.com', NULL, 'avatar-3-1745847609124-586820353.png', '2025-02-20 21:51:36', '2025-04-28 21:40:09', 'student', NULL);
INSERT INTO `user` VALUES (8, 'S2023001', '$2b$10$vvCCMqjv930BKa1I6IUYKeBt5HyDktViy/4unT.mQTAKfAHE1qczW', '1011@qq.com', NULL, NULL, '2025-06-04 22:48:28', '2025-06-06 15:11:42', 'student', '张伟');

-- ----------------------------
-- View structure for v_class_score_stats
-- ----------------------------
DROP VIEW IF EXISTS `v_class_score_stats`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_class_score_stats` AS select `c`.`id` AS `class_id`,`c`.`class_name` AS `class_name`,`c`.`teacher` AS `class_teacher`,`e`.`id` AS `exam_id`,`e`.`exam_name` AS `exam_name`,`e`.`exam_type` AS `exam_type`,date_format(`e`.`exam_date`,'%Y-%m-%d') AS `exam_date`,`ss`.`subject` AS `subject`,count(distinct `ss`.`student_id`) AS `student_count`,round(avg(`ss`.`score`),2) AS `average_score`,max(`ss`.`score`) AS `highest_score`,min(`ss`.`score`) AS `lowest_score`,round(std(`ss`.`score`),2) AS `score_stddev`,sum((case when (`ss`.`score` >= coalesce(`es`.`pass_score`,60.00)) then 1 else 0 end)) AS `passed_count`,round(((sum((case when (`ss`.`score` >= coalesce(`es`.`pass_score`,60.00)) then 1 else 0 end)) / count(distinct `ss`.`student_id`)) * 100),2) AS `pass_rate`,round(((sum((case when (`ss`.`score` >= 90) then 1 else 0 end)) / count(distinct `ss`.`student_id`)) * 100),2) AS `excellent_rate` from (((((`student_score` `ss` join `student` `s` on((`ss`.`student_id` = `s`.`id`))) join `class` `c` on((`s`.`class_id` = `c`.`id`))) join `exam` `e` on((`ss`.`exam_id` = `e`.`id`))) left join `subject` `sub` on((`ss`.`subject` = `sub`.`subject_name`))) left join `exam_subject` `es` on(((`ss`.`exam_id` = `es`.`exam_id`) and (`sub`.`id` = `es`.`subject_id`)))) group by `c`.`id`,`e`.`id`,`ss`.`subject`;

-- ----------------------------
-- View structure for v_student_score_stats
-- ----------------------------
DROP VIEW IF EXISTS `v_student_score_stats`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_student_score_stats` AS select `ss`.`id` AS `score_id`,`ss`.`student_id` AS `student_id`,`s`.`student_id` AS `student_number`,`s`.`name` AS `student_name`,`s`.`gender` AS `gender`,`c`.`id` AS `class_id`,`c`.`class_name` AS `class_name`,`c`.`teacher` AS `class_teacher`,`e`.`id` AS `exam_id`,`e`.`exam_name` AS `exam_name`,`e`.`exam_type` AS `exam_type`,date_format(`e`.`exam_date`,'%Y-%m-%d') AS `exam_date`,`e`.`status` AS `exam_status`,`ss`.`subject` AS `subject`,`sub`.`id` AS `subject_id`,`sub`.`subject_code` AS `subject_code`,`ss`.`score` AS `score`,coalesce(`es`.`full_score`,100.00) AS `full_score`,coalesce(`es`.`pass_score`,60.00) AS `pass_score`,coalesce(`es`.`weight`,1.00) AS `weight`,(`ss`.`score` >= coalesce(`es`.`pass_score`,60.00)) AS `is_passed`,round(((`ss`.`score` / coalesce(`es`.`full_score`,100.00)) * 100),2) AS `score_percentage`,(case when (`ss`.`score` >= 90) then '优秀' when (`ss`.`score` >= 80) then '良好' when (`ss`.`score` >= 70) then '中等' when (`ss`.`score` >= 60) then '及格' else '不及格' end) AS `score_level`,`ss`.`create_time` AS `create_time`,`ss`.`update_time` AS `update_time` from (((((`student_score` `ss` join `student` `s` on((`ss`.`student_id` = `s`.`id`))) join `class` `c` on((`s`.`class_id` = `c`.`id`))) join `exam` `e` on((`ss`.`exam_id` = `e`.`id`))) left join `subject` `sub` on((`ss`.`subject` = `sub`.`subject_name`))) left join `exam_subject` `es` on(((`ss`.`exam_id` = `es`.`exam_id`) and (`sub`.`id` = `es`.`subject_id`))));

-- ----------------------------
-- View structure for v_student_score_summary
-- ----------------------------
DROP VIEW IF EXISTS `v_student_score_summary`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_student_score_summary` AS select `ss`.`student_id` AS `student_id`,`s`.`student_id` AS `student_number`,`s`.`name` AS `student_name`,`c`.`class_name` AS `class_name`,`e`.`id` AS `exam_id`,`e`.`exam_name` AS `exam_name`,`e`.`exam_type` AS `exam_type`,date_format(`e`.`exam_date`,'%Y-%m-%d') AS `exam_date`,count(distinct `ss`.`subject`) AS `subject_count`,sum(`ss`.`score`) AS `total_score`,round(avg(`ss`.`score`),2) AS `average_score`,sum((case when (`ss`.`score` >= coalesce(`es`.`pass_score`,60.00)) then 1 else 0 end)) AS `passed_subjects`,round(((sum((case when (`ss`.`score` >= coalesce(`es`.`pass_score`,60.00)) then 1 else 0 end)) / count(distinct `ss`.`subject`)) * 100),2) AS `pass_rate`,max(`ss`.`score`) AS `highest_score`,min(`ss`.`score`) AS `lowest_score`,max(`ss`.`update_time`) AS `last_update_time` from (((((`student_score` `ss` join `student` `s` on((`ss`.`student_id` = `s`.`id`))) join `class` `c` on((`s`.`class_id` = `c`.`id`))) join `exam` `e` on((`ss`.`exam_id` = `e`.`id`))) left join `subject` `sub` on((`ss`.`subject` = `sub`.`subject_name`))) left join `exam_subject` `es` on(((`ss`.`exam_id` = `es`.`exam_id`) and (`sub`.`id` = `es`.`subject_id`)))) group by `ss`.`student_id`,`e`.`id`;

SET FOREIGN_KEY_CHECKS = 1;
