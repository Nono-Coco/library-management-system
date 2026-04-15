// backend/src/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { signToken } = require('../lib/token');
const { signLibrarianToken } = require('../lib/librarianToken');

const router = express.Router();
const prisma = new PrismaClient();

// ==================== 辅助函数 ====================

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password && password.length >= 6;
}

// ==================== 统一登录接口 ====================

router.post('/login', async (req, res) => {
  const { email, password, type } = req.body;

  // 基本验证
  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码都是必需的' });
  }

  try {
    // 学生登录
    if (type === 'student' || !type) {
      const user = await prisma.user.findUnique({ 
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          passwordHash: true,
          role: true,
          studentId: true,
        }
      });

      if (!user) {
        return res.status(401).json({ error: '用户不存在', type: 'student' });
      }

      if (user.role === 'LIBRARIAN' || user.role === 'ADMIN') {
        return res.status(401).json({ 
          error: user.role === 'ADMIN' ? '请使用管理员入口登录' : '请使用馆员入口登录',
          type: user.role.toLowerCase() 
        });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: '密码错误', type: 'student' });
      }

      const token = signToken({ 
        sub: String(user.id), 
        id: user.id, 
        role: user.role,
        email: user.email 
      });

      const { passwordHash, ...userWithoutPassword } = user;

      return res.json({
        success: true,
        message: '学生登录成功',
        token,
        user: userWithoutPassword
      });
    }

    // 馆员登录
if (type === 'librarian') {
  // 从 User 表查询馆员
  const librarian = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email },
        { employeeId: email }
      ],
      role: 'LIBRARIAN'
    },
    select: {
      id: true,
      name: true,
      email: true,
      employeeId: true,
      passwordHash: true,
      role: true
    }
  });

  if (!librarian) {
    return res.status(401).json({ error: '工号不存在', type: 'librarian' });
  }

  const isValid = await bcrypt.compare(password, librarian.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: '密码错误', type: 'librarian' });
  }

  const token = signToken({ 
    sub: String(librarian.id), 
    id: librarian.id, 
    role: librarian.role,
    email: librarian.email 
  });

  const { passwordHash, ...librarianWithoutPassword } = librarian;

  return res.json({
    success: true,
    message: '馆员登录成功',
    token,
    librarian: librarianWithoutPassword
  });
}

    // 管理员登录
    if (type === 'admin') {
      const user = await prisma.user.findUnique({ 
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          passwordHash: true,
          role: true,
        }
      });

      if (!user) {
        return res.status(401).json({ error: '用户不存在', type: 'admin' });
      }

      if (user.role !== 'ADMIN') {
        return res.status(401).json({ error: '非管理员账号', type: 'admin' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: '密码错误', type: 'admin' });
      }

      const token = signToken({ 
        sub: String(user.id), 
        id: user.id, 
        role: user.role,
        email: user.email 
      });

      const { passwordHash, ...userWithoutPassword } = user;

      return res.json({
        success: true,
        message: '管理员登录成功',
        token,
        user: userWithoutPassword
      });
    }

    return res.status(400).json({ error: '无效的登录类型' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录过程中发生错误，请稍后重试' });
  }
});

// ==================== 学生登录接口 ====================

router.post('/login-student', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码都是必需的' });
  }

  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        studentId: true,
      }
    });

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    if (user.role !== 'STUDENT') {
      return res.status(401).json({ error: '该账号不是学生账号' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: '密码错误' });
    }

    const token = signToken({ 
      sub: String(user.id), 
      id: user.id, 
      role: user.role,
      email: user.email 
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      message: '学生登录成功',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ error: '登录过程中发生错误' });
  }
});

// ==================== 馆员登录接口 ====================

router.post('/login-librarian', async (req, res) => {
  const { employeeId, password } = req.body;

  if (!employeeId || !password) {
    return res.status(400).json({ error: '工号和密码都是必需的' });
  }

  try {
    // 从 User 表查询馆员
    const librarian = await prisma.user.findFirst({
      where: {
        OR: [
          { email: employeeId },
          { employeeId: employeeId }
        ],
        role: 'LIBRARIAN'
      },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        passwordHash: true,
        role: true
      }
    });

    if (!librarian) {
      return res.status(401).json({ error: '工号不存在' });
    }

    const isValid = await bcrypt.compare(password, librarian.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: '密码错误' });
    }

    const token = signToken({ 
      sub: String(librarian.id), 
      id: librarian.id, 
      role: librarian.role,
      email: librarian.email 
    });

    const { passwordHash, ...librarianWithoutPassword } = librarian;

    return res.json({
      success: true,
      message: '馆员登录成功',
      token,
      librarian: librarianWithoutPassword
    });
  } catch (error) {
    console.error('Librarian login error:', error);
    res.status(500).json({ error: '登录过程中发生错误' });
  }
});

// ==================== 管理员登录接口 ====================

router.post('/login-admin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码都是必需的' });
  }

  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
      }
    });

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    if (user.role !== 'ADMIN') {
      return res.status(401).json({ error: '非管理员账号' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: '密码错误' });
    }

    const token = signToken({ 
      sub: String(user.id), 
      id: user.id, 
      role: user.role,
      email: user.email 
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      message: '管理员登录成功',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: '登录过程中发生错误' });
  }
});

// ==================== 馆员注册接口 ====================

