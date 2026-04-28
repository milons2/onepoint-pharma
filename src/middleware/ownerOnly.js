module.exports = function ownerOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.user.role !== 'OWNER') {
    return res.status(403).json({ message: 'Owner access only' });
  }

  next();
};