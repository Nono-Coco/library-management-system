const jwt = require('jsonwebtoken');

const LIBRARIAN_JWT_SECRET =
  process.env.LIBRARIAN_JWT_SECRET ||
  'library-management-secret-key-2024';

function signLibrarianToken(payload, options = {}) {
  return jwt.sign(payload, LIBRARIAN_JWT_SECRET, {
    expiresIn: options.expiresIn || '7d',
  });
}

function verifyLibrarianToken(token) {
  return jwt.verify(token, LIBRARIAN_JWT_SECRET);
}

module.exports = {
  signLibrarianToken,
  verifyLibrarianToken,
};
