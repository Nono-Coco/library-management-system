<<<<<<< HEAD
// routes/loans.js - 馆员借书给学生 (完善版)

=======
>>>>>>> ddb6f928a0a4d415de4bcd19023920f056be6972
const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

<<<<<<< HEAD
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
=======
// 配置：学生最大借阅数量（可以从 Config 表读取）
const MAX_BORROW_STUDENT = 3;
const LOAN_DURATION_DAYS = 30;

// ================== 辅助函数 ==================

// 检查用户是否有逾期未还图书
async function hasOverdueLoans(userId) {
  const overdueLoans = await prisma.loan.findMany({
    where: {
      userId,
      returnDate: null,
      dueDate: { lt: new Date() }
    }
  });
  return overdueLoans.length > 0;
}

// 获取用户当前借阅数量（未归还的）
async function getCurrentBorrowCount(userId) {
  return await prisma.loan.count({
    where: {
      userId,
      returnDate: null
    }
  });
}

// 计算逾期罚款（示例：每天0.5元，从 Config 表读取）
async function calculateFine(dueDate, returnDate) {
  if (!returnDate || returnDate <= dueDate) return 0;
  const diffDays = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
  // 从 Config 表获取费率
  const fineRateConfig = await prisma.config.findUnique({
    where: { key: 'FINE_RATE_PER_DAY' }
  });
  const rate = fineRateConfig ? parseFloat(fineRateConfig.value) : 0.5;
  return diffDays * rate;
}

// ================== 借阅 API ==================

// 1. 学生/馆员 借书
router.post('/borrow/:bookId', requireAuth, async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // 1. 检查书籍是否存在且可借
    const book = await prisma.book.findUnique({
      where: { id: Number(bookId) }
    });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    if (book.availableCopies <= 0) {
      return res.status(400).json({ message: 'No available copies of this book' });
    }

    // 2. 检查是否已经借了同一本书且未归还
    const existingLoan = await prisma.loan.findFirst({
      where: {
        userId,
        bookId: Number(bookId),
        returnDate: null
      }
    });
    if (existingLoan) {
      return res.status(400).json({ message: 'You have already borrowed this book and not returned it' });
    }

    // 3. 权限检查（学生和馆员/管理员分开）
    if (userRole === 'STUDENT') {
      // 逾期检查
      const overdue = await hasOverdueLoans(userId);
      if (overdue) {
        return res.status(403).json({ message: 'You have overdue books. Please return them before borrowing new ones.' });
      }
      // 数量限制
      const currentCount = await getCurrentBorrowCount(userId);
      if (currentCount >= MAX_BORROW_STUDENT) {
        return res.status(403).json({ message: `You can only borrow up to ${MAX_BORROW_STUDENT} books at a time.` });
      }
    }

    // 4. 创建借阅记录
    const checkoutDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + LOAN_DURATION_DAYS);

    const loan = await prisma.loan.create({
      data: {
        bookId: Number(bookId),
        userId,
>>>>>>> ddb6f928a0a4d415de4bcd19023920f056be6972
        checkoutDate,
        dueDate,
        fineAmount: 0,
        finePaid: false,
        fineForgiven: false
<<<<<<< HEAD
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
=======
      }
    });

    // 5. 减少可借副本数
    await prisma.book.update({
      where: { id: Number(bookId) },
      data: { availableCopies: { decrement: 1 } }
    });

    // 6. 记录审计日志（可选）
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'BORROW',
        entity: 'Loan',
        entityId: loan.id,
        detail: `User ${userId} borrowed book ${bookId}`
>>>>>>> ddb6f928a0a4d415de4bcd19023920f056be6972
      }
    });

    res.status(201).json({
<<<<<<< HEAD
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
=======
      message: 'Book borrowed successfully',
      loan: {
        id: loan.id,
        bookTitle: book.title,
        checkoutDate,
        dueDate
      }
    });
  } catch (error) {
    next(error);
  }
});

// 2. 归还图书
router.post('/return/:loanId', requireAuth, async (req, res, next) => {
  try {
    const { loanId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const loan = await prisma.loan.findUnique({
      where: { id: Number(loanId) },
      include: { book: true }
    });
    if (!loan) {
      return res.status(404).json({ message: 'Loan record not found' });
    }

    // 权限：只有本人或管理员/馆员可以归还
    if (loan.userId !== userId && userRole === 'STUDENT') {
      return res.status(403).json({ message: 'You can only return your own borrowed books' });
    }

    if (loan.returnDate !== null) {
      return res.status(400).json({ message: 'Book already returned' });
    }

    const returnDate = new Date();
    let fine = 0;
    if (returnDate > loan.dueDate) {
      fine = await calculateFine(loan.dueDate, returnDate);
    }

    // 更新借阅记录
    const updatedLoan = await prisma.loan.update({
      where: { id: Number(loanId) },
      data: {
        returnDate,
        fineAmount: fine,
        finePaid: false   // 待支付
      }
    });

    // 增加可借副本数
    await prisma.book.update({
      where: { id: loan.bookId },
      data: { availableCopies: { increment: 1 } }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'RETURN',
        entity: 'Loan',
        entityId: loan.id,
        detail: `User ${userId} returned book ${loan.bookId}, fine: ${fine}`
      }
    });

    res.json({
      message: fine > 0 ? `Book returned late. Fine: ${fine}元` : 'Book returned successfully',
      fine
    });
  } catch (error) {
    next(error);
  }
});

// 3. 获取当前用户的借阅列表（未归还 + 历史）
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const loans = await prisma.loan.findMany({
      where: { userId },
      include: { book: true },
      orderBy: { checkoutDate: 'desc' }
    });
    res.json({ loans });
  } catch (error) {
    next(error);
  }
});

// 4. 管理员/馆员查看所有借阅记录
router.get('/admin/all', requireAuth, async (req, res, next) => {
  if (req.user.role === 'STUDENT') {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const loans = await prisma.loan.findMany({
      include: { user: true, book: true },
      orderBy: { checkoutDate: 'desc' }
    });
    res.json({ loans });
  } catch (error) {
    next(error);
  }
});

// 5. 管理员强制借书（跳过数量、逾期检查，但仍需检查库存）
router.post('/admin/force-borrow/:bookId/:userId', requireAuth, async (req, res, next) => {
  if (req.user.role === 'STUDENT') {
    return res.status(403).json({ message: 'Admin or librarian only' });
  }
  try {
    const { bookId, userId } = req.params;
    const targetUserId = Number(userId);
    const targetBookId = Number(bookId);

    const book = await prisma.book.findUnique({ where: { id: targetBookId } });
    if (!book || book.availableCopies <= 0) {
      return res.status(400).json({ message: 'Book not available' });
    }

    // 检查是否已经借了同一本未还
    const existing = await prisma.loan.findFirst({
      where: {
        userId: targetUserId,
        bookId: targetBookId,
        returnDate: null
      }
    });
    if (existing) {
      return res.status(400).json({ message: 'User already borrowed this book' });
    }

    const checkoutDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + LOAN_DURATION_DAYS);

    const loan = await prisma.loan.create({
      data: {
        bookId: targetBookId,
        userId: targetUserId,
        checkoutDate,
        dueDate
      }
    });

    await prisma.book.update({
      where: { id: targetBookId },
      data: { availableCopies: { decrement: 1 } }
    });

    res.status(201).json({ message: 'Force borrow successful', loan });
  } catch (error) {
    next(error);
>>>>>>> ddb6f928a0a4d415de4bcd19023920f056be6972
  }
});

module.exports = router;