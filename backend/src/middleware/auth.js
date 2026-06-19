const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: '请先登录后再操作' });

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: '服务器配置错误，请联系管理员' });
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: '登录已过期，请重新登录' });
  }
};

module.exports = auth;
