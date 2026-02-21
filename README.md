# 🚀 光影穿梭机 HOME (gycsj-image)

一个简单轻量的个人图床项目，支持 Docker 部署。

## ✨ 功能特性

- 🔐 **用户认证** - 登录保护，防止未授权访问
- ⚙️ **账户管理** - 支持修改用户名和密码
- 🖼️ **图片库** - 简洁的图片展示界面
- 📤 **独立上传页面** - 专门的上传功能页面
- 📁 **批量上传** - 支持选择整个文件夹一键上传
- 📁 支持批量上传（最多 100 张）
- 🖼️ **自动生成缩略图** - 快速预览
- 🔗 一键复制多种格式（链接/Markdown/BBCode/HTML）
- 🗑️ **批量删除** - 支持多选删除图片
- 🌙 **暗色模式** - 护眼主题切换
- 📱 响应式设计，支持移动端
- 🐳 Docker 一键部署
- 🎨 **自定义 Logo** - 光影穿梭机主题标识

## 🚀 快速开始

### 方式一：Docker Hub（推荐）

```bash
# 拉取镜像并启动
docker pull jinkang19940922/gycsj-image:latest
docker run -d \
  -p 23400:23400 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/thumbnails:/app/thumbnails \
  -v $(pwd)/data:/app/data \
  -e PORT=23400 \
  -e ADMIN_USERNAME=jinkang \
  -e ADMIN_PASSWORD=70719405 \
  --name gycsj-image \
  jinkang19940922/gycsj-image:latest

# 查看日志
docker logs -f gycsj-image

# 停止服务
docker stop gycsj-image && docker rm gycsj-image
```

### 方式二：Docker Compose

```bash
# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

### 方式三：本地构建 Docker

```bash
# 构建镜像
docker build -t gycsj-image .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/thumbnails:/app/thumbnails \
  -v $(pwd)/data:/app/data \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=your-password \
  --name gycsj-image \
  gycsj-image
```

### 方式三：Node.js 直接运行

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

1. 访问 `http://localhost:3000`
2. 使用默认账号登录（admin / admin123）
3. **图片库** - 查看和管理已上传的图片
4. **上传图片** - 点击导航栏「上传图片」进入上传页面
5. 选择文件或文件夹，或拖拽图片到上传区域
6. 上传完成后自动跳转到图片库
7. 点击图片可预览大图
8. 点击「📋 复制」选择格式（图片链接/Markdown/BBCode/HTML）
9. 点击「✓ 批量管理」可多选删除图片
10. 点击右上角「⚙️ 设置」可修改用户名和密码
11. 点击右上角「🌙」切换主题

## 🔌 API 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/login` | 用户登录 |
| POST | `/api/logout` | 用户登出 |
| GET | `/api/auth/status` | 检查登录状态 |
| POST | `/api/account/update` | 更新账户信息 |
| POST | `/api/upload` | 上传单张图片 |
| POST | `/api/upload/multiple` | 批量上传（最多 100 张） |
| GET | `/api/images` | 获取图片列表 |
| DELETE | `/api/images/:filename` | 删除指定图片 |
| GET | `/api/health` | 健康检查 |

### 上传响应示例

```json
{
  "success": true,
  "images": [
    {
      "url": "http://localhost:3000/uploads/xxx.jpg",
      "thumbnail": "http://localhost:3000/thumbnails/thumb_xxx.jpg",
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
│   └── index.html       # 前端页面
├── uploads/             # 原图存储目录
├── thumbnails/          # 缩略图存储目录
├── data/
│   └── users.json       # 用户数据
├── server.js            # 后端服务
├── package.json         # 项目配置
├── Dockerfile           # Docker 镜像
├── docker-compose.yml   # Docker Compose 配置
└── README.md            # 说明文档
```

## 📝 限制

- 支持格式：JPG, PNG, GIF, WebP, SVG
- 单文件最大：10MB
- 批量上传：最多 100 张（超过自动分批）

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
docker compose logs
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
docker compose restart
```

**Q: 如何备份图片数据？**
```bash
# 备份 uploads 和 thumbnails 目录
tar -czf image-backup.tar.gz uploads/ thumbnails/ data/
```

## 📄 License

MIT

---

**项目名称**: gycsj-image  
**版本**: 1.0.0  
**作者**: 光影穿梭机团队
