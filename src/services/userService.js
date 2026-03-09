const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

class UserService {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.userFile = path.join(this.dataDir, 'users.json');
    this.users = {};
    
    // 初始化
    this.initialize();
  }

  // 初始化
  async initialize() {
    try {
      // 确保目录存在
      try {
        await fs.access(this.dataDir);
      } catch {
        await fs.mkdir(this.dataDir, { recursive: true });
      }
      
      // 加载用户数据
      await this.loadUsers();
    } catch (error) {
      console.error('初始化用户服务失败:', error);
    }
  }

  // 加载用户数据
  async loadUsers() {
    try {
      await fs.access(this.userFile);
      const data = await fs.readFile(this.userFile, 'utf8');
      this.users = JSON.parse(data);
    } catch (error) {
      // 文件不存在，创建默认管理员
      const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
      this.users = {
        [process.env.ADMIN_USERNAME || 'admin']: { password: hashedPassword }
      };
      await this.saveUsers();
    }
  }

  // 保存用户数据
  async saveUsers(users = this.users) {
    try {
      await fs.writeFile(this.userFile, JSON.stringify(users));
    } catch (error) {
      console.error('保存用户数据失败:', error);
      throw new Error('保存用户数据失败');
    }
  }

  // 验证用户
  validateUser(username, password) {
    const user = this.users[username];
    if (!user) {
      return false;
    }
    return bcrypt.compareSync(password, user.password);
  }

  // 更新用户信息
  async updateUser(currentUsername, currentPassword, newUsername, newPassword) {
    // 验证当前密码
    const user = this.users[currentUsername];
    if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
      throw new Error('当前密码错误');
    }

    // 检查新用户名是否已存在
    if (newUsername !== currentUsername && this.users[newUsername]) {
      throw new Error('用户名已存在');
    }

    // 更新用户信息
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    this.users[newUsername] = { password: hashedPassword };
    
    // 如果是重命名，删除旧用户
    if (newUsername !== currentUsername) {
      delete this.users[currentUsername];
    }
    
    await this.saveUsers();
    return newUsername;
  }

  // 获取用户
  getUser(username) {
    return this.users[username];
  }
}

module.exports = new UserService();
