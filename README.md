# 🚀 光影穿梭机 HOME (gycsj-image)

一个简单轻量的个人图床项目，支持 Docker 部署。

## ✨ 功能特性

### 🔐 用户管理
- 登录保护，防止未授权访问
- 登录界面美化 - 必应每日壁纸 + 每日一言
- 支持修改用户名和密码

### 🖼️ 图片管理
- 简洁优雅的图片展示界面
- 独立上传页面 - 专门的上传功能页面
- 批量上传 - 支持选择整个文件夹一键上传（最多 1000 张，超过自动分批）
- 自动生成缩略图 - 快速预览
- 一键复制多种格式（链接/Markdown/BBCode/HTML）
- 批量删除 - 支持多选删除图片
- 图片分组 - 支持按分组管理图片

### 🖼️ 图片预览（v2.2.0 全新优化）
- **简化预览体验** - 点击图片直接预览原图，无需切换
- **动态工具栏** - 鼠标移动时显示，静止2.5秒后自动隐藏
- **双关闭按钮** - 右上角 + 图片上方中央，便捷退出预览
- **平滑动画** - 300ms过渡动画，体验流畅
- 放大缩小、全屏、拖拽查看
- 滚轮缩放、双击重置
- 隐藏滚动条，沉浸式体验

### 🎨 展厅模式（v2.2.0 新增）
- **沉浸式画廊** - 全屏动态图片展示，4列双向流动效果
- **智能交互** - 鼠标移动显示控制按钮，静止3秒后自动隐藏
- **快捷键支持** - ESC键快速退出展厅模式
- **无缝滚动** - 图片列自动复制，实现无限循环播放
- **视觉优化** - 图片保持原始比例，无变形，全屏覆盖无留白

### 📷 公共图片库
- 必应每日壁纸展示、下载和转存

### 🔧 API工具
- 强大的随机图片API生成器

### 🎨 UI/UX
- 暗色模式 - 护眼主题切换
- 精美的UI设计 - 现代渐变背景 + 动画效果
- 自定义 Logo - 光影穿梭机主题标识
- 响应式设计，支持移动端

### 🐳 部署
- Docker 一键部署
- 多种部署方式可选

## 🚀 快速开始

### 方式一：Docker Hub（推荐）

```bash
# 拉取镜像并启动
docker pull jinkang19940922/gycsj-image:latest
docker run -d \
  -p 23400:3000 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/thumbnails:/app/thumbnails \
  -v $(pwd)/data:/app/data \
  -e PORT=3000 \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=admin123 \
  --name gycsj-image \
  jinkang19940922/gycsj-image:latest

# 查看日志
docker logs -f gycsj-image

# 停止服务
docker stop gycsj-image && docker rm gycsj-image
```

### 方式二：Docker Compose

```bash
# 构建并启动服务
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 方式三：本地构建 Docker

```bash
# 构建镜像
docker build -t gycsj-image .

# 运行容器
docker run -d \
  -p 23400:3000 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/thumbnails:/app/thumbnails \
  -v $(pwd)/data:/app/data \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=your-password \
  --name gycsj-image \
  gycsj-image
```

### 方式四：Node.js 直接运行

```bash
# 安装依赖
npm install

# 启动服务
npm start
```

## 🔐 默认账号

- **用户名**: `admin`
- **密码**: `admin123`

**⚠️ 首次部署请修改密码！** 通过环境变量设置：

```bash
# docker-compose.yml 中修改:
environment:
  - ADMIN_USERNAME=your-username
  - ADMIN_PASSWORD=your-password
  - SESSION_SECRET=your-secret-key
```

## 📖 使用说明

### 基础操作

1. 访问 `http://localhost:23400`
2. 使用默认账号登录（admin / admin123）
3. **图片库** - 查看和管理已上传的图片
4. **上传图片** - 点击导航栏「上传图片」进入上传页面
5. 选择文件或文件夹，或拖拽图片到上传区域
6. 上传完成后自动跳转到图片库
7. 点击图片可预览大图（支持放大缩小、全屏、拖拽）
8. 点击「📋 复制」选择格式（图片链接/Markdown/BBCode/HTML）
9. 点击「✓ 批量管理」可多选删除图片
10. 点击「公共图片」查看和下载必应每日壁纸
11. 点击「API工具」生成随机图片API链接
12. 点击右上角「⚙️ 设置」可修改用户名和密码
13. 点击右上角「🌙」切换主题

