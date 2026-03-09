const userService = require('../services/userService');

class UserController {
  // 登录
  async login(req, res) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: '请输入用户名和密码' });
      }
      
      const isValid = userService.validateUser(username, password);
      if (!isValid) {
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
  }

  // 登出
  async logout(req, res) {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ error: '登出失败' });
      }
      res.json({ success: true, message: '登出成功' });
    });
  }

  // 检查登录状态
  async checkAuthStatus(req, res) {
    if (req.session && req.session.loggedIn) {
      res.json({
        loggedIn: true,
        username: req.session.username
      });
    } else {
      res.json({ loggedIn: false });
    }
  }

  // 更新账户信息
  async updateAccount(req, res) {
    try {
      const { currentPassword, newUsername, newPassword } = req.body;
      const currentUser = req.session.username;

      if (!currentPassword || !newUsername || !newPassword) {
        return res.status(400).json({ error: '请填写所有字段' });
      }

      const newUser = await userService.updateUser(currentUser, currentPassword, newUsername, newPassword);
      
      // 更新 session
      req.session.username = newUser;

      res.json({
        success: true,
        message: '账户信息更新成功',
        username: newUser
      });
    } catch (error) {
      console.error('更新账户失败:', error);
      if (error.message === '当前密码错误') {
        res.status(401).json({ error: error.message });
      } else if (error.message === '用户名已存在') {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  }
}

module.exports = new UserController();
