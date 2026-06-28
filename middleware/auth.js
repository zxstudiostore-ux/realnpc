const adminAuth = (req, res, next) => {
  const adminSecret = req.headers['x-admin-secret'];

  if (adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ status: 'UNAUTHORIZED' });
  }

  next();
};

module.exports = adminAuth;
