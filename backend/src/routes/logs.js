const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// 获取系统日志列表
router.get('/', async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: true,
      },
    });

    res.json(logs);
  } catch (error) {
    next(error);
  }
});

module.exports = router;