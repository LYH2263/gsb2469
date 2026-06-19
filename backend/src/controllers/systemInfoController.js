const getUptimeLabel = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
};

const getSystemInfo = async (req, res) => {
  try {
    const systemInfo = [
      { label: '系统名称', value: '旅运管理系统' },
      { label: '系统版本', value: 'v1.2.0' },
      { label: '后端运行时', value: `Node ${process.version.replace('v', '')}` },
      { label: '数据库', value: 'PostgreSQL' }
    ];
    const runtimeInfo = [
      { label: '运行环境', value: process.env.NODE_ENV || 'production' },
      { label: '服务器时间', value: new Date().toLocaleString() },
      { label: '服务运行时长', value: getUptimeLabel(process.uptime()) },
      { label: '连接状态', value: '正常' }
    ];
    res.json({ systemInfo, runtimeInfo });
  } catch (error) {
    res.status(500).json({ message: '系统信息加载失败，请稍后重试' });
  }
};

module.exports = { getSystemInfo };
