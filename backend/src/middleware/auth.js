const prisma = require('../lib/prisma');
const { verifyToken } = require('../lib/token');

function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token.trim();
}

async function requireAuth(req, res, next) {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      message: 'Missing or invalid Authorization header.',
    });
  }

  try {
    const payload = verifyToken(token);
    const userId = Number(payload.sub || payload.id);

    if (!userId) {
      return res.status(401).json({ message: 'Token payload is invalid.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        studentId: true,
        employeeId: true,
        role: true,
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    req.user = user;
    req.auth = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      message: error.message || 'Invalid or expired token.',
    });
  }
}

// 馆员权限检查（包括管理员）
function requireLibrarian(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'LIBRARIAN' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Librarian or Admin access required' });
  }
  
  next();
}

// 仅管理员权限
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
}

module.exports = {
  requireAuth,
  requireLibrarian,
  requireAdmin,
};