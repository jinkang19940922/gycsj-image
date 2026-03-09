const express = require('express');
const path = require('path');

// 加载环境变量
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
const isProduction = process.env.NODE_ENV === 'production';
const cors = require('cors');
const session = require('express-session');

app.use(cors({
  origin: isProduction ? process.env.CORS_ORIGIN || 'https://your-domain.com' : '*',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'image-host-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: isProduction, // 生产环境使用 HTTPS
    httpOnly: true, // 防止 XSS 攻击
    sameSite: isProduction ? 'strict' : 'lax', // 防止 CSRF 攻击
    maxAge: 24 * 60 * 60 * 1000 // 24 小时
  }
}));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/thumbnails', express.static(path.join(__dirname, 'thumbnails')));
app.use(express.static(path.join(__dirname, 'public')));

// 路由
const apiRoutes = require('./src/routes');
app.use('/api', apiRoutes);

// 错误处理中间件
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
app.use(notFound);
app.use(errorHandler);

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`图床服务运行在 http://localhost:${PORT}`);
});

