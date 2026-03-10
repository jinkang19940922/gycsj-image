const imageService = require('../services/imageService');

class ImageController {
  // 上传单张图片
  async uploadSingle(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '没有上传文件' });
      }
      
      // 生成缩略图
      const thumbFilename = await imageService.generateThumbnail(req.file.path, req.file.filename);
      
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
  }

  // 上传多张图片
  async uploadMultiple(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: '没有上传文件' });
      }

      const groupId = req.body.groupId || null;

      const images = await Promise.all(req.files.map(async file => {
        const thumbFilename = await imageService.generateThumbnail(file.path, file.filename);
        return {
          url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
          thumbnail: thumbFilename
            ? `${req.protocol}://${req.get('host')}/thumbnails/${thumbFilename}`
            : `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
          filename: file.filename,
          size: file.size
        };
      }));

      if (groupId) {
        const filenames = images.map(img => img.filename);
        await imageService.addImagesToCategory(groupId, filenames);
      }

      res.json({
        success: true,
        images: images
      });
    } catch (error) {
      console.error('上传错误:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // 获取图片列表
  async getImages(req, res) {
    try {
      const host = req.get('host');
      const images = await imageService.getImages(host);
      res.json({ success: true, images });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 获取所有图片（从所有分类中收集）
  async getAllImages(req, res) {
    try {
      const host = req.get('host');
      const images = await imageService.getAllImages(host);
      res.json({ success: true, images });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 删除图片
  async deleteImage(req, res) {
    try {
      const filename = req.params.filename;
      const message = await imageService.deleteImage(filename);
      res.json({ success: true, message });
    } catch (error) {
      // 即使图片不存在，也返回成功，因为imageService已经处理了这种情况
      res.json({ success: true, message: '删除成功' });
    }
  }

  // 获取分类列表
  async getCategories(req, res) {
    try {
      const categories = await imageService.getCategories();
      res.json({ success: true, categories });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 创建分类
  async createCategory(req, res) {
    try {
      const { name } = req.body;
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: '分类名称不能为空' });
      }
      const category = await imageService.createCategory(name.trim());
      res.json({ success: true, category });
    } catch (error) {
      if (error.message === '分类已存在') {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  // 重命名分类
  async renameCategory(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: '分类名称不能为空' });
      }
      const message = await imageService.renameCategory(id, name.trim());
      res.json({ success: true, message });
    } catch (error) {
      if (error.message === '分类不存在' || error.message === '分类名称已存在' || error.message === '不能修改默认分组') {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  // 删除分类
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const { action = 'move' } = req.body;
      const message = await imageService.deleteCategory(id, action);
      res.json({ success: true, message });
    } catch (error) {
      if (error.message === '分类不存在') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  // 添加图片到分类
  async addImageToCategory(req, res) {
    try {
      const { categoryId, filename } = req.body;
      if (!categoryId || !filename) {
        return res.status(400).json({ error: '分类ID和文件名不能为空' });
      }
      const message = await imageService.addImageToCategory(categoryId, filename);
      res.json({ success: true, message });
    } catch (error) {
      if (error.message === '分类不存在') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  // 从分类中移除图片
  async removeImageFromCategory(req, res) {
    try {
      const { categoryId, filename } = req.body;
      if (!categoryId || !filename) {
        return res.status(400).json({ error: '分类ID和文件名不能为空' });
      }
      const message = await imageService.removeImageFromCategory(categoryId, filename);
      res.json({ success: true, message });
    } catch (error) {
      if (error.message === '分类不存在') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  // 批量移动图片到分类
  async moveImagesToCategory(req, res) {
    try {
      const { filenames, categoryId } = req.body;
      if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
        return res.status(400).json({ error: '请选择要移动的图片' });
      }
      const message = await imageService.moveImagesToCategory(filenames, categoryId);
      res.json({ success: true, message });
    } catch (error) {
      if (error.message === '目标分类不存在') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  // 获取分类中的图片
  async getImagesByCategory(req, res) {
    try {
      const { id } = req.params;
      const host = req.get('host');
      const images = await imageService.getImagesByCategory(id, host);
      res.json({ success: true, images });
    } catch (error) {
      if (error.message === '分类不存在') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }

  // 获取随机图片（公开API，无需认证）
  async getRandomImage(req, res) {
    try {
      const host = req.get('host');
      const categoryId = req.query.category || null;
      const imagesParam = req.query.images || null;
      const imageList = imagesParam ? imagesParam.split(',').filter(f => f) : null;
      const image = await imageService.getRandomImage(host, categoryId, imageList);
      
      if (!image) {
        return res.status(404).json({ error: '没有可用的图片' });
      }
      
      res.json({ success: true, image });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 获取随机图片列表（公开API，无需认证）
  async getRandomImages(req, res) {
    try {
      const host = req.get('host');
      const count = parseInt(req.query.count) || 10;
      const categoryId = req.query.category || null;
      const imagesParam = req.query.images || null;
      const imageList = imagesParam ? imagesParam.split(',').filter(f => f) : null;
      const images = await imageService.getRandomImages(host, count, categoryId, imageList);
      
      res.json({ success: true, count: images.length, images });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 随机图片重定向（公开API，直接返回图片URL，适合用作外链）
  async randomImageRedirect(req, res) {
    try {
      const host = req.get('host');
      const categoryId = req.query.category || null;
      const imagesParam = req.query.images || null;
      const imageList = imagesParam ? imagesParam.split(',').filter(f => f) : null;
      const image = await imageService.getRandomImage(host, categoryId, imageList);
      
      if (!image) {
        return res.status(404).json({ error: '没有可用的图片' });
      }
      
      // 添加缓存控制头，防止浏览器缓存重定向结果
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.redirect(image.url);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 获取图片统计信息（公开API）
  async getImageStats(req, res) {
    try {
      const categoryId = req.query.category || null;
      const total = await imageService.getImageCount(categoryId);
      const categories = await imageService.getCategories();
      
      res.json({ 
        success: true, 
        total,
        categories: categories.map(c => ({ id: c.id, name: c.name, count: c.images.length }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ImageController();
