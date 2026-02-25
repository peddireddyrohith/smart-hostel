import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ── Protect: Verify JWT Access Token ──────────────────────
export const protect = async (req, res, next) => {
  try {
    let token;

    // Read token from Authorization header: "Bearer <token>"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401);
      throw new Error('Not authorized, no token provided');
    }

    // Verify the token using our secret
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Attach the user (without password) to the request object
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, user no longer exists');
    }

    next(); // Token is valid — proceed to the route handler
  } catch (error) {
    next(error);
  }
};

// ── Authorize: Role-Based Access Control (RBAC) ───────────
// Usage: authorize('admin') or authorize('admin', 'tenant')
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(
        new Error(
          `Role '${req.user.role}' is not authorized to access this route`
        )
      );
    }
    next();
  };
};
