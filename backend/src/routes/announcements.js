const express = require('express');

const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      message: 'Only administrators can perform this action.',
    });
  }
  return next();
}

async function createAnnouncement(req, res, next) {
  try {
    const title = normalizeText(req.body.title);
    const content = normalizeText(req.body.content);
    const isPinned = req.body.isPinned === true;
    const expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate) : null;

    if (!title || !content) {
      return res.status(400).json({
        message: 'title and content are required.',
      });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        isPinned,
        expiryDate,
        publishers: {
          create: {
            userId: req.user.id,
          },
        },
      },
      include: {
        publishers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({
      message: 'Announcement created successfully.',
      announcement,
    });
  } catch (error) {
    return next(error);
  }
}
//支持URL查询参数有userId,isPinned,search
async function getAnnouncements(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const where = {
      AND: [
        {
          publishDate: {
            lte: new Date(),
          },
        },
      ],
    };

    if (req.query.userId) {
      const userId = parseInt(req.query.userId);
      if (!isNaN(userId)) {
        where.publishers = {
          some: {
            userId,
          },
        };
      }
    }

    if (req.query.isPinned !== undefined) {
      where.AND.push({
        isPinned: req.query.isPinned === 'true',
      });
    }

    if (req.query.search) {
      const search = req.query.search;
      where.AND.push({
        OR: [
          { title: { contains: search } },
          { content: { contains: search } },
        ],
      });
    }

    const [total, announcements] = await Promise.all([
      prisma.announcement.count({ where }),
      prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isPinned: 'desc' },
          { publishDate: 'desc' },
        ],
        include: {
          publishers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return res.json({
      announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getAnnouncementById(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: 'Invalid announcement ID.',
      });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        publishers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!announcement) {
      return res.status(404).json({
        message: 'Announcement not found.',
      });
    }

    return res.json({ announcement });
  } catch (error) {
    return next(error);
  }
}

async function updateAnnouncement(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: 'Invalid announcement ID.',
      });
    }

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        message: 'Announcement not found.',
      });
    }

    const title = req.body.title !== undefined ? normalizeText(req.body.title) : existing.title;
    const content = req.body.content !== undefined ? normalizeText(req.body.content) : existing.content;
    const isPinned = req.body.isPinned !== undefined ? req.body.isPinned === true : existing.isPinned;
    const expiryDate = req.body.expiryDate !== undefined
      ? (req.body.expiryDate ? new Date(req.body.expiryDate) : null)
      : existing.expiryDate;

    if (!title || !content) {
      return res.status(400).json({
        message: 'title and content cannot be empty.',
      });
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        title,
        content,
        isPinned,
        expiryDate,
      },
      include: {
        publishers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return res.json({
      message: 'Announcement updated successfully.',
      announcement,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteAnnouncement(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: 'Invalid announcement ID.',
      });
    }

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        message: 'Announcement not found.',
      });
    }

    await prisma.announcementPublisher.deleteMany({
      where: { announcementId: id },
    });

    await prisma.announcement.delete({
      where: { id },
    });

    return res.json({
      message: 'Announcement deleted successfully.',
    });
  } catch (error) {
    return next(error);
  }
}

router.post('/', requireAuth, requireAdmin, createAnnouncement);
router.get('/', getAnnouncements);
router.get('/:id', getAnnouncementById);
router.put('/:id', requireAuth, requireAdmin, updateAnnouncement);
router.delete('/:id', requireAuth, requireAdmin, deleteAnnouncement);

module.exports = router;