### 展厅模式使用

1. 在图片库页面点击工具栏中的「展厅模式」按钮
2. 进入展厅模式后，图片将以4列动态流动形式展示
3. 鼠标移动时显示退出按钮，静止3秒后自动隐藏
4. 按 ESC 键可快速退出展厅模式
5. 点击右上角的「退出展厅」按钮也可退出

### 图片预览快捷键

| 功能 | 快捷键 |
|------|--------|
| 上一张 | ← 或 左箭头 |
| 下一张 | → 或 右箭头 |
| 放大 | + 或 = |
| 缩小 | - |
| 重置大小 | 0 |
| 全屏 | F |
| 关闭 | ESC |
| 放大后拖拽 | 按住鼠标左键拖动 |
| 双击重置 | 双击图片 |
| 滚轮放大缩小 | 鼠标滚轮上下滑动 |

### 展厅模式快捷键

| 功能 | 快捷键 |
|------|--------|
| 退出展厅模式 | ESC |

## 🔌 API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/login` | 用户登录 |
| POST | `/api/logout` | 用户登出 |
| GET | `/api/auth/status` | 检查登录状态 |
| POST | `/api/account/update` | 更新账户信息 |
| POST | `/api/upload` | 上传单张图片 |
| POST | `/api/upload/multiple` | 批量上传（最多 1000 张，超过自动分批） |
| GET | `/api/images` | 获取图片列表 |
| DELETE | `/api/images/:filename` | 删除指定图片 |
| GET | `/api/bing-wallpapers` | 获取必应壁纸列表 |
| GET | `/api/bing-wallpapers/login` | 获取登录页面壁纸 |
| POST | `/api/bing-wallpapers/save` | 保存壁纸到图库 |
| GET | `/api/daily-quote` | 获取每日一言 |
| GET | `/api/random-quote` | 获取随机名言 |
| GET | `/api/health` | 健康检查 |

### 上传响应示例

```json
{
  "success": true,
  "images": [
    {
      "url": "http://localhost:23400/uploads/xxx.jpg",
      "thumbnail": "http://localhost:23400/thumbnails/thumb_xxx.jpg",
      "filename": "xxx.jpg",
      "size": 102400
    }
  ]
}
```

## ⚙️ 配置

| 环境变量 | 默认值 | 描述 |
|----------|--------|------|
| PORT | 3000 | 服务端口 |
| ADMIN_USERNAME | admin | 管理员用户名 |
| ADMIN_PASSWORD | admin123 | 管理员密码 |
| SESSION_SECRET | 自动生成 | Session 密钥（生产环境请修改） |

## 📂 目录结构

```
gycsj-image/
├── public/
│   ├── index.html       # 前端页面
│   ├── css/
│   │   └── style.css    # 样式文件
│   └── js/
│       └── main.js      # 前端脚本
├── src/
│   ├── controllers/     # 控制器
│   ├── services/        # 服务层
│   ├── middleware/      # 中间件
│   └── routes/          # 路由
├── uploads/             # 原图存储目录
├── thumbnails/          # 缩略图存储目录
├── data/
│   └── users.json       # 用户数据
├── server.js            # 后端服务
├── package.json         # 项目配置
├── Dockerfile           # Docker 镜像
├── docker-compose.yml   # Docker Compose 配置
├── CHANGELOG.md         # 更新日志
├── RELEASE_NOTES.md     # 版本发布说明
└── README.md            # 说明文档
```

## 📝 使用限制

| 限制项 | 说明 |
|--------|------|
| 支持格式 | JPG, PNG, GIF, WebP, SVG |
| 单文件大小 | 最大 300MB |
| 批量上传数量 | 最多 1000 张（超过自动分批，每批100张） |
| 文件命名 | 自动使用原文件名，重复时自动添加序号 |

## 🛡️ 安全提示

- ⚠️ 首次部署请修改默认密码
- ⚠️ 生产环境请修改 `SESSION_SECRET`
- 建议配置反向代理（如 Nginx）并启用 HTTPS
- 本项目为个人使用设计，如需多用户请自行扩展

## 🔧 故障排查

**Q: 无法访问页面？**
```bash
# 检查容器状态
docker ps

# 查看日志
docker-compose logs
```