router.post('/register', async (req, res) => {
  const { employeeId, name, password } = req.body;

  // 验证输入
  if (!employeeId || !name || !password) {
    return res.status(400).json({ 
      error: '工号、姓名和密码都是必需的',
      fields: {
        employeeId: !employeeId,
        name: !name,
        password: !password
      }
    });
  }

  if (employeeId.length < 3) {
    return res.status(400).json({ error: '工号长度不能少于3位' });
  }

  if (name.length < 2) {
    return res.status(400).json({ error: '姓名长度不能少于2位' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度不能少于6位' });
  }

  try {
    // 检查工号是否已存在（在 User 表中）
    const existing = await prisma.user.findFirst({ 
      where: { employeeId } 
    });

    if (existing) {
      return res.status(409).json({ error: '该工号已被注册' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建馆员到 User 表
    const librarian = await prisma.user.create({
      data: { 
        email: `${employeeId.toLowerCase()}@librarian.com`, // 生成默认邮箱
        employeeId, 
        name, 
        passwordHash: hashedPassword,
        role: 'LIBRARIAN'
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        role: true,
        createdAt: true,
      }
    });

    return res.status(201).json({
      success: true,
      message: '注册成功',
      librarian
    });
  } catch (error) {
    console.error('Librarian registration error:', error);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

// ==================== 学生注册接口 ====================

router.post('/register-student', async (req, res) => {
  const { studentId, name, email, password } = req.body;

  // 验证输入
  if (!studentId || !name || !email || !password) {
    return res.status(400).json({ 
      error: '学号、姓名、邮箱和密码都是必需的' 
    });
  }

  if (studentId.length < 5) {
    return res.status(400).json({ error: '学号格式不正确' });
  }

  if (name.length < 2) {
    return res.status(400).json({ error: '姓名长度不能少于2位' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: '邮箱格式不正确' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ error: '密码长度不能少于6位' });
  }

  try {
    // 检查邮箱或学号是否已存在
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { studentId }
        ]
      }
    });

    if (existing) {
      if (existing.email === email) {
        return res.status(409).json({ error: '该邮箱已被注册' });
      }
      if (existing.studentId === studentId) {
        return res.status(409).json({ error: '该学号已被注册' });
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建学生
    const student = await prisma.user.create({
      data: {
        email,
        name,
        studentId,
        passwordHash: hashedPassword,
        role: 'STUDENT',
      },
      select: {
        id: true,
        name: true,
        email: true,
        studentId: true,
        role: true,
        createdAt: true,
      }
    });

    // 记录审计日志
    try {
      await prisma.auditLog.create({
        data: {
          userId: student.id,
          action: 'STUDENT_REGISTER',
          entity: 'User',
          entityId: student.id,
          detail: `Student ${studentId} (${name}) registered`
        }
      });
    } catch (logError) {
      console.error('Failed to create audit log:', logError);
    }

    return res.status(201).json({
      success: true,
      message: '注册成功',
      student
    });
  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

// ==================== 验证 Token 接口 ====================

router.get('/verify', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // 尝试作为用户 token 验证
    try {
      const { verifyToken } = require('../lib/token');
      const payload = verifyToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          studentId: true,
        }
      });

      if (user) {
        return res.json({
          valid: true,
          type: 'user',
          user
        });
      }
    } catch (userError) {
      // 用户 token 验证失败，尝试馆员 token
    }

    // 尝试作为馆员 token 验证
    try {
      const { verifyLibrarianToken } = require('../lib/librarianToken');
      const payload = verifyLibrarianToken(token);
      
      const librarian = await prisma.librarian.findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          employeeId: true,
          name: true,
        }
      });

      if (librarian) {
        return res.json({
          valid: true,
          type: 'librarian',
          librarian
        });
      }
    } catch (librarianError) {
      // 馆员 token 验证失败
    }

    return res.status(401).json({ valid: false, error: '无效的令牌' });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: '令牌验证失败' });
  }
});

// ==================== 修改密码接口 ====================

router.post('/change-password', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: '旧密码和新密码都是必需的' });
  }

  if (!validatePassword(newPassword)) {
    return res.status(400).json({ error: '新密码长度不能少于6位' });
  }

  try {
    // 尝试作为用户修改密码
    try {
      const { verifyToken } = require('../lib/token');
      const payload = verifyToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: payload.id }
      });

      if (user) {
        const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isValid) {
          return res.status(401).json({ error: '旧密码错误' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: hashedPassword }
        });

        return res.json({ success: true, message: '密码修改成功' });
      }
    } catch (userError) {
      // 用户 token 验证失败，尝试馆员 token
    }

    // 尝试作为馆员修改密码
    try {
      const { verifyLibrarianToken } = require('../lib/librarianToken');
      const payload = verifyLibrarianToken(token);
      
      const librarian = await prisma.librarian.findUnique({
        where: { id: payload.id }
      });

      if (librarian) {
        const isValid = await bcrypt.compare(oldPassword, librarian.password);
        if (!isValid) {
          return res.status(401).json({ error: '旧密码错误' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.librarian.update({
          where: { id: librarian.id },
          data: { password: hashedPassword }
        });

        return res.json({ success: true, message: '密码修改成功' });
      }
    } catch (librarianError) {
      // 馆员 token 验证失败
    }

    return res.status(401).json({ error: '无效的认证令牌' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: '密码修改失败' });
  }
});

module.exports = router;