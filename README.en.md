# IKUN Manager
<div align=center><img src="docs/logo.png"/></div>

<div align=center>
  <a href="./README.md">中文</a> / <a href="./README.en.md">English</a>
</div>

## Introduction
A student/employee information management system developed based on Vue3 + Element Plus + TypeScript, which can be **run on the Web or packaged as a desktop application**. It not only includes complete CRUD functionalities for core modules like **users, departments, employees, classes, students, exams, and grades**, but also implements a series of advanced features. For example: **multi-dimensional grade statistics and ranking analysis, a notification system with rich text support, a mailbox system for communication between students and administrators, flexible system configurations (e.g., regex validation, log retention policies), and the ability to be packaged as a cross-platform desktop application**. It aims to provide a comprehensive and user-friendly integrated management solution.

## Tech Stack
- **Frontend**: Vue 3, TypeScript, Vite, Element Plus, Pinia, Vue Router, Axios, ECharts, Socket.IO Client, Sass, Day.js, WangEditor
- **Backend**: Node.js, Express, MySQL, JSON Web Token (JWT), Socket.IO, node-cron, multer, xlsx, papaparse, body-parser, cors
- **Desktop**: Electron, electron-builder

## Features
- 👤 **User Management**: Login, user info retrieval, **avatar upload and profile updates**
- 🏢 **Department Management**: CRUD operations, **data import/export (Excel/CSV)**
- 👨‍💼 **Employee Management**: CRUD operations, department association, **data import/export (Excel/CSV)**
- 🎓 **Class Management**: CRUD operations, teacher association, **data import/export (Excel/CSV)**
- 🧑‍🎓 **Student Management**: CRUD operations, class association, **data import/export (Excel/CSV)**
- 📝 **Exam Management**: CRUD operations, publish/unpublish, **link exams to classes and subjects**
- 📊 **Grade Management**:
    - Entry, query, statistics, and export of student scores for each subject
    - **Generate detailed score reports**: Includes multi-dimensional analysis such as **class/grade rankings** for individual subjects and total scores, average scores, and highest scores
- 📢 **Announcement System**:
    - Admins can create, publish, and manage announcements using a **rich text editor**
    - Real-time display on the student portal homepage timeline
- 📬 **Mailbox System**:
    - Students can create issue threads and send messages
    - Admins can reply and **update the processing status** (e.g., Replied, Resolved)
- 🖼️ **Carousel Management**:
    - Admins can upload and manage carousel images for the portal homepage
    - Configurable carousel interval time
- 🚪 **Student Portal**:
    - **A dedicated interface for students**, separate from the admin panel
    - View personal grades, detailed reports, upcoming exams, announcements, and send/receive mail
- 📈 **Data Visualization**: Dashboard displaying key statistical data
- 📑 **Log Management**: System operation log recording and querying, **delete confirmation**, **real-time log push via WebSockets**, **configurable retention days and automatic cleanup**
- ⚙️ **System Settings**: Configure **regular expressions** for student/employee ID validation, set log retention days
- ✨ **Frontend Experience**:
    - Beautiful UI based on Element Plus with **dark mode** support
    - Data tables with search, filter, and pagination
    - Comprehensive form validation
    - Axios encapsulation with request/response interceptors
    - Pinia for state management (persistent user state)
- 🔧 **Development Support**:
    - Fully written in **TypeScript** for type safety
    - **ESLint** for code linting
    - Supports **Mock data** for separated frontend/backend development (`src/utils/request.ts`)
    - Clear, modular project structure
- 🖥️ **Desktop Support (Electron)**:
    - Can be packaged into desktop applications for Windows, macOS, and Linux
    - **Immersive custom title bar** (Windows/Linux)
    - Supports **hot reloading** in the development environment

## Development Setup

### Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/)
- [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (Vetur must be disabled)
- [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin)

### Environment Requirements
- Node.js 16+
- MySQL 8.0+
- npm 7+ (or pnpm/yarn)

## Project Setup

### Install Dependencies
```sh
npm install
# Install backend dependencies (if not already installed)
cd src/server
npm install
cd ../..
# Install Electron-related dependencies (if not already installed)
npm install --save-dev electron electron-builder concurrently cross-env
```

### Configure Database
1.  Create the database
    ```sql
    CREATE DATABASE ikun_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    ```

2.  Import the database file `ikun_db.sql`
    ```sh
    # MySQL client must be installed
    mysql -u root -p ikun_db < ikun_db.sql
    ```

3.  Configure backend database connection
    Modify the database connection info in `src/server/config.js`:
    ```js
    db: {
      host: 'localhost',
      user: 'your_mysql_user', // Replace with your MySQL username
      password: 'your_mysql_password', // Replace with your MySQL password
      database: 'ikun_db',
      port: 3306 // Default port
    }
    ```

### Running in Development

**Method 1: Run in a Web Browser (Separated Frontend/Backend)**
```sh
# 1. Start the backend service (defaults to http://localhost:3000)
cd src/server
node server.js # or use a tool like nodemon

# 2. Start the frontend service from the project root (defaults to http://localhost:5173)
cd ../..
npm run dev
```
Then open `http://localhost:5173` in your browser.

**Method 2: Run as an Electron Desktop App (with Hot Reload)**
```sh
# 1. Ensure the backend service is running (see step 1 in Method 1)

# 2. Run the Electron development script from the project root
npm run electron:dev
```
This will start both the Vite dev server and the Electron window. The window will load the Vite service and support hot reloading.

### Building for Production

**Build for Web:**
```sh
# Build frontend static files (output to dist directory)
npm run build
```
Deploy the `dist` directory to a web server and ensure the backend service is running.

**Build for Electron Desktop App:**
```sh
# Build frontend + package Electron app (output to dist_electron directory)
npm run electron:build
```
This first builds the Vue app to `dist`, then packages it using `electron-builder`.

### Linting and Type Checking
```sh
# Run ESLint to check and fix code
npm run lint

# Run TypeScript type check
npm run type-check
```

## Project Structure
```
IKUN_Manager/
├── build/                   # Electron packaging resources (e.g., icons)
├── dist/                    # Frontend build output (Web)
├── dist_electron/           # Electron build output (Desktop)
├── electron/                # Electron main process and preload scripts
│   ├── main.js
│   └── preload.js
├── public/                  # Static assets (copied directly)
├── src/                     # Frontend source code (Vue + TS)
│   ├── api/
│   ├── assets/
│   ├── components/
│   ├── layouts/
│   ├── router/
│   ├── stores/
│   ├── types/
│   ├── utils/
│   └── views/
├── src/server/              # Backend source code (Express + Node.js)
│   ├── uploads/            # File upload directory
│   ├── config.js
│   ├── db.js
│   ├── services/
│   ├── node_modules/       # Backend dependencies
│   ├── package.json        # Backend dependency config
│   └── server.js
├── .env.development
├── .env.production
├── .eslintrc.cjs
├── .gitignore
├── ikun_db.sql              # Database initialization script
├── index.html
├── package.json             # Project dependencies and scripts (Frontend + Electron)
├── README.md
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Development Guidelines
- Follow the ESLint rules defined in `.eslintrc.cjs`
- Write all code in TypeScript with clear type definitions
- Add JSDoc comments for components, functions, and key logic
- Git commit messages should follow the [Conventional Commits](https://www.conventionalcommits.org/) specification (recommended)
- Keep code clean, readable, and maintainable

## Deployment

### Web Version
1.  **Build Frontend**: Run `npm run build` to generate static files in the `dist` directory.
2.  **Deploy Backend**: Deploy the `src/server` directory to a server, install dependencies (`npm install --production`), and start the service with `node server.js` or a process manager (like PM2).
3.  **Configure Web Server (e.g., Nginx)**:
    *   Configure static file serving to point to the frontend's `dist` directory.
    *   Configure a reverse proxy to forward API requests (e.g., `/api/*`) to the port where the Node.js service is running.
    *   (Optional) Configure an SSL certificate to enable HTTPS.

### Desktop App Version
1.  Run `npm run electron:build` to generate the installer for the target platform (located in the `dist_electron` directory).

## Contribution Guide
Contributions are welcome! Please follow these steps:
1.  Fork this repository
2.  Create a new feature branch based on `main` (e.g., `feat/add-new-feature` or `fix/resolve-bug`)
3.  Develop and commit your code on your branch
4.  Ensure that your code passes linting (`npm run lint`) and type checks (`npm run type-check`)
5.  Create a Pull Request to the `main` branch with a clear description of your changes

## License
[MIT License](LICENSE)

## Contact
- Author: [chyinan]
- Email: [chyinan2015@gmail.com] 