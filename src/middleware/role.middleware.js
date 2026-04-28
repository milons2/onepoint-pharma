function requireOwner(req, res, next) {
  if (req.user.role !== 'OWNER') {
    return res.status(403).json({
      success: false,
      message: 'Owner access only',
    });
  }
  next();
}

module.exports = { requireOwner };