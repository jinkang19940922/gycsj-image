// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error('错误:', err);
  
  // 处理 multer 文件上传错误
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: '文件大小超过限制 (最大 10MB)' });
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({ error: '文件数量超过限制 (最多 100 个)' });
    } else {
      return res.status(400).json({ error: '文件上传错误: ' + err.message });
    }
  }
  
  // 处理其他错误
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    error: err.message || '服务器内部错误',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// 404 处理中间件
const notFound = (req, res, next) => {
  const error = new Error(`未找到路径: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};
