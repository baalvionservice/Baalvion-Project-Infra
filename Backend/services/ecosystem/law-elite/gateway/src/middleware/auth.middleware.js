const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'UNAUTHORIZED: Credentials required' });
  }

  const token = authHeader.split(' ')[1];

  // law-elite is an ISOLATED sub-system (own identity). No insecure hardcoded fallback:
  // require JWT_SECRET so a missing secret fails loudly instead of trusting a known key.
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'AUTH_MISCONFIGURED: JWT_SECRET is not set' });
  }

  try {
    // Pin HS256 to prevent algorithm-confusion attacks (isolated island until Phase 4 retirement).
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'FORBIDDEN: Invalid session protocol' });
  }
};