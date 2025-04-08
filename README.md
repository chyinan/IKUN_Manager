# IKUN Manager

## 项目简介
一个基于 Vue3 + Element Plus + TypeScript 开发的学员/员工信息管理系统。主要功能包括部门、员工、班级、学生、考试、成绩管理以及数据可视化等。

## 技术栈
- **前端**: Vue 3, TypeScript, Vite, Element Plus, Pinia, Vue Router, Axios, ECharts
- **后端**: Node.js, Express
- **数据库**: MySQL

## 功能特性
- 👤 **用户管理**: 登录、用户信息获取与展示
- 🏢 **部门管理**: 部门信息的增删改查
- 👨‍💼 **员工管理**: 员工信息的增删改查、关联部门
- 🎓 **班级管理**: 班级信息的增删改查、关联教师
- 🧑‍🎓 **学生管理**: 学生信息的增删改查、关联班级
- 📝 **考试管理**: 考试信息的增删改查、发布/取消发布
- 📊 **成绩管理**: 学生各科成绩的录入、查询、统计与导出
- 📈 **数据可视化**: 提供仪表盘展示核心统计数据 (如员工总数、班级数等)
- 📑 **日志管理**: 系统操作日志的记录与查询
- ✨ **前端体验**:
    - 基于 Element Plus 的美观 UI
    - 可搜索、筛选、分页的数据表格
    - 完善的表单校验
    - Axios 封装与请求/响应拦截
    - Pinia 状态管理 (用户状态持久化)
- 🔧 **开发支持**:
    - 全面使用 **TypeScript**，提供类型安全
    - **ESLint** 代码规范检查
    - 支持 **Mock 数据**，方便前后端分离开发 (`src/utils/request.ts`)
    - 清晰的模块化项目结构
- 📱 **响应式设计**: 适配不同设备屏幕 (部分页面)

## 开发环境准备

### 推荐的IDE配置

- [VSCode](https://code.visualstudio.com/)
- [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (需要禁用 Vetur)
- [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin)

### 环境要求
- Node.js 16+
- MySQL 8.0+
- npm 7+ (或 pnpm/yarn)

## 项目设置

### 安装依赖
```sh
npm install
# 或者
# pnpm install
# yarn install
```

### 配置数据库
1.  创建数据库
    ```sql
    CREATE DATABASE ikun_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    ```

2.  导入数据库文件 `ikun_db.sql`
    ```sh
    # 需要先安装 MySQL 客户端
    mysql -u root -p ikun_db < ikun_db.sql
    ```

3.  配置后端数据库连接
    修改 `src/server/config.js` 中的数据库连接信息:
    ```js
    db: {
      host: 'localhost',
      user: 'your_mysql_user', // 替换为你的 MySQL 用户名
      password: 'your_mysql_password', // 替换为你的 MySQL 密码
      database: 'ikun_db',
      port: 3306 // 默认端口
    }
    ```

### 开发环境运行
```sh
# 启动前端服务 (通常在 http://localhost:5173)
npm run dev

# 启动后端服务 (通常在 http://localhost:3000)
cd src/server
npm install # 首次需要安装后端依赖
npm run dev
```
确保前端项目中的 `src/utils/request.ts` 或相关配置文件中的 `baseURL` 指向正确的后端 API 地址 (例如 `http://localhost:3000/api`)。

### 生产环境构建
```sh
# 构建前端静态文件 (输出到 dist 目录)
npm run build

# (可选) 启动后端生产服务
cd src/server
npm run build # 如果后端有构建步骤
npm start     # 启动生产模式服务
```

### 代码检查与类型检查
```sh
# 运行 ESLint 代码检查和修复
npm run lint

# 运行 TypeScript 类型检查
npm run type-check
```

## 项目结构
```
IKUN_Manager/
├── public/                  # 静态资源 (会被直接复制)
├── src/                     # 前端源码 (Vue + TS)
│   ├── api/                # 后端 API 接口定义 (基于 Axios 封装)
│   ├── assets/             # 静态资源 (CSS, 图片等, 会被 Vite 处理)
│   ├── components/         # 全局公共 Vue 组件
│   ├── layouts/            # 页面布局组件
│   ├── router/             # Vue Router 路由配置
│   ├── stores/             # Pinia 状态管理模块 (例如 user.ts)
│   ├── types/              # 全局 TypeScript 类型定义
│   ├── utils/              # 工具函数 (请求封装, 日志, 验证, 导出等)
│   └── views/              # 页面视图组件 (按模块划分)
├── src/server/              # 后端源码 (Express + Node.js)
│   ├── config.js           # 配置文件 (数据库连接, 服务器端口等)
│   ├── db.js               # 数据库连接封装
│   ├── routes/             # API 路由定义 (例如 employee.js, class.js)
│   ├── services/           # 业务逻辑处理服务 (从 routes 调用)
│   ├── utils/              # 后端工具函数
│   └── server.js           # Express 应用入口文件
├── .env.development        # 开发环境变量 (Vite)
├── .env.production         # 生产环境变量 (Vite)
├── .eslintrc.cjs           # ESLint 配置文件
├── .gitignore              # Git 忽略文件配置
├── ikun_db.sql             # 数据库初始化脚本
├── index.html              # 前端 HTML 入口文件
├── package.json            # 项目依赖与脚本配置 (前端 + 后端脚本)
├── README.md               # 项目说明文件 (就是你现在看到的这个)
├── tsconfig.json           # TypeScript 整体配置文件
├── tsconfig.node.json      # TypeScript 针对 Node 环境的配置 (例如 Vite 配置)
└── vite.config.ts          # Vite 配置文件
```

## 开发规范
- 遵循 `.eslintrc.cjs` 中定义的 ESLint 规则
- 全面使用 TypeScript 编写代码，定义清晰的类型
- 组件、函数、关键逻辑需要添加 JSDoc 注释
- Git commit 信息遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范 (推荐)
- 保持代码简洁、可读、可维护

## 部署说明
1.  **构建前端**: 运行 `npm run build` 生成静态文件到 `dist` 目录。
2.  **部署后端**: 将 `src/server` 目录部署到服务器，安装依赖 (`npm install --production`) 并使用 `npm start` 或进程管理器 (如 PM2) 启动服务。
3.  **配置 Web 服务器 (如 Nginx)**:
    *   配置静态文件服务指向前端构建的 `dist` 目录。
    *   配置反向代理将 API 请求 (例如 `/api/*`) 转发到后端 Node.js 服务运行的端口。
    *   (可选) 配置 SSL 证书启用 HTTPS。

## 贡献指南
欢迎贡献！请遵循以下步骤：
1.  Fork 本仓库
2.  基于 `main` 分支创建新的特性分支 (例如 `feat/add-new-feature` 或 `fix/resolve-bug`)
3.  在你的分支上进行开发和提交代码
4.  确保通过代码检查 (`npm run lint`) 和类型检查 (`npm run type-check`)
5.  发起 Pull Request 到 `main` 分支，并清晰描述你的更改

## 开源许可
[MIT License](LICENSE)

## 联系方式
- 作者: [chyinan]
- Email: [chyinan2015@gmail.com]
