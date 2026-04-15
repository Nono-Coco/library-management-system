# library-management-system
Week 1-12 Software PM Course Project

# 图书馆管理系统 - 项目框架说明

> 本项目基于 **Vite + React + Tailwind CSS + shadcn/ui** 构建前端，**Node.js + Express + Prisma + SQLite** 构建后端，为课程项目提供完整的开发脚手架。

---

## 1. 技术栈总览

| 层级       | 技术                                                         |
| ---------- | ------------------------------------------------------------ |
| 前端       | React 18 + Vite 5 + Tailwind CSS 3 + shadcn/ui + Radix UI    |
| 后端       | Node.js + Express + Prisma (ORM) + SQLite                    |
| 工具       | npm / yarn, Git, VS Code / Cursor                            |

---

## 2. 项目结构

```
library-management-system/
├── frontend/                 # 前端项目 (React + Vite)
│   ├── src/
│   │   ├── components/       # 可复用组件（含 shadcn/ui 组件）
│   │   │   └── ui/           # shadcn/ui 生成的组件
│   │   ├── lib/              # 工具函数（如 cn 合并类名）
│   │   ├── App.jsx           # 根组件
│   │   ├── main.jsx          # 入口文件
│   │   └── index.css         # Tailwind 指令
│   ├── index.html
│   ├── tailwind.config.js    # Tailwind 配置
│   ├── postcss.config.js     # PostCSS 配置
│   └── vite.config.js        # Vite 配置（含 @ 别名）
├── backend/                  # 后端项目 (Express + Prisma)
│   ├── src/
│   │   └── index.js          # Express 服务入口
│   ├── prisma/
│   │   ├── schema.prisma     # 数据模型定义
│   │   ├── seed.js           # 种子数据脚本
│   │   └── dev.db            # SQLite 数据库文件（自动生成）
│   ├── .env                  # 环境变量（DATABASE_URL 等）
│   └── package.json          # 后端依赖及脚本
├── .gitignore                # Git 忽略文件（Node 模板）
└── README.md                 # 本文件
```

---

## 3. 环境准备

### 3.1 必备软件
- Node.js **20.x LTS**（推荐）或 18.x
- npm 或 yarn
- Git
- VS Code（推荐安装：ESLint, Prettier, Prisma, Tailwind CSS 等扩展）

### 3.2 克隆仓库
```bash
git clone https://github.com/ZzCreative/library-management-system.git
cd library-management-system
```

---

## 4. 启动项目

### 4.1 前端
```bash
cd frontend
npm install          # 安装依赖
npm run dev          # 启动开发服务器
```
访问 http://localhost:5173

### 4.2 后端
```bash
cd backend
npm install          # 安装依赖
npm run dev          # 启动后端服务
```
访问 http://localhost:3001/health 测试 API 是否正常

### 4.3 数据库管理
```bash
cd backend
npx prisma studio    # 打开可视化数据管理界面 (http://localhost:5555)
```

---

## 5. 核心功能说明

### 5.1 数据库模型（Prisma）
已定义以下模型（位于 `backend/prisma/schema.prisma`）：

| 模型       | 说明                       |
| ---------- | -------------------------- |
| User       | 用户（角色：学生/馆员/管理员） |
| Book       | 图书信息（含ISBN、馆藏位置等） |
| Loan       | 借阅记录（含逾期罚款）       |
| Rating     | 图书评分（1~5星）           |
| Hold       | 预约排队                   |
| Wishlist   | 收藏夹                     |
| Config     | 系统配置（如罚款费率）       |
| AuditLog   | 操作审计日志               |

**重要**：模型定义中已包含默认种子数据（4个用户、20本书、罚款配置）。

### 5.2 后端 API 示例
目前只有一个健康检查接口：
- `GET /health` → 返回 `{ status: "ok", message: "Library API is running" }`

后续开发时，可在 `backend/src/index.js` 中添加更多路由（建议按模块拆分到 `routes/` 目录）。

### 5.3 前端页面与组件
- 已集成 Tailwind CSS 和 shadcn/ui，可直接使用 `@/components/ui/button` 等组件。
- 页面结构目前为默认 Vite 模板，后续可替换为实际业务页面。
- 路径别名 `@` 指向 `src`，导入时使用 `@/components/...`。

---

## 6. 开发规范

### 6.1 分支管理
- `main` – 生产环境稳定分支
- `dev` – 开发主分支，所有功能分支从此拉出
- `feature/xxx` – 具体功能分支，完成后合并到 `dev`

### 6.2 代码提交
```bash
git add .
git commit -m "type: 简短描述"    # 如 "feat: 添加图书列表页"
git push origin 当前分支名
```
常用类型：`feat`、`fix`、`docs`、`style`、`refactor`、`test`、`chore`

