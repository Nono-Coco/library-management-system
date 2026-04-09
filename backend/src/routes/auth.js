const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = 'library-management-secret-key-2024';

// 注册接口
router.post('/register', async (req, res) => {
  const { employeeId, name, password } = req.body;

  if (!employeeId || !name || !password) {
    return res.status(400).json({ error: '请填写完整信息' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度不能少于6位' });
  }

  try {
    const existing = await prisma.librarian.findUnique({
      where: { employeeId: employeeId }
    });
    if (existing) {
      return res.status(400).json({ error: '工号已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const librarian = await prisma.librarian.create({
      data: {
        employeeId: employeeId,
        name: name,
        password: hashedPassword
      }
    });

    res.status(201).json({
      message: '注册成功',
      librarian: {
        id: librarian.id,
        employeeId: librarian.employeeId,
        name: librarian.name
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 登录接口
router.post('/login', async (req, res) => {
  const { employeeId, password } = req.body;

  if (!employeeId || !password) {
    return res.status(400).json({ error: '请填写工号和密码' });
  }

  try {
    const librarian = await prisma.librarian.findUnique({
      where: { employeeId: employeeId }
    });

    if (!librarian) {
      return res.status(401).json({ error: '工号或密码错误' });
    }

    const isValid = await bcrypt.compare(password, librarian.password);
    if (!isValid) {
      return res.status(401).json({ error: '工号或密码错误' });
    }

    const token = jwt.sign(
      { id: librarian.id, employeeId: librarian.employeeId, name: librarian.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '登录成功',
      token: token,
      librarian: {
        id: librarian.id,
        employeeId: librarian.employeeId,
        name: librarian.name
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '登录失败' });
  }
});

module.exports = router;