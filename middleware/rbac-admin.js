const rbacAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Admins only' });
  }
  next();
};

module.exports = rbacAdmin;
