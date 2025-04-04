# IKUN Manager 后端服务

这是IKUN Manager系统的后端服务，提供API接口供前端调用。

## 功能特性

- 员工管理API
- 部门管理API
- 班级管理API
- 学生管理API
- 考试管理API
- 成绩管理API
- 系统日志API

## 安装与配置

### 前提条件

- Node.js (v14+)
- MySQL (v8.0+)

### 安装步骤

1. 安装依赖

```bash
cd src/server
npm install
```

2. 配置数据库

编辑 `config.js` 文件，修改数据库连接信息：

```js
db: {
  host: 'localhost',
  user: 'root',
  password: '你的密码',
  database: 'ikun_db'
}
```

3. 启动服务

```bash
npm start
```

开发模式启动（自动重启）：

```bash
npm run dev
```

## API文档

### 员工管理API

- `GET /api/employee/list` - 获取员工列表
- `GET /api/employee/:id` - 获取员工详情
- `POST /api/employee/add` - 添加员工
- `PUT /api/employee/:id` - 更新员工
- `DELETE /api/employee/:id` - 删除员工
- `DELETE /api/employee/batch` - 批量删除员工
- `GET /api/employee/stats` - 获取员工统计数据

## 数据库结构

系统使用MySQL数据库，主要表结构如下：

- `user` - 用户表
- `department` - 部门表
- `employee` - 员工表
- `class` - 班级表
- `student` - 学生表
- `student_score` - 学生成绩表
- `exam` - 考试表
- `exam_class` - 考试班级关联表
- `subject` - 考试科目表
- `system_log` - 系统日志表

## 前后端集成

前端项目需要修改API请求地址，确保指向后端服务：

1. 修改前端项目中的 `src/utils/request.ts` 文件，将baseURL设置为后端服务地址：

```typescript
const service = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 5000
})
```

2. 确保前端项目中的API调用与后端API路径一致。 