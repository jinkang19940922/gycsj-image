const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// 配置
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// 中间件
app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'image-host-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // HTTPS 时改为 true
    maxAge: 24 * 60 * 60 * 1000 // 24 小时
  }
}));

// 认证中间件
const requireAuth = (req, res, next) => {
  if (req.session && req.session.loggedIn) {
    return next();
  }
  res.status(401).json({ error: '请先登录', needLogin: true });
};

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/thumbnails', express.static(path.join(__dirname, 'thumbnails')));
app.use(express.static(path.join(__dirname, 'public')));

// 确保目录存在
const uploadDir = path.join(__dirname, 'uploads');
const thumbnailDir = path.join(__dirname, 'thumbnails');
const dataDir = path.join(__dirname, 'data');

[uploadDir, thumbnailDir, dataDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 用户数据存储
const userFile = path.join(dataDir, 'users.json');
let users = {};

if (fs.existsSync(userFile)) {
  users = JSON.parse(fs.readFileSync(userFile, 'utf8'));
} else {
  // 创建默认管理员
  const hashedPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  users[ADMIN_USERNAME] = { password: hashedPassword };
  fs.writeFileSync(userFile, JSON.stringify(users));
}

function saveUsers() {
  fs.writeFileSync(userFile, JSON.stringify(users));
}

// 配置 multer 存储
const sharp = require('sharp');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = uuidv4() + ext;
    cb(null, filename);
  }
});

// 文件过滤 - 只允许图片
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif, webp, svg)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制 10MB
  }
});

// 生成缩略图
async function generateThumbnail(inputPath, filename) {
  try {
    const ext = path.extname(filename);
    const thumbFilename = 'thumb_' + filename;
    const outputPath = path.join(thumbnailDir, thumbFilename);
    
    await sharp(inputPath)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
    
    return thumbFilename;
  } catch (error) {
    console.error('生成缩略图失败:', error);
    return null;
  }
}

// 压缩图片
async function compressImage(inputPath, outputPath, quality = 80) {
  try {
    await sharp(inputPath)
      .jpeg({ quality })
      .toFile(outputPath);
    return true;
  } catch (error) {
    console.error('压缩图片失败:', error);
    return false;
  }
}

// 上传单张图片
app.post('/api/upload', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    // 生成缩略图
    const thumbFilename = await generateThumbnail(req.file.path, req.file.filename);
    
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const thumbnailUrl = thumbFilename 
      ? `${req.protocol}://${req.get('host')}/thumbnails/${thumbFilename}`
      : imageUrl;
    
    res.json({
      success: true,
      url: imageUrl,
      thumbnail: thumbnailUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 上传多张图片
app.post('/api/upload/multiple', requireAuth, upload.array('images', 100), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const images = await Promise.all(req.files.map(async file => {
      const thumbFilename = await generateThumbnail(file.path, file.filename);
      return {
        url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
        thumbnail: thumbFilename
          ? `${req.protocol}://${req.get('host')}/thumbnails/${thumbFilename}`
          : `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
        filename: file.filename,
        size: file.size
      };
    }));

    res.json({
      success: true,
      images: images
    });
  } catch (error) {
    console.error('上传错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取图片列表
app.get('/api/images', requireAuth, (req, res) => {
  try {
    fs.readdir(uploadDir, (err, files) => {
      if (err) {
        return res.status(500).json({ error: '无法读取图片目录' });
      }
      
      const images = files
        .filter(file => /\.(jpeg|jpg|png|gif|webp|svg)$/i.test(file))
        .map(file => {
          const thumbFile = 'thumb_' + file;
          const hasThumbnail = fs.existsSync(path.join(thumbnailDir, thumbFile));
          return {
            filename: file,
            url: `${req.protocol}://${req.get('host')}/uploads/${file}`,
            thumbnail: hasThumbnail
              ? `${req.protocol}://${req.get('host')}/thumbnails/${thumbFile}`
              : `${req.protocol}://${req.get('host')}/uploads/${file}`
          };
        });
      
      res.json({ success: true, images });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除图片
app.delete('/api/images/:filename', requireAuth, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    const thumbPath = path.join(thumbnailDir, 'thumb_' + filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '图片不存在' });
    }
    
    fs.unlinkSync(filePath);
    if (fs.existsSync(thumbPath)) {
      fs.unlinkSync(thumbPath);
    }
    
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 登录
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }
    
    const user = users[username];
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    req.session.loggedIn = true;
    req.session.username = username;
    
    res.json({
      success: true,
      message: '登录成功',
      username: username
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 登出
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: '登出失败' });
    }
    res.json({ success: true, message: '登出成功' });
  });
});

// 检查登录状态
app.get('/api/auth/status', (req, res) => {
  if (req.session && req.session.loggedIn) {
    res.json({
      loggedIn: true,
      username: req.session.username
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// 更新账户信息
app.post('/api/account/update', requireAuth, (req, res) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;
    const currentUser = req.session.username;

    if (!currentPassword || !newUsername || !newPassword) {
      return res.status(400).json({ error: '请填写所有字段' });
    }

    // 验证当前密码
    const user = users[currentUser];
    if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ error: '当前密码错误' });
    }

    // 检查新用户名是否已存在
    if (newUsername !== currentUser && users[newUsername]) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    // 更新用户信息
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    users[newUsername] = { password: hashedPassword };
    
    // 如果是重命名，删除旧用户
    if (newUsername !== currentUser) {
      delete users[currentUser];
    }
    
    saveUsers();

    // 更新 session
    req.session.username = newUsername;

    res.json({
      success: true,
      message: '账户信息更新成功',
      username: newUsername
    });
  } catch (error) {
    console.error('更新账户失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '图床服务运行中' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`图床服务运行在 http://localhost:${PORT}`);
});
