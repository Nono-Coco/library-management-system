const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const { requireLibrarianAuth } = require('../middleware/librarianAuth');

const router = express.Router();
const prisma = new PrismaClient();

const MAX_BORROW_LIMIT = 5;
const RENEW_DAYS = 14;

// 获取我的借阅列表
router.get('/my-borrows', requireAuth, async (req, res) => {
  try {
    const loans = await prisma.loan.findMany({
      where: { userId: req.user.id, returnDate: null },
      include: {
        copy: {
          include: { book: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });
    res.json({ loans });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取借阅列表失败' });
  }
});

// 获取可借副本列表
router.get('/available-copies/:bookId', requireAuth, async (req, res) => {
  try {
    const bookId = parseInt(req.params.bookId);
    const copies = await prisma.copy.findMany({
      where: {
        bookId: bookId,
        status: 'AVAILABLE'
      },
      select: {
        id: true,
        barcode: true,
        floor: true,
        libraryArea: true,
        shelfNo: true,
        shelfLevel: true
      }
    });
    res.json({ copies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取副本列表失败' });
  }
});

// 借阅图书（选择具体副本）
router.post('/borrow/:copyId', requireAuth, async (req, res) => {
  try {
    const copyId = parseInt(req.params.copyId);

    const copy = await prisma.copy.findUnique({
      where: { id: copyId },
      include: { book: true }
    });

    if (!copy) {
      return res.status(404).json({ message: '副本不存在' });
    }

    if (copy.status !== 'AVAILABLE') {
      return res.status(400).json({ message: '该副本不可借' });
    }

    const currentCount = await prisma.loan.count({
      where: { userId: req.user.id, returnDate: null }
    });
    if (currentCount >= MAX_BORROW_LIMIT) {
      return res.status(400).json({ message: `最多同时借阅${MAX_BORROW_LIMIT}本书` });
    }

    const existingLoan = await prisma.loan.findFirst({
      where: {
        userId: req.user.id,
        copy: { bookId: copy.bookId },
        returnDate: null
      }
    });
    if (existingLoan) {
      return res.status(400).json({ message: '您已借阅过这本书，请先归还' });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const loan = await prisma.loan.create({
      data: {
        copyId: copyId,
        userId: req.user.id,
        dueDate: dueDate,
        fineAmount: 0,
        finePaid: false,
        fineForgiven: false
      },
      include: {
        copy: {
          include: { book: true }
        }
      }
    });

    await prisma.copy.update({
      where: { id: copyId },
      data: { status: 'BORROWED' }
    });

    res.status(201).json({
      message: '借阅成功',
      loan: {
        id: loan.id,
        bookTitle: loan.copy.book.title,
        barcode: loan.copy.barcode,
        dueDate: loan.dueDate
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '借阅失败' });
  }
});

// 续借图书 - 使用 copyId
router.post('/renew', requireAuth, async (req, res) => {
  try {
    const { copyId } = req.body;
    
    if (!copyId) {
      return res.status(400).json({ message: '请提供副本ID' });
    }

    const loan = await prisma.loan.findFirst({
      where: {
        copyId: parseInt(copyId),
        userId: req.user.id,
        returnDate: null
      }
    });

    if (!loan) {
      return res.status(404).json({ message: '借阅记录不存在' });
    }

    const newDueDate = new Date(loan.dueDate);
    newDueDate.setDate(newDueDate.getDate() + RENEW_DAYS);

    await prisma.loan.update({
      where: { id: loan.id },
      data: { dueDate: newDueDate }
    });

    res.json({ 
      success: true, 
      message: '续借成功',
      newDueDate: newDueDate
    });
  } catch (error) {
    console.error('续借错误:', error);
    res.status(500).json({ message: '续借失败' });
  }
});

// 归还图书
router.post('/return/:loanId', requireAuth, async (req, res) => {
  try {
    const loanId = parseInt(req.params.loanId);

    const loan = await prisma.loan.findFirst({
      where: { id: loanId, userId: req.user.id, returnDate: null },
      include: { copy: true }
    });

    if (!loan) {
      return res.status(404).json({ message: '借阅记录不存在或已归还' });
    }

    await prisma.loan.update({
      where: { id: loanId },
      data: { returnDate: new Date() }
    });

    await prisma.copy.update({
      where: { id: loan.copyId },
      data: { status: 'AVAILABLE' }
    });

    res.json({ message: '归还成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '归还失败' });
  }
});

module.exports = router;