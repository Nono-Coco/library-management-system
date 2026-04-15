const express = require('express');
const cors = require('cors');

<<<<<<< HEAD
// 导入所有路由
const readersRouter = require('./routes/readers');
const authRouter = require('./routes/auth');
const loansRouter = require('./routes/loans');
const booksRouter = require('./routes/books');        // ✅ 添加图书路由
=======
const readersRouter = require('./routes/readers');
const authRouter = require('./routes/auth');
const loansRouter = require('./routes/loans');
>>>>>>> ddb6f928a0a4d415de4bcd19023920f056be6972
const announcementsRouter = require('./routes/announcements');

const app = express();

<<<<<<< HEAD
// CORS 配置
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Library API is running',
    timestamp: new Date().toISOString()
  });
});

// API 路由挂载
app.use('/api/readers', readersRouter);
app.use('/api/auth', authRouter);           // 认证路由（登录、注册）
app.use('/api/books', booksRouter);         // ✅ 图书管理路由
app.use('/api/loans', loansRouter);         // 借阅管理路由
app.use('/api/announcements', announcementsRouter);

// 404 处理
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: `Route ${req.method} ${req.path} not found` 
  });
});

// 全局错误处理
app.use((error, req, res, next) => {
  // Prisma 唯一约束冲突
=======
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Library API is running' });
});

app.use('/api/readers', readersRouter);
app.use('/api/auth', authRouter);
app.use('/api/librarian/auth', authRouter);
app.use('/api/loans', loansRouter);
app.use('/api/announcements', announcementsRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, req, res, next) => {
>>>>>>> ddb6f928a0a4d415de4bcd19023920f056be6972
  if (error && error.code === 'P2002') {
    const target = Array.isArray(error.meta?.target)
      ? error.meta.target.join(', ')
      : 'field';

    return res.status(409).json({
<<<<<<< HEAD
      success: false,
      message: `A record with that ${target} already exists.`,
      error: error.code
    });
  }

  // Prisma 记录不存在
  if (error && error.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found',
      error: error.code
    });
  }

  // JWT 错误
  if (error && error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (error && error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
=======
      message: `A record with that ${target} already exists.`,
>>>>>>> ddb6f928a0a4d415de4bcd19023920f056be6972
    });
  }

  console.error('Unhandled error:', error);

  res.status(error?.statusCode || 500).json({
<<<<<<< HEAD
    success: false,
=======
>>>>>>> ddb6f928a0a4d415de4bcd19023920f056be6972
    message: error?.message || 'Internal server error',
  });
});

module.exports = app;