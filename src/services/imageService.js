const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

class ImageService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.thumbnailDir = path.join(__dirname, '../../thumbnails');
    this.dataDir = path.join(__dirname, '../../data');
    this.categoriesFile = path.join(this.dataDir, 'categories.json');
    
    // 确保目录存在
    this.initializeDirectories();
  }

  // 初始化目录
  async initializeDirectories() {
    try {
      for (const dir of [this.uploadDir, this.thumbnailDir, this.dataDir]) {
        try {
          await fs.access(dir);
        } catch {
          await fs.mkdir(dir, { recursive: true });
        }
      }
      
      // 初始化分类文件
      try {
        await fs.access(this.categoriesFile);
      } catch {
        // 创建默认的 home 分组
        await fs.writeFile(this.categoriesFile, JSON.stringify({ 
          categories: [
            {
              id: 'home',
              name: '默认',
              images: []
            }
          ] 
        }, null, 2));
      }
    } catch (error) {
      console.error('初始化目录失败:', error);
    }
  }

  // 生成缩略图
  async generateThumbnail(inputPath, filename) {
    try {
      const ext = path.extname(filename);
      const thumbFilename = 'thumb_' + filename;
      const outputPath = path.join(this.thumbnailDir, thumbFilename);
      
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
  async compressImage(inputPath, outputPath, quality = 80) {
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

  // 获取图片列表
  async getImages(host) {
    try {
      const files = await fs.readdir(this.uploadDir);
      
      const images = await Promise.all(files
        .filter(file => /\.(jpeg|jpg|png|gif|webp|svg)$/i.test(file))
        .map(async file => {
          const thumbFile = 'thumb_' + file;
          let hasThumbnail = false;
          try {
            await fs.access(path.join(this.thumbnailDir, thumbFile));
            hasThumbnail = true;
          } catch {
            hasThumbnail = false;
          }
          return {
            filename: file,
            url: `http://${host}/uploads/${file}`,
            thumbnail: hasThumbnail
              ? `http://${host}/thumbnails/${thumbFile}`
              : `http://${host}/uploads/${file}`
          };
        }));
      
      return images;
    } catch (error) {
      console.error('获取图片列表失败:', error);
      throw new Error('无法读取图片目录');
    }
  }

  // 获取所有图片（从所有分类中收集）
  async getAllImages(host) {
    try {
      // 从分类中获取所有图片
      const data = await fs.readFile(this.categoriesFile, 'utf8');
      const categories = JSON.parse(data);
      
      // 收集所有分类中的图片（去重）
      const allImageFilenames = new Set();
      categories.categories.forEach(category => {
        category.images.forEach(filename => {
          allImageFilenames.add(filename);
        });
      });
      
      // 获取这些图片的详细信息
      const images = await Promise.all(
        Array.from(allImageFilenames).map(async filename => {
          const filePath = path.join(this.uploadDir, filename);
          const thumbFile = 'thumb_' + filename;
          
          // 检查文件是否存在
          try {
            await fs.access(filePath);
          } catch {
            console.log('图片文件不存在:', filename);
            return null;
          }
          
          let hasThumbnail = false;
          try {
            await fs.access(path.join(this.thumbnailDir, thumbFile));
            hasThumbnail = true;
          } catch {
            hasThumbnail = false;
          }
          
          return {
            filename: filename,
            url: `http://${host}/uploads/${filename}`,
            thumbnail: hasThumbnail
              ? `http://${host}/thumbnails/${thumbFile}`
              : `http://${host}/uploads/${filename}`
          };
        })
      );
      
      // 过滤掉不存在的图片
      return images.filter(img => img !== null);
    } catch (error) {
      console.error('获取所有图片列表失败:', error);
      throw new Error('无法读取图片列表');
    }
  }

  // 删除图片
  async deleteImage(filename) {
    const filePath = path.join(this.uploadDir, filename);
    const thumbPath = path.join(this.thumbnailDir, 'thumb_' + filename);
    
    try {
      // 尝试删除文件
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
      } catch {
        // 文件不存在，忽略错误
        console.log('图片文件不存在，跳过文件删除:', filename);
      }
      
      // 尝试删除缩略图
      try {
        await fs.access(thumbPath);
        await fs.unlink(thumbPath);
      } catch {
        // 缩略图不存在，忽略错误
      }
      
      // 从分类中移除图片
      await this.removeImageFromAllCategories(filename);
      
      return '删除成功';
    } catch (error) {
      console.error('删除图片失败:', error);
      throw new Error('删除图片失败');
    }
  }

  // 获取分类列表
  async getCategories() {
    try {
      const data = await fs.readFile(this.categoriesFile, 'utf8');
      const categories = JSON.parse(data);
      
      // 检查每个分类中的图片是否实际存在
      let updated = false;
      for (const category of categories.categories) {
        const originalLength = category.images.length;
        // 过滤掉不存在的图片
        const existingImages = [];
        for (const filename of category.images) {
          const filePath = path.join(this.uploadDir, filename);
          try {
            await fs.access(filePath);
            existingImages.push(filename);
          } catch {
            // 图片不存在，跳过
          }
        }
        category.images = existingImages;
        if (category.images.length !== originalLength) {
          updated = true;
        }
      }
      
      // 如果有更新，保存到文件
      if (updated) {
        await fs.writeFile(this.categoriesFile, JSON.stringify(categories, null, 2));
      }
      
      return categories.categories || [];
    } catch (error) {
      console.error('获取分类列表失败:', error);
      return [];
    }
  }

  // 创建分类
  async createCategory(name) {
    try {
      const data = await fs.readFile(this.categoriesFile, 'utf8');
      const categories = JSON.parse(data);
      
      // 检查分类是否已存在
      if (categories.categories.some(cat => cat.name === name)) {
        throw new Error('分类已存在');
      }
      
      const newCategory = {
        id: uuidv4(),
        name,
        images: []
      };
      
      categories.categories.push(newCategory);
      await fs.writeFile(this.categoriesFile, JSON.stringify(categories, null, 2));
      
      return newCategory;
    } catch (error) {
      console.error('创建分类失败:', error);
      throw error;
    }
  }

  // 重命名分类
  async renameCategory(categoryId, newName) {
    try {
      const data = await fs.readFile(this.categoriesFile, 'utf8');
      const categories = JSON.parse(data);
      
      const category = categories.categories.find(cat => cat.id === categoryId);
      if (!category) {
        throw new Error('分类不存在');
      }
      
      // 不允许重命名 home 分组
      if (category.id === 'home') {
        throw new Error('不能修改默认分组');
      }
      
      // 检查新名称是否已存在
      if (categories.categories.some(cat => cat.name === newName && cat.id !== categoryId)) {
        throw new Error('分类名称已存在');
      }
      
      category.name = newName;
      await fs.writeFile(this.categoriesFile, JSON.stringify(categories, null, 2));
      
      return '重命名成功';
    } catch (error) {
      console.error('重命名分类失败:', error);
      throw error;
    }
  }

  // 删除分类
  async deleteCategory(categoryId, action = 'move') {
    try {
      const data = await fs.readFile(this.categoriesFile, 'utf8');
      const categories = JSON.parse(data);
      
      const categoryIndex = categories.categories.findIndex(cat => cat.id === categoryId);
      if (categoryIndex === -1) {
        throw new Error('分类不存在');
      }
      
      const category = categories.categories[categoryIndex];
      
      // 不允许删除 home 分组
      if (category.id === 'home') {
        throw new Error('不能删除默认分组');
      }
      
      if (action === 'delete') {
        for (const filename of category.images) {
          try {
            await this.deleteImage(filename);
          } catch (error) {
            console.error(`删除图片 ${filename} 失败:`, error);
          }
        }
      }
      
      categories.categories.splice(categoryIndex, 1);
      await fs.writeFile(this.categoriesFile, JSON.stringify(categories, null, 2));
      
      return '删除成功';
    } catch (error) {
      console.error('删除分类失败:', error);
      throw error;
    }
  }

  // 添加图片到分类
  async addImageToCategory(categoryId, filename) {
    try {
      const data = await fs.readFile(this.categoriesFile, 'utf8');
      const categories = JSON.parse(data);
      
      const category = categories.categories.find(cat => cat.id === categoryId);
      if (!category) {
        throw new Error('分类不存在');
      }
      
      if (!category.images.includes(filename)) {
        category.images.push(filename);
        await fs.writeFile(this.categoriesFile, JSON.stringify(categories, null, 2));
      }
      
      return '添加成功';
    } catch (error) {
      console.error('添加图片到分类失败:', error);
      throw error;
    }
  }

  // 批量添加图片到分类
  async addImagesToCategory(categoryId, filenames) {
    try {
      const data = await fs.readFile(this.categoriesFile, 'utf8');
      const categories = JSON.parse(data);
      
      const category = categories.categories.find(cat => cat.id === categoryId);
      if (!category) {
        throw new Error('分类不存在');
      }
      
      for (const filename of filenames) {
        if (!category.images.includes(filename)) {
          category.images.push(filename);
        }
      }
      
      await fs.writeFile(this.categoriesFile, JSON.stringify(categories, null, 2));
      return '添加成功';
    } catch (error) {
      console.error('批量添加图片到分类失败:', error);
      throw error;
    }
  }

  // 从分类中移除图片
  async removeImageFromCategory(categoryId, filename) {
    try {
      const data = await fs.readFile(this.categoriesFile, 'utf8');
      const categories = JSON.parse(data);
      
      const category = categories.categories.find(cat => cat.id === categoryId);
      if (!category) {
        throw new Error('分类不存在');
      }
      
      category.images = category.images.filter(img => img !== filename);
      await fs.writeFile(this.categoriesFile, JSON.stringify(categories, null, 2));
      
      return '移除成功';
    } catch (error) {
      console.error('从分类中移除图片失败:', error);
      throw error;
    }
  }

  // 从所有分类中移除图片
  async removeImageFromAllCategories(filename) {
    try {
      const data = await fs.readFile(this.categoriesFile, 'utf8');
      const categories = JSON.parse(data);
      
      let updated = false;
      categories.categories.forEach(category => {
        const originalLength = category.images.length;
        category.images = category.images.filter(img => img !== filename);
        if (category.images.length !== originalLength) {
          updated = true;
        }
      });
      
      if (updated) {
        await fs.writeFile(this.categoriesFile, JSON.stringify(categories, null, 2));
      }
    } catch (error) {
      console.error('从所有分类中移除图片失败:', error);
    }
  }

  // 批量移动图片到指定分类
  async moveImagesToCategory(filenames, categoryId) {
    try {
      const data = await fs.readFile(this.categoriesFile, 'utf8');
      const categories = JSON.parse(data);
      
      for (const filename of filenames) {
        categories.categories.forEach(category => {
          category.images = category.images.filter(img => img !== filename);
        });
      }
      
      if (categoryId) {
        const targetCategory = categories.categories.find(cat => cat.id === categoryId);
        if (!targetCategory) {
          throw new Error('目标分类不存在');
        }
        for (const filename of filenames) {
          if (!targetCategory.images.includes(filename)) {
            targetCategory.images.push(filename);
          }
        }
      }
      
      await fs.writeFile(this.categoriesFile, JSON.stringify(categories, null, 2));
      return '移动成功';
    } catch (error) {
      console.error('移动图片到分类失败:', error);
      throw error;
    }
  }

  // 获取分类中的图片
  async getImagesByCategory(categoryId, host) {
    try {
      const data = await fs.readFile(this.categoriesFile, 'utf8');
      const categories = JSON.parse(data);
      
      const category = categories.categories.find(cat => cat.id === categoryId);
      if (!category) {
        throw new Error('分类不存在');
      }
      
      const images = await Promise.all(category.images.map(async filename => {
        const filePath = path.join(this.uploadDir, filename);
        
        // 检查文件是否存在
        try {
          await fs.access(filePath);
        } catch {
          console.log('图片文件不存在:', filename);
          return null;
        }
        
        const thumbFile = 'thumb_' + filename;
        let hasThumbnail = false;
        try {
          await fs.access(path.join(this.thumbnailDir, thumbFile));
          hasThumbnail = true;
        } catch {
          hasThumbnail = false;
        }
        return {
          filename: filename,
          url: `http://${host}/uploads/${filename}`,
          thumbnail: hasThumbnail
            ? `http://${host}/thumbnails/${thumbFile}`
            : `http://${host}/uploads/${filename}`
        };
      }));
      
      // 过滤掉不存在的图片
      return images.filter(img => img !== null);
    } catch (error) {
      console.error('获取分类中的图片失败:', error);
      throw error;
    }
  }

  // 获取随机图片（单张）
  async getRandomImage(host, categoryId = null, imageList = null) {
    try {
      let images;
      
      if (imageList && imageList.length > 0) {
        images = imageList.map(filename => ({
          filename,
          url: `http://${host}/uploads/${filename}`,
          thumbnail: `http://${host}/uploads/${filename}`
        }));
      } else if (categoryId) {
        images = await this.getImagesByCategory(categoryId, host);
      } else {
        images = await this.getImages(host);
      }
      
      if (images.length === 0) {
        return null;
      }
      
      const randomIndex = Math.floor(Math.random() * images.length);
      return images[randomIndex];
    } catch (error) {
      console.error('获取随机图片失败:', error);
      return null;
    }
  }

  // 获取随机图片（多张，用于幻灯片）
  async getRandomImages(host, count = 10, categoryId = null, imageList = null) {
    try {
      let images;
      
      if (imageList && imageList.length > 0) {
        images = imageList.map(filename => ({
          filename,
          url: `http://${host}/uploads/${filename}`,
          thumbnail: `http://${host}/uploads/${filename}`
        }));
      } else if (categoryId) {
        images = await this.getImagesByCategory(categoryId, host);
      } else {
        images = await this.getImages(host);
      }
      
      if (images.length === 0) {
        return [];
      }
      
      const shuffled = [...images].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(count, shuffled.length));
    } catch (error) {
      console.error('获取随机图片列表失败:', error);
      return [];
    }
  }

  // 获取图片总数
  async getImageCount(categoryId = null) {
    try {
      if (categoryId) {
        const data = await fs.readFile(this.categoriesFile, 'utf8');
        const categories = JSON.parse(data);
        const category = categories.categories.find(cat => cat.id === categoryId);
        return category ? category.images.length : 0;
      } else {
        const files = await fs.readdir(this.uploadDir);
        return files.filter(file => /\.(jpeg|jpg|png|gif|webp|svg)$/i.test(file)).length;
      }
    } catch (error) {
      console.error('获取图片数量失败:', error);
      return 0;
    }
  }
}

module.exports = new ImageService();