**Q: 上传失败？**
```bash
# 检查目录权限
docker exec gycsj-image ls -la /app/
```

**Q: 如何重置密码？**
```bash
# 删除 data 目录重启
rm -rf ./data
docker-compose restart
```

**Q: 如何备份图片数据？**
```bash
# 备份 uploads 和 thumbnails 目录
tar -czf image-backup.tar.gz uploads/ thumbnails/ data/
```

**Q: 展厅模式显示异常？**
```bash
# 清除浏览器缓存并刷新页面
# 或使用无痕模式访问
```

## 📄 License

MIT

---

**项目名称**: gycsj-image  
**版本**: 2.2.0  
**作者**: 光影穿梭机团队  
**最后更新**: 2026-03-15

## 🎨 版本更新日志

### v2.2.0 (2026-03-15) - 展厅模式与预览优化

#### ✨ 新增功能
- **展厅模式** - 沉浸式动态图片画廊，4列双向流动展示
- **智能交互** - 鼠标移动检测，按钮自动显示/隐藏
- **ESC键支持** - 展厅模式下按ESC键快速退出
- **无缝滚动** - 图片列自动复制，实现无限循环播放

#### 🔧 优化改进
- **预览功能重构** - 移除冗余的原图切换，点击直接预览原图
- **全屏显示优化** - 修复全屏黑边问题，优化显示比例
- **界面简化** - 移除原图/缩略图切换按钮，提升用户体验

#### 🐛 问题修复
- **修复原图预览报错** - 解决 `ReferenceError: isOriginalMode is not defined` 错误
- **修复展厅模式布局** - 解决右侧空白、图片变形、列间距异常问题

#### 📚 文档更新
- 添加详细 `CHANGELOG.md`
- 添加 `RELEASE_NOTES.md` 版本发布说明
- 更新 `README.md` 文档

### v2.1.0 (2026-03-15) - 预览体验大幅优化

#### ✨ 新增功能
- **工具栏动态显示/隐藏** - 鼠标移动时自动显示，静止2.5秒后自动隐藏
- **双关闭按钮设计** - 保留右上角关闭按钮，新增图片上方中央关闭按钮
- **最小化提示条** - 工具栏隐藏时显示提示条，提示用户重新显示

#### 🎨 UI/UX改进
- 工具栏移动到底部，视觉更自然
- 隐藏预览滚动条，提升沉浸式体验
- 下载按钮整合进工具栏，一体化设计
- 按钮样式统一，视觉一致性
- 300ms平滑过渡动画，体验流畅

#### 🔧 技术优化
- 防抖机制(Debounce)优化性能
- 版本号控制解决浏览器缓存
- 全屏模式优化
- 响应式多分辨率适配

#### 🐛 Bug修复
- 修复登录页面模态框异常显示问题
- 修复全屏状态下工具栏一直显示的问题

### v2.0.0 (2025-12-01)
- ✨ 新增登录界面必应每日壁纸
- ✨ 新增每日一言功能
- ✨ 新增公共图片库（必应壁纸展示）
- ✨ 新增图片分组管理
- ✨ 增强图片预览功能（放大缩小、全屏、拖拽）
- ✨ 新增API工具页面
- 🎨 整体UI美化升级
- 🎨 添加动态背景和装饰元素
- 🎨 优化卡片和按钮样式
- 🐛 修复登录功能问题
- 🐛 修复全屏预览问题

### v1.0.0 (2025-10-01)
- 🚀 初始版本发布
- 🔐 用户认证功能
- 🖼️ 图片库和上传功能
- 🌙 暗色模式
- 📱 响应式设计

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

### 报告问题
- 请在 [GitHub Issues](https://github.com/jinkang19940922/gycsj-image/issues) 中提交问题
- 提供详细的复现步骤和环境信息
- 如有可能，请附上截图或错误日志

### 提交代码
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范
- 遵循现有代码风格
- 添加必要的注释
- 确保代码通过测试
- 更新相关文档

## 📞 联系方式

- **GitHub**: https://github.com/jinkang19940922/gycsj-image
- **Issues**: https://github.com/jinkang19940922/gycsj-image/issues
- **项目主页**: https://github.com/jinkang19940922/gycsj-image

## 🙏 致谢

感谢所有为本项目做出贡献的用户和开发者！

---

**立即体验 v2.2.0 的全新展厅模式！** 🚀
