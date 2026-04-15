const express = require('express');

const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const BOOK_SELECT = {
  id: true,
  title: true,
  author: true,
  isbn: true,
  genre: true,
  description: true,
  language: true,
  createdAt: true,
  updatedAt: true,
};

// ==================== 权限检查中间件 ====================
function checkLibrarianOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: '未认证' });
  }
  if (req.user.role !== 'LIBRARIAN' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: '权限不足，需要馆员或管理员权限' });
  }
  next();
}

// ==================== 公开接口（无需认证） ====================

// 获取所有图书
router.get('/', async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      orderBy: { id: 'asc' },
      include: {
        copies: {
          select: {
            id: true,
            barcode: true,
            status: true,
            floor: true,
            libraryArea: true,
            shelfNo: true,
            shelfLevel: true,
          }
        }
      }
    });

    const booksWithCount = books.map(book => {
      const availableCopies = book.copies.filter(c => c.status === 'AVAILABLE').length;
      const firstCopy = book.copies[0] || {};
      return {
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        genre: book.genre,
        description: book.description,
        language: book.language,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
        availableCopies: availableCopies,
        totalCopies: book.copies.length,
        floor: firstCopy.floor || 1,
        libraryArea: firstCopy.libraryArea || '',
        shelfNo: firstCopy.shelfNo || 'A',
        shelfLevel: firstCopy.shelfLevel || 1,
        copies: book.copies
      };
    });

    res.json({ data: booksWithCount });
  } catch (error) {
    console.error('Failed to fetch books:', error);
    res.status(500).json({ error: 'Failed to fetch books', detail: error.message });
  }
});

