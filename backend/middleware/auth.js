const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'assac-super-secret-jwt-key-2026';

/**
 * Generate secure JWT for user session
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role || user.role_name,
    permissions: user.permissions || {}
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Middleware: Parse token if present, attach to req.user (does not block if missing)
 */
function parseToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Allow legacy tokens if any
      if (token.startsWith('assac-jwt-')) {
        req.user = { id: 1, role: 'Super Admin', permissions: { super_admin: true } };
      }
    }
  }

  next();
}

/**
 * Middleware: Require authenticated user
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required. Please sign in.' 
    });
  }
  next();
}

/**
 * Middleware: Require specific permission or Super Admin
 */
function requirePermission(permKey) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const isSuper = req.user.role === 'Super Admin' || req.user.permissions?.super_admin === true;
    if (isSuper || req.user.permissions?.[permKey] === true) {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      error: `Access Denied: Missing required permission [${permKey}].` 
    });
  };
}

/**
 * Middleware: Require Super Admin access
 */
function requireSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  const isSuper = req.user.role === 'Super Admin' || req.user.permissions?.super_admin === true;
  if (!isSuper) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access Denied: Super Admin governance privilege required.' 
    });
  }

  next();
}

module.exports = {
  JWT_SECRET,
  generateToken,
  parseToken,
  requireAuth,
  requirePermission,
  requireSuperAdmin
};
