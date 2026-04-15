require('dotenv').config();

const prisma = require('./lib/prisma');
const express = require('express');
const cors = require('cors');

// 1. 引入路由文件
const booksRouter = require('./routes/books');
const logsRouter = require('./routes/logs');
const loansRouter = require('./routes/loans'); // 你的借阅路由
const authRouter = require('./routes/auth');   // 鉴权路由
const readersRouter = require('./routes/readers');
const readerBorrowRouter = require('./routes/reader-borrow');
const announcementsRouter = require('./routes/announcements');

const app = express();
const port = Number(process.env.PORT) || 3001;

// 必须的中间件
app.use(cors());
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: "ok", message: "Library API is running" });
});

// 2. 挂载路由 (合成了两边的要求)
app.use('/api/auth', authRouter);           // 学生登录
app.use('/api/librarian/auth', authRouter); // 馆员登录
app.use('/api/books', booksRouter);
app.use('/api/logs', logsRouter);
app.use('/api/loans', loansRouter);         // 你的借阅历史入口
app.use('/api/announcements', announcementsRouter);
app.use('/readers', readersRouter);
app.use('/loans', loansRouter);
app.use('/api/reader', readerBorrowRouter);

// 兼容旧路径（保留队友的设置）
app.use('/books', booksRouter);
app.use('/logs', logsRouter);

// 3. 错误处理 (保留队友新增的 404 和 500 处理)
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(error?.statusCode || 500).json({
    message: error?.message || 'Internal server error',
  });
});

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully...`);
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});