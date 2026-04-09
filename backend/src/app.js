const express = require('express');
const cors = require('cors');

const readersRouter = require('./routes/readers');
const loansRouter = require('./routes/loans');   // 新增：借阅路由

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Library API is running' });
});

app.use('/api/readers', readersRouter);
app.use('/api/auth', readersRouter);
app.use('/api/loans', loansRouter);               // 新增：挂载借阅接口

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, req, res, next) => {
  if (error && error.code === 'P2002') {
    const target = Array.isArray(error.meta?.target)
      ? error.meta.target.join(', ')
      : 'field';

    return res.status(409).json({
      message: `A record with that ${target} already exists.`,
    });
  }

  console.error('Unhandled error:', error);

  res.status(error?.statusCode || 500).json({
    message: error?.message || 'Internal server error',
  });
});

module.exports = app;