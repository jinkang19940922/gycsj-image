// 认证中间件
const requireAuth = (req, res, next) => {
  if (req.session && req.session.loggedIn) {
    return next();
  }
  res.status(401).json({ error: '请先登录', needLogin: true });
};

module.exports = {
  requireAuth
};
