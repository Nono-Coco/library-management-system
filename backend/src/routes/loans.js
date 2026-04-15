// routes/loans.js - 馆员借书给学生 (完善版)

const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// 配置
const LOAN_DURATION_DAYS = 30;

// ==================== 权限检查中间件 ====================
function checkLibrarianOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: '未认证' });
  }
  if (req.user.role !== 'LIBRARIAN' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: '权限不足，需要馆员或管理员权限' });
  }
  next();
}

// ==================== 辅助函数 ====================

async function calculateDueDate(checkoutDate) {
  const dueDate = new Date(checkoutDate);
  dueDate.setDate(dueDate.getDate() + LOAN_DURATION_DAYS);
  return dueDate;
}

// ==================== 馆员专用 API ====================

// 馆员搜索学生
router.get('/users/search', requireAuth, checkLibrarianOrAdmin, async (req, res) => {
  try {
    const keyword = (req.query.keyword || '').trim();
    
    if (!keyword) {
      return res.status(400).json({ message: '请输入搜索关键词' });
    }

    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        OR: [
          { studentId: { contains: keyword } },
          { email: { contains: keyword } },
          { name: { contains: keyword } }
        ]
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

    // 获取每个学生的借阅统计
    const usersWithStats = await Promise.all(students.map(async (student) => {
      const currentBorrowCount = await prisma.loan.count({
        where: { 
          userId: student.id, 
          returnDate: null 
        }
      });
      
      const overdueLoans = await prisma.loan.count({
        where: {
          userId: student.id,
          returnDate: null,
          dueDate: { lt: new Date() }
        }
      });

      const totalBorrowed = await prisma.loan.count({
        where: { userId: student.id }
      });

      return {
        ...student,
        stats: {
          currentBorrowCount,
          hasOverdue: overdueLoans > 0,
          overdueCount: overdueLoans,
          totalBorrowed,
        }
      };
    }));

    res.json({ 
      success: true,
      users: usersWithStats 
    });
  } catch (error) {
    console.error('Search students error:', error);
    res.status(500).json({ message: '搜索学生失败' });
  }
});

// 馆员搜索图书
router.get('/books/search', requireAuth, checkLibrarianOrAdmin, async (req, res) => {
  try {
    const keyword = (req.query.keyword || '').trim();
    
    if (!keyword) {
      return res.status(400).json({ message: '请输入搜索关键词' });
    }

    const books = await prisma.book.findMany({
      where: {
        OR: [
          { title: { contains: keyword } },
          { isbn: { contains: keyword } },
          { author: { contains: keyword } }
        ]
      },
      include: {
        copies: {
          select: { 
            id: true,
            barcode: true,
            status: true,
            floor: true,
            libraryArea: true,
          }
        }
      }
    });

    const booksWithAvailability = books.map(book => {
      const availableCopies = book.copies.filter(c => c.status === 'AVAILABLE');
      const borrowedCopies = book.copies.filter(c => c.status === 'BORROWED');
      
      return {
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        genre: book.genre,
        description: book.description,
        language: book.language,
        availableCopies: availableCopies.length,
        totalCopies: book.copies.length,
        copies: book.copies.map(c => ({
          id: c.id,
          barcode: c.barcode,
          status: c.status,
          location: `${c.libraryArea || ''} ${c.floor || ''}楼`.trim()
        }))
      };
    });

    res.json({ 
      success: true,
      books: booksWithAvailability 
    });
  } catch (error) {
    console.error('Search books error:', error);
    res.status(500).json({ message: '搜索图书失败' });
  }
});

