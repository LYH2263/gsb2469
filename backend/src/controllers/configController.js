const getAMapConfig = async (req, res) => {
  try {
    res.json({
      key: process.env.AMAP_KEY,
      securityJsCode: process.env.AMAP_SECURITY_CODE
    });
  } catch (error) {
    res.status(500).json({ message: '配置加载失败，请稍后重试' });
  }
};

module.exports = { getAMapConfig };
