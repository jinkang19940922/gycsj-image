const express = require('express');
const multer = require('multer');
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const userController = require('../controllers/userController');
const imageController = require('../controllers/imageController');
const bingWallpaperController = require('../controllers/bingWallpaperController');
const dailyQuoteController = require('../controllers/dailyQuoteController');

const router = express.Router();

// 配置 multer 存储
const uploadDir = path.join(__dirname, '../../uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const { v4: uuidv4 } = require('uuid');
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

// 健康检查
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '图床服务运行中' });
});

// 图片相关路由
router.post('/upload', requireAuth, upload.single('image'), imageController.uploadSingle);
router.post('/upload/multiple', requireAuth, upload.array('images', 100), imageController.uploadMultiple);
router.get('/images', requireAuth, imageController.getImages);
router.delete('/images/:filename', requireAuth, imageController.deleteImage);

// 分类相关路由
router.get('/categories', requireAuth, imageController.getCategories);
router.post('/categories', requireAuth, imageController.createCategory);
router.delete('/categories/:id', requireAuth, imageController.deleteCategory);
router.post('/categories/add-image', requireAuth, imageController.addImageToCategory);
router.post('/categories/remove-image', requireAuth, imageController.removeImageFromCategory);
router.get('/categories/:id/images', requireAuth, imageController.getImagesByCategory);

// 图片分组管理
router.post('/images/move-to-category', requireAuth, imageController.moveImagesToCategory);

// 随机图片API（公开，无需认证）
router.get('/random', imageController.randomImageRedirect);
router.get('/random/json', imageController.getRandomImage);
router.get('/random/list', imageController.getRandomImages);
router.get('/stats', imageController.getImageStats);

// 用户相关路由
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.get('/auth/status', userController.checkAuthStatus);
router.post('/account/update', requireAuth, userController.updateAccount);

// 必应壁纸相关路由
router.get('/bing-wallpapers', bingWallpaperController.getWallpapers);
router.get('/bing-wallpapers/login', bingWallpaperController.getLoginWallpaper);
router.post('/bing-wallpapers/save', requireAuth, bingWallpaperController.saveWallpaper);

// 每日一言路由
router.get('/daily-quote', dailyQuoteController.getDailyQuote);
router.get('/random-quote', dailyQuoteController.getRandomQuote);

module.exports = router;