// 馆员借书给学生 (R1.1.12)
router.post('/lend', requireAuth, checkLibrarianOrAdmin, async (req, res) => {
  try {
    const { userId, bookId, copyId } = req.body;
    
    if (!userId || !bookId) {
      return res.status(400).json({ 
        success: false,
        message: '请选择学生和图书' 
      });
    }

    const studentId = Number(userId);
    const targetBookId = Number(bookId);

    // 验证学生
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        studentId: true,
        role: true,
      }
    });
    
    if (!student || student.role !== 'STUDENT') {
      return res.status(404).json({ 
        success: false,
        message: '学生不存在或不是学生账号' 
      });
    }

    // 验证图书
    const book = await prisma.book.findUnique({
      where: { id: targetBookId },
      include: { 
        copies: {
          where: copyId ? { id: Number(copyId) } : { status: 'AVAILABLE' },
          take: 1
        }
      }
    });
    
    if (!book) {
      return res.status(404).json({ 
        success: false,
        message: '图书不存在' 
      });
    }

    // 检查可用副本
    const availableCopies = copyId 
      ? book.copies 
      : book.copies.filter(copy => copy.status === 'AVAILABLE');
    
    if (availableCopies.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: '该图书没有可用副本' 
      });
    }

    // 检查学生是否已借阅此书（未归还）
    const existingLoan = await prisma.loan.findFirst({
      where: {
        userId: studentId,
        copy: { bookId: targetBookId },
        returnDate: null
      }
    });
    
    if (existingLoan) {
      return res.status(400).json({ 
        success: false,
        message: '该学生已经借阅了这本书且未归还' 
      });
    }

    // 检查学生是否有逾期图书
    const overdueLoans = await prisma.loan.findMany({
      where: {
        userId: studentId,
        returnDate: null,
        dueDate: { lt: new Date() }
      }
    });

    if (overdueLoans.length > 0) {
      return res.status(400).json({
        success: false,
        message: `该学生有 ${overdueLoans.length} 本逾期图书，请先归还后再借阅`,
        overdueCount: overdueLoans.length
      });
    }

    // 创建借阅记录
    const selectedCopy = availableCopies[0];
    const checkoutDate = new Date();
    const dueDate = await calculateDueDate(checkoutDate);

    const loan = await prisma.loan.create({
      data: {
        userId: studentId,
        copyId: selectedCopy.id,
        checkoutDate,
        dueDate,
        fineAmount: 0,
        finePaid: false,
        fineForgiven: false
      },
      include: {
        copy: {
          include: { book: true }
        },
        user: {
          select: {
            id: true,
            name: true,
            studentId: true,
            email: true
          }
        }
      }
    });

    // 更新副本状态
    await prisma.copy.update({
      where: { id: selectedCopy.id },
      data: { status: 'BORROWED' }
    });

    // 记录审计日志
    await prisma.auditLog.create({
      data: {
        userId: req.user.role === 'ADMIN' ? req.user.id : null,
        action: 'LIBRARIAN_LEND',
        entity: 'Loan',
        entityId: loan.id,
        detail: `${req.user.role === 'LIBRARIAN' ? '馆员' : '管理员'} ${req.user.name || req.user.email} 将《${book.title}》借给学生 ${student.name} (${student.studentId})，应还日期: ${dueDate.toLocaleDateString()}`
      }
    });

    res.status(201).json({
      success: true,
      message: `借书成功！《${book.title}》已借给 ${student.name}`,
      loan: {
        id: loan.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        studentName: student.name,
        studentId: student.studentId,
        checkoutDate: checkoutDate.toISOString(),
        dueDate: dueDate.toISOString(),
        copyBarcode: selectedCopy.barcode
      }
    });
  } catch (error) {
    console.error('Lend book error:', error);
    res.status(500).json({ 
      success: false,
      message: '借书失败，请稍后重试' 
    });
  }
});

// ==================== 4. 馆员还书 (R1.1.13) ====================

// 获取当前在借记录
router.get('/records', requireAuth, checkLibrarianOrAdmin, async (req, res) => {
  try {
    const { status } = req.query; // active, overdue, all
    
    let whereCondition = {};
    
    if (status === 'active') {
      whereCondition.returnDate = null;
    } else if (status === 'overdue') {
      whereCondition.returnDate = null;
      whereCondition.dueDate = { lt: new Date() };
    }
    
    const loans = await prisma.loan.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true
          }
        },
        copy: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                isbn: true,
                genre: true
              }
            }
          }
        }
      },
      orderBy: [
        { returnDate: 'asc' },
        { dueDate: 'asc' }
      ]
    });
    
    const loansWithStatus = loans.map(loan => {
      const now = new Date();
      const isOverdue = !loan.returnDate && loan.dueDate < now;
      const daysOverdue = isOverdue 
        ? Math.ceil((now - loan.dueDate) / (1000 * 60 * 60 * 24))
        : 0;
      
      return {
        ...loan,
        status: loan.returnDate ? 'returned' : (isOverdue ? 'overdue' : 'active'),
        daysOverdue,
        estimatedFine: isOverdue ? daysOverdue * 0.5 : 0
      };
    });
    
    res.json({ 
      success: true,
      loans: loansWithStatus,
      stats: {
        total: loans.length,
        active: loansWithStatus.filter(l => l.status === 'active').length,
        overdue: loansWithStatus.filter(l => l.status === 'overdue').length,
        returned: loansWithStatus.filter(l => l.status === 'returned').length
      }
    });
  } catch (error) {
    console.error('Fetch loan records error:', error);
    res.status(500).json({ message: '获取借阅记录失败' });
  }
});

