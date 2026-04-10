const express = require('express');
const cors = require('cors');

const readersRouter = require('./routes/readers');
const authRouter = require('./routes/auth');    
const loansRouter = require('./routes/loans');   

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Library API is running' });
});

app.use('/api/readers', readersRouter);
app.use('/api/auth', readersRouter);
app.use('/api/librarian/auth', authRouter);      // 你的代码
app.use('/api/loans', loansRouter);              // 上游代码

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