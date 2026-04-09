const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const MAX_BORROW_LIMIT = 3;      // 学生最多借3本
const LOAN_DURATION_DAYS = 30;   // 借期30天

// 辅助函数：获取学生当前借阅数量（未归还）
async function getCurrentBorrowCount(userId) {
  return await prisma.loan.count({
    where: {
      userId,
      returnDate: null
    }
  });
}

// 辅助函数：检查学生是否有逾期未还的图书
async function hasOverdueLoans(userId) {
  const count = await prisma.loan.count({
    where: {
      userId,
      returnDate: null,
      dueDate: { lt: new Date() }
    }
  });
  return count > 0;
}

// 1. 搜索学生（馆员/管理员专用）
router.get('/users/search', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'LIBRARIAN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Librarian or Admin only.' });
    }

    const { keyword } = req.query;
    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({ message: 'Keyword is required' });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { studentId: { contains: keyword } },
          { email: { contains: keyword.toLowerCase() } }
        ],
        role: 'STUDENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        studentId: true,
        role: true
      },
      take: 20
    });

    // 附加当前借阅数量和逾期状态
    const usersWithStatus = await Promise.all(users.map(async (user) => {
      const currentCount = await getCurrentBorrowCount(user.id);
      const hasOverdue = await hasOverdueLoans(user.id);
      return {
        ...user,
        currentBorrowCount: currentCount,
        hasOverdue,
        canBorrow: (currentCount < MAX_BORROW_LIMIT) && !hasOverdue
      };
    }));

    res.json({ users: usersWithStatus });
  } catch (error) {
    next(error);
  }
});

// 2. 搜索图书（馆员/管理员专用）
router.get('/books/search', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'LIBRARIAN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Librarian or Admin only.' });
    }

    const { keyword } = req.query;
    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({ message: 'Keyword is required' });
    }

    const books = await prisma.book.findMany({
      where: {
        OR: [
          { title: { contains: keyword } },
          { isbn: { contains: keyword } }
        ]
      },
      select: {
        id: true,
        title: true,
        author: true,
        isbn: true,
        availableCopies: true,
        totalCopies: true
      },
      take: 20
    });

    res.json({ books });
  } catch (error) {
    next(error);
  }
});

// 3. 馆员借出图书给学生
router.post('/lend', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'LIBRARIAN' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Librarian or Admin only.' });
    }

    const { userId, bookId } = req.body;
    if (!userId || !bookId) {
      return res.status(400).json({ message: 'userId and bookId are required' });
    }

    // 查询学生
    const student = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });
    if (!student || student.role !== 'STUDENT') {
      return res.status(404).json({ message: 'Student not found' });
    }

    // 查询图书
    const book = await prisma.book.findUnique({
      where: { id: parseInt(bookId) }
    });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    if (book.availableCopies <= 0) {
      return res.status(400).json({ message: 'No available copies of this book' });
    }

    // 检查是否重复借阅同一本未还
    const existingLoan = await prisma.loan.findFirst({
      where: {
        userId: student.id,
        bookId: book.id,
        returnDate: null
      }
    });
    if (existingLoan) {
      return res.status(400).json({ message: 'Student already borrowed this book and not returned' });
    }

    // 检查学生资格：借阅数量限制
    const currentCount = await getCurrentBorrowCount(student.id);
    if (currentCount >= MAX_BORROW_LIMIT) {
      return res.status(400).json({ message: `Student has already borrowed ${MAX_BORROW_LIMIT} books. Cannot lend more.` });
    }
    // 检查逾期
    const hasOverdue = await hasOverdueLoans(student.id);
    if (hasOverdue) {
      return res.status(400).json({ message: 'Student has overdue books. Please return them first.' });
    }

    // 创建借阅记录
    const checkoutDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + LOAN_DURATION_DAYS);

    const loan = await prisma.loan.create({
      data: {
        userId: student.id,
        bookId: book.id,
        checkoutDate,
        dueDate,
        fineAmount: 0,
        finePaid: false,
        fineForgiven: false
      }
    });

    // 减少图书可借副本数
    await prisma.book.update({
      where: { id: book.id },
      data: { availableCopies: { decrement: 1 } }
    });

    // 审计日志
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'LEND_BOOK',
        entity: 'Loan',
        entityId: loan.id,
        detail: `Librarian ${req.user.email} lent "${book.title}" to student ${student.email}. Due date: ${dueDate.toISOString()}`
      }
    });

    res.status(201).json({
      message: 'Book lent successfully',
      loan: {
        id: loan.id,
        bookTitle: book.title,
        studentName: student.name,
        checkoutDate,
        dueDate
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;