// 馆员还书 (R1.1.13)
router.post('/return', requireAuth, checkLibrarianOrAdmin, async (req, res) => {
  try {
    const { loanId, waiveFine } = req.body;
    
    if (!loanId) {
      return res.status(400).json({ 
        success: false,
        message: '请选择要归还的借阅记录' 
      });
    }

    // 查找借阅记录
    const loan = await prisma.loan.findUnique({
      where: { id: Number(loanId) },
      include: { 
        copy: { 
          include: { book: true } 
        },
        user: {
          select: {
            id: true,
            name: true,
            studentId: true
          }
        }
      }
    });
    
    if (!loan) {
      return res.status(404).json({ 
        success: false,
        message: '借阅记录不存在' 
      });
    }
    
    if (loan.returnDate !== null) {
      return res.status(400).json({ 
        success: false,
        message: '该图书已经归还过了' 
      });
    }

    const returnDate = new Date();
    let fineAmount = 0;
    
    // 计算罚款
    if (returnDate > loan.dueDate) {
      const diffDays = Math.ceil((returnDate - loan.dueDate) / (1000 * 60 * 60 * 24));
      fineAmount = diffDays * 0.5; // 每天 0.5 元
    }

    // 如果免除了罚款
    const finalFine = waiveFine ? 0 : fineAmount;
    const fineForgiven = waiveFine && fineAmount > 0;

    // 更新借阅记录
    await prisma.loan.update({
      where: { id: Number(loanId) },
      data: { 
        returnDate,
        fineAmount: finalFine,
        finePaid: finalFine === 0,
        fineForgiven
      }
    });

    // 更新副本状态为可用
    await prisma.copy.update({
      where: { id: loan.copyId },
      data: { status: 'AVAILABLE' }
    });

    // 记录审计日志
    let logDetail = `${req.user.role === 'LIBRARIAN' ? '馆员' : '管理员'} ${req.user.name || req.user.email} 接收学生 ${loan.user?.name} 归还《${loan.copy?.book?.title}》`;
    
    if (finalFine > 0) {
      logDetail += `，罚款 ${finalFine} 元`;
    }
    if (fineForgiven) {
      logDetail += `（已免除原罚款 ${fineAmount} 元）`;
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user.role === 'ADMIN' ? req.user.id : null,
        action: 'LIBRARIAN_RETURN',
        entity: 'Loan',
        entityId: loan.id,
        detail: logDetail
      }
    });

    // 构建响应消息
    let message = `《${loan.copy?.book?.title}》已成功归还`;
    if (finalFine > 0) {
      message += `，逾期罚款 ${finalFine} 元`;
    }
    if (fineForgiven) {
      message += `（已免除罚款）`;
    }

    res.json({
      success: true,
      message,
      returnInfo: {
        loanId: loan.id,
        bookTitle: loan.copy?.book?.title,
        studentName: loan.user?.name,
        studentId: loan.user?.studentId,
        checkoutDate: loan.checkoutDate,
        dueDate: loan.dueDate,
        returnDate: returnDate,
        daysLate: fineAmount > 0 ? Math.ceil((returnDate - loan.dueDate) / (1000 * 60 * 60 * 24)) : 0,
        fineAmount: finalFine,
        originalFine: fineAmount,
        fineForgiven
      }
    });
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({ 
      success: false,
      message: '还书失败，请稍后重试' 
    });
  }
});

// 获取单个借阅记录详情
router.get('/records/:id', requireAuth, checkLibrarianOrAdmin, async (req, res) => {
  try {
    const loanId = Number(req.params.id);
    
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true
          }
        },
        copy: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                isbn: true,
                genre: true,
                description: true
              }
            }
          }
        }
      }
    });
    
    if (!loan) {
      return res.status(404).json({ message: '借阅记录不存在' });
    }
    
    const now = new Date();
    const isOverdue = !loan.returnDate && loan.dueDate < now;
    const daysOverdue = isOverdue 
      ? Math.ceil((now - loan.dueDate) / (1000 * 60 * 60 * 24))
      : 0;
    
    res.json({
      success: true,
      loan: {
        ...loan,
        status: loan.returnDate ? 'returned' : (isOverdue ? 'overdue' : 'active'),
        daysOverdue,
        estimatedFine: isOverdue ? daysOverdue * 0.5 : 0
      }
    });
  } catch (error) {
    console.error('Fetch loan detail error:', error);
    res.status(500).json({ message: '获取借阅详情失败' });
  }
});

// ==================== 学生借还书接口 ====================

// 学生获取自己的借阅记录
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const loans = await prisma.loan.findMany({
      where: { userId },
      include: {
        copy: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                author: true,
                isbn: true
              }
            }
          }
        }
      },
      orderBy: { checkoutDate: 'desc' }
    });
    
    res.json({ 
      success: true,
      loans 
    });
  } catch (error) {
    console.error('Fetch my loans error:', error);
    res.status(500).json({ message: '获取借阅记录失败' });
  }
});

module.exports = router;