### 6.3 协作流程
1. 从 `dev` 创建自己的功能分支：`git checkout -b feature/你的功能`
2. 开发并测试
3. 推送分支到远程：`git push origin feature/你的功能`
4. 在 GitHub 上创建 Pull Request 到 `dev`
5. 代码审查通过后合并

---

## 7. 常用命令速查

| 位置   | 命令                     | 说明                         |
| ------ | ------------------------ | ---------------------------- |
| 前端   | `npm run dev`            | 启动开发服务器               |
| 前端   | `npm run build`          | 构建生产版本                 |
| 后端   | `npm run dev`            | 启动后端（nodemon 热重载）   |
| 后端   | `npx prisma studio`      | 打开数据库管理界面           |
| 后端   | `npx prisma migrate dev` | 创建迁移（修改模型后执行）   |
| 后端   | `npx prisma db seed`     | 重新执行种子数据（重置数据） |

---

## 8. 注意事项

### 8.1 环境变量
- 后端依赖 `.env` 文件，已包含 `DATABASE_URL`，**不要提交此文件**（已在 `.gitignore`）。
- 前端无需额外环境变量。

### 8.2 数据库迁移
- 若修改 `schema.prisma`，务必执行 `npx prisma migrate dev --name 描述` 生成迁移文件，并提交迁移文件。
- 迁移会同步数据库结构，**不会删除现有数据**（但若修改字段可能需手动处理）。

### 8.3 添加 shadcn/ui 组件
```bash
cd frontend
npx shadcn@latest add [组件名]   # 例如 button, card, dialog
```
组件会自动添加到 `frontend/src/components/ui/`，并安装必要依赖。

### 8.4 新增 API 路由
推荐在 `backend/src` 下创建 `routes/` 文件夹，拆分路由模块，然后在 `index.js` 中挂载。

---

## 9. 常见问题

### Q1: 前端启动后样式丢失？
- 确保 `frontend/src/index.css` 包含 Tailwind 指令（已配置），且 `tailwind.config.js` 中 `content` 正确指向所有 JSX 文件。

### Q2: 后端连接数据库失败？
- 检查 `backend/.env` 中的 `DATABASE_URL` 是否为 `file:./prisma/dev.db`（相对路径正确）。
- 确保已运行过 `npx prisma migrate dev`。

### Q3: 如何重置数据库并重新生成种子数据？
```bash
cd backend
npx prisma migrate reset   # 会删除并重建数据库，自动执行 seed
```

### Q4: 如何查看 Prisma 生成的 TypeScript 类型？
运行 `npx prisma generate` 后，可在 `node_modules/.prisma/client` 查看类型定义（用于 IDE 自动补全）。

---

## 10. 后续开发建议

- **前端任务**：实现图书检索、借阅管理、用户登录、个人中心等页面，复用 shadcn/ui 组件。
- **后端任务**：为每个模型编写 RESTful API（CRUD），实现 JWT 认证、权限控制、罚款计算等业务逻辑。
- **数据库**：根据需要添加索引、复合唯一约束，或补充更多种子数据。

---

## 版本要求

为保证项目在各成员机器上运行一致，请严格按照以下版本配置开发环境。

| 技术/工具                | 推荐版本                | 备注                               |
| ------------------------ | ----------------------- | ---------------------------------- |
| Node.js                  | 20.x LTS                | 必须为 v18 以上，推荐 v20          |
| npm                      | 10.x                    | 与 Node.js 20 配套                 |
| React                    | 18.3.x                  | 由 Vite 模板生成，无需单独安装     |
| Vite                     | 5.4.x                   | 脚手架自动指定                     |
| Tailwind CSS             | 3.4.x                   | 已锁定在 package.json 中            |
| shadcn/ui                | latest (CLI)            | 初始化时选择 Default / Slate       |
| Prisma                   | 6.19.x                  | 已安装，后续升级需团队协商         |
| Express                  | 5.2.x                   |                                   |
| SQLite                   | 3.x                     | 嵌入式数据库，无需单独安装         |

### 检查当前版本

```bash
node -v   # 应显示 v20.x.x
npm -v    # 应显示 10.x.x
```

若版本不符，建议使用 [nvm-windows](https://github.com/coreybutler/nvm-windows) 或 [nvm](https://github.com/nvm-sh/nvm) 切换 Node 版本。

### 依赖锁定

- `package-lock.json` 已提交至仓库，请使用 `npm ci` 安装依赖以确保版本完全一致。
- 添加新依赖时，请确保 `package.json` 中的版本号使用 `^` 或 `~` 合理范围，避免自动升级导致不兼容。

---
