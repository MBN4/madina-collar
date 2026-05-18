const adminAuth = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    next();
  } else {
    res.status(403).json({ msg: 'Access denied: Administrative clearance required' });
  }
};

export default adminAuth;