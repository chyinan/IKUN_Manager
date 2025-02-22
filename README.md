# IKUN Manager

## 项目简介
一个基于Vue3 + Element Plus + TypeScript开发的学员信息管理系统。主要功能包括班级管理、学生管理、成绩管理以及数据可视化分析等。

## 技术栈
- Vue 3
- TypeScript
- Element Plus
- Vue Router
- Axios
- ECharts
- MySQL
- Express

## 功能特性
- 🎯 班级管理: 支持班级的增删改查
- 👨‍🎓 学生管理: 学生信息的录入、编辑和删除
- 📊 成绩管理: 支持多次考试成绩的录入和管理
- 📈 数据分析: 提供班级成绩分布、各科平均分等可视化分析
- 🔒 权限控制: 基于角色的访问控制系统
- 📱 响应式设计: 适配不同设备屏幕

## 开发环境准备

### 推荐的IDE配置

- [VSCode](https://code.visualstudio.com/) 
- [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (需要禁用Vetur)
- [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin)

### 环境要求
- Node.js 16+
- MySQL 8.0+
- npm 7+

## 项目设置

### 安装依赖
```sh
npm install
```

### 配置数据库
1. 创建数据库
```sql
CREATE DATABASE ikun_manager;
```

2. 导入数据库文件
```sh
mysql -u root -p ikun_manager < database/ikun_manager.sql
```

3. 配置数据库连接
修改 `server/config/db.js` 中的数据库配置

### 开发环境运行
```sh
# 启动前端服务
npm run dev

# 启动后端服务
cd server
npm install
npm run dev
```

### 生产环境构建
```sh
# 前端构建
npm run build

# 后端构建
cd server
npm run build
```

### 代码检查
```sh
npm run lint
```
