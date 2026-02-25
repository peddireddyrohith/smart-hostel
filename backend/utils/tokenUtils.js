import jwt from 'jsonwebtoken';

// ── Generate Access Token (short-lived: 15 minutes) ────────
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
  );
};

// ── Generate Refresh Token (long-lived: 7 days) ────────────
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

// ── Send Tokens: access in body, refresh in httpOnly cookie ─
export const sendTokens = (user, statusCode, res) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token in a secure httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,    // JS cannot access this cookie (XSS protection)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });

  // Send access token in response body
  res.status(statusCode).json({
    success: true,
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

// ── Verify a token and return decoded payload ──────────────
export const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};
