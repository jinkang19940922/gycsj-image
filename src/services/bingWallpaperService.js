const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const imageService = require('./imageService');

class BingWallpaperService {
  constructor() {
    this.bingApiUrl = 'https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=zh-CN';
  }

  async getBingWallpapers() {
    try {
      const response = await fetch(this.bingApiUrl);
      const data = await response.json();
      
      if (!data.images || data.images.length === 0) {
        throw new Error('无法获取必应壁纸');
      }

      const wallpapers = data.images.map((image, index) => ({
        id: index,
        title: image.title,
        copyright: image.copyright,
        copyrightlink: image.copyrightlink,
        url: `https://cn.bing.com${image.url}`,
        thumbnail: `https://cn.bing.com${image.url.replace('1920x1080', '800x480')}`,
        date: image.startdate
      }));

      return wallpapers;
    } catch (error) {
      console.error('获取必应壁纸失败:', error);
      throw error;
    }
  }

  async downloadAndSaveWallpaper(wallpaperUrl, host, categoryId = null) {
    try {
      const response = await fetch(wallpaperUrl);
      if (!response.ok) {
        throw new Error('下载图片失败');
      }

      const buffer = await response.buffer();
      const urlPath = new URL(wallpaperUrl).pathname;
      const ext = path.extname(urlPath) || '.jpg';
      const filename = uuidv4() + ext;
      const uploadDir = path.join(__dirname, '../../uploads');

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, buffer);

      const thumbFilename = await imageService.generateThumbnail(filepath, filename);

      const imageUrl = `http://${host}/uploads/${filename}`;
      const thumbnailUrl = thumbFilename 
        ? `http://${host}/thumbnails/${thumbFilename}`
        : imageUrl;

      if (categoryId) {
        await imageService.addImagesToCategory(categoryId, [filename]);
      }

      return {
        filename,
        url: imageUrl,
        thumbnail: thumbnailUrl
      };
    } catch (error) {
      console.error('保存壁纸失败:', error);
      throw error;
    }
  }
}

module.exports = new BingWallpaperService();
