const bingWallpaperService = require('../services/bingWallpaperService');
const imageService = require('../services/imageService');

class BingWallpaperController {
  // 获取必应每日壁纸列表
  async getWallpapers(req, res) {
    try {
      const wallpapers = await bingWallpaperService.getBingWallpapers();
      res.json({ success: true, wallpapers });
    } catch (error) {
      console.error('获取必应壁纸失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // 获取登录页面壁纸（单张）
  async getLoginWallpaper(req, res) {
    try {
      const wallpapers = await bingWallpaperService.getBingWallpapers();
      if (wallpapers && wallpapers.length > 0) {
        res.json({ success: true, wallpaper: wallpapers[0] });
      } else {
        res.status(404).json({ success: false, error: '没有可用的壁纸' });
      }
    } catch (error) {
      console.error('获取登录壁纸失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // 保存壁纸到图片库
  async saveWallpaper(req, res) {
    try {
      const { wallpaperUrl } = req.body;
      const host = req.get('host');
      
      if (!wallpaperUrl) {
        return res.status(400).json({ success: false, error: '壁纸URL不能为空' });
      }

      // 检查或创建"公共图片"分组
      let categories = await imageService.getCategories();
      let publicCategory = categories.find(cat => cat.name === '公共图片');
      
      if (!publicCategory) {
        publicCategory = await imageService.createCategory('公共图片');
      }

      const image = await bingWallpaperService.downloadAndSaveWallpaper(
        wallpaperUrl, 
        host, 
        publicCategory.id
      );

      res.json({ 
        success: true, 
        message: '壁纸已保存到公共图片分组',
        image 
      });
    } catch (error) {
      console.error('保存壁纸失败:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new BingWallpaperController();
