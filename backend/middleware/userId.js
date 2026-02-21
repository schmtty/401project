/**
 * Middleware: require X-User-Id header for user-scoped routes
 * Sets req.userId for downstream handlers
 */
export function requireUserId(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(400).json({ error: 'X-User-Id header required' });
  }
  req.userId = userId;
  next();
}
