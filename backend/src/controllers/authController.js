const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const logger = require('../logger');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ message: '用户名或密码错误' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: '用户名或密码错误' });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: '服务器配置错误，请联系管理员' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, secret, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, username: user.username } });
  } catch (error) {
    logger.error(`[Auth login] Error: ${error.message}`, { error });
    res.status(500).json({ message: '登录失败，请稍后重试' });
  }
};

module.exports = { login };
