const crypto = require('crypto');

const DEFAULT_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7;
const DEFAULT_SECRET = 'library-management-system-dev-secret';

function getSecret() {
  return process.env.AUTH_SECRET || DEFAULT_SECRET;
}

function base64urlEncode(value) {
  const normalizedValue =
    typeof value === 'string' ? value : JSON.stringify(value);

  return Buffer.from(normalizedValue).toString('base64url');
}

function base64urlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function createSignature(unsignedToken, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(unsignedToken)
    .digest('base64url');
}

function signToken(payload, options = {}) {
  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds =
    options.expiresInSeconds ?? DEFAULT_EXPIRES_IN_SECONDS;

  const headerSegment = base64urlEncode({
    alg: 'HS256',
    typ: 'JWT',
  });

  const payloadSegment = base64urlEncode({
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  });

  const unsignedToken = `${headerSegment}.${payloadSegment}`;
  const signature = createSignature(unsignedToken, getSecret());

  return `${unsignedToken}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is required.');
  }

  const segments = token.split('.');

  if (segments.length !== 3) {
    throw new Error('Token format is invalid.');
  }

  const [headerSegment, payloadSegment, providedSignature] = segments;
  const unsignedToken = `${headerSegment}.${payloadSegment}`;
  const expectedSignature = createSignature(unsignedToken, getSecret());

  const providedBuffer = Buffer.from(providedSignature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error('Token signature is invalid.');
  }

  const header = JSON.parse(base64urlDecode(headerSegment));

  if (header.alg !== 'HS256') {
    throw new Error('Token algorithm is not supported.');
  }

  const payload = JSON.parse(base64urlDecode(payloadSegment));
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp <= now) {
    throw new Error('Token has expired.');
  }

  return payload;
}

module.exports = {
  DEFAULT_EXPIRES_IN_SECONDS,
  signToken,
  verifyToken,
};