// 图书搜索功能
router.get('/search', async (req, res) => {
  try {
    const { title, author, keyword } = req.query;
    const whereCondition = {};
    
    if (title || author || keyword) {
      whereCondition.OR = [];
      if (title) whereCondition.OR.push({ title: { contains: title } });
      if (author) whereCondition.OR.push({ author: { contains: author } });
      if (keyword) {
        whereCondition.OR.push(
          { title: { contains: keyword } },
          { author: { contains: keyword } }
        );
      }
    }
    
    const books = await prisma.book.findMany({
      where: whereCondition,
      orderBy: { id: 'asc' },
      include: {
        copies: {
          select: { status: true }
        }
      }
    });
    
    const booksWithCount = books.map(book => {
      const availableCopies = book.copies.filter(c => c.status === 'AVAILABLE').length;
      return {
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        genre: book.genre,
        description: book.description,
        language: book.language,
        createdAt: book.createdAt,
        availableCopies: availableCopies,
        totalCopies: book.copies.length
      };
    });
    
    res.json({ success: true, data: booksWithCount, count: booksWithCount.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to search books', detail: error.message });
  }
});

// 获取单本图书详情
router.get('/:id', async (req, res) => {
  const bookId = Number(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: 'Invalid book id' });
  }

  try {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        copies: {
          select: { id: true, barcode: true, floor: true, libraryArea: true, shelfNo: true, shelfLevel: true, status: true }
        },
        ratings: {
          include: { user: { select: { id: true, name: true } } }
        }
      }
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const availableCopies = book.copies.filter(c => c.status === 'AVAILABLE').length;

    res.json({
      success: true,
      data: {
        ...book,
        availableCopies: availableCopies,
        totalCopies: book.copies.length,
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch book detail', detail: error.message });
  }
});

// ==================== 馆员/管理员接口（需要认证） ====================

// 添加图书
router.post('/', requireAuth, checkLibrarianOrAdmin, async (req, res) => {
  try {
    const { 
      title, author, isbn, genre, description, language,
      floor, libraryArea, shelfNo, shelfLevel 
    } = req.body;

    if (!title || !author || !isbn || !genre) {
      return res.status(400).json({ error: '书名、作者、ISBN和分类是必填项' });
    }

    // 检查 ISBN 是否已存在
    const existingBook = await prisma.book.findUnique({ where: { isbn: isbn.trim() } });
    if (existingBook) {
      return res.status(409).json({ error: '该 ISBN 已存在' });
    }

    // 创建图书
    const book = await prisma.book.create({
      data: {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        genre: genre.trim(),
        description: description?.trim() || null,
        language: language?.trim() || 'English',
      },
      select: BOOK_SELECT,
    });

    // 创建默认副本（使用前端传来的位置信息）
    await prisma.copy.create({
      data: {
        bookId: book.id,
        barcode: `BC-${book.id}-1`,
        floor: floor || 1,
        libraryArea: libraryArea || `${genre}区`,
        shelfNo: shelfNo || 'A',
        shelfLevel: shelfLevel || 1,
        status: 'AVAILABLE'
      }
    });

    // 记录审计日志
    await prisma.auditLog.create({
      data: {
        userId: req.user.role === 'ADMIN' ? req.user.id : null,
        action: 'CREATE_BOOK',
        entity: 'Book',
        entityId: book.id,
        detail: `${req.user.role === 'LIBRARIAN' ? '馆员' : '管理员'} ${req.user.name || req.user.email} 添加了图书《${book.title}》`
      }
    });

    // 返回完整的图书信息（包含副本）
    const fullBook = await prisma.book.findUnique({
      where: { id: book.id },
      include: {
        copies: {
          select: { id: true, barcode: true, status: true, floor: true, libraryArea: true, shelfNo: true, shelfLevel: true }
        }
      }
    });

    const availableCopies = fullBook.copies.filter(c => c.status === 'AVAILABLE').length;
    const firstCopy = fullBook.copies[0] || {};

    res.status(201).json({
      success: true,
      message: '图书添加成功',
      book: {
        ...fullBook,
        availableCopies,
        totalCopies: fullBook.copies.length,
        floor: firstCopy.floor,
        libraryArea: firstCopy.libraryArea,
        shelfNo: firstCopy.shelfNo,
        shelfLevel: firstCopy.shelfLevel,
      }
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({ error: '添加图书失败' });
  }
});

// 更新图书信息
router.put('/:id', requireAuth, checkLibrarianOrAdmin, async (req, res) => {
  try {
    const bookId = Number(req.params.id);
    const { 
      title, author, isbn, genre, description, language,
      floor, libraryArea, shelfNo, shelfLevel 
    } = req.body;

    if (isNaN(bookId)) {
      return res.status(400).json({ error: '无效的图书ID' });
    }

    if (!title || !author || !isbn || !genre) {
      return res.status(400).json({ error: '书名、作者、ISBN和分类是必填项' });
    }

    // 检查图书是否存在
    const existingBook = await prisma.book.findUnique({ where: { id: bookId } });
    if (!existingBook) {
      return res.status(404).json({ error: '图书不存在' });
    }

    // 检查 ISBN 是否被其他图书使用
    if (isbn.trim() !== existingBook.isbn) {
      const isbnConflict = await prisma.book.findUnique({ where: { isbn: isbn.trim() } });
      if (isbnConflict) {
        return res.status(409).json({ error: '该 ISBN 已被其他图书使用' });
      }
    }

    // 更新图书
    const updatedBook = await prisma.book.update({
      where: { id: bookId },
      data: {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        genre: genre.trim(),
        description: description?.trim() || null,
        language: language?.trim() || 'English',
      },
      select: BOOK_SELECT,
    });

    // 如果传入了位置信息，更新第一个副本的位置
    if (floor || libraryArea || shelfNo || shelfLevel) {
      const firstCopy = await prisma.copy.findFirst({ where: { bookId: bookId } });
      if (firstCopy) {
        await prisma.copy.update({
          where: { id: firstCopy.id },
          data: {
            floor: floor !== undefined ? floor : firstCopy.floor,
            libraryArea: libraryArea !== undefined ? libraryArea : firstCopy.libraryArea,
            shelfNo: shelfNo !== undefined ? shelfNo : firstCopy.shelfNo,
            shelfLevel: shelfLevel !== undefined ? shelfLevel : firstCopy.shelfLevel,
          }
        });
      }
    }

    // 记录审计日志
    await prisma.auditLog.create({
      data: {
        userId: req.user.role === 'ADMIN' ? req.user.id : null,
        action: 'UPDATE_BOOK',
        entity: 'Book',
        entityId: bookId,
        detail: `${req.user.role === 'LIBRARIAN' ? '馆员' : '管理员'} ${req.user.name || req.user.email} 更新了图书《${title}》`
      }
    });

    // 返回完整的图书信息
    const fullBook = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        copies: {
          select: { id: true, barcode: true, status: true, floor: true, libraryArea: true, shelfNo: true, shelfLevel: true }
        }
      }
    });

    const availableCopies = fullBook.copies.filter(c => c.status === 'AVAILABLE').length;
    const firstCopy = fullBook.copies[0] || {};

    res.json({
      success: true,
      message: '图书更新成功',
      book: {
        ...fullBook,
        availableCopies,
        totalCopies: fullBook.copies.length,
        floor: firstCopy.floor,
        libraryArea: firstCopy.libraryArea,
        shelfNo: firstCopy.shelfNo,
        shelfLevel: firstCopy.shelfLevel,
      }
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ error: '更新图书失败' });
  }
});

// 删除图书
router.delete('/:id', requireAuth, checkLibrarianOrAdmin, async (req, res) => {
  const bookId = Number(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).json({ error: '无效的图书ID' });
  }

  try {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        copies: {
          include: {
            loans: { where: { returnDate: null } }
          }
        }
      }
    });

    if (!book) {
      return res.status(404).json({ error: '图书不存在' });
    }

    // 检查是否有未归还的借阅
    const hasActiveLoans = book.copies.some(copy => copy.loans.length > 0);
    if (hasActiveLoans) {
      return res.status(400).json({ error: '该图书有未归还的借阅记录，无法删除' });
    }

    await prisma.book.delete({ where: { id: bookId } });

    await prisma.auditLog.create({
      data: {
        userId: req.user.role === 'ADMIN' ? req.user.id : null,
        action: 'DELETE_BOOK',
        entity: 'Book',
        entityId: bookId,
        detail: `${req.user.role === 'LIBRARIAN' ? '馆员' : '管理员'} ${req.user.name || req.user.email} 删除了图书《${book.title}》`
      }
    });

    res.json({ success: true, message: '图书删除成功' });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ error: '删除图书失败' });
  }
});

module.exports = router;