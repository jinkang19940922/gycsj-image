# 光影穿梭机 v2.0.1 更新说明

## 📝 更新内容

### 🚀 功能优化

1. **批量删除功能优化**
   - 将并行删除改为串行删除，确保服务器稳定
   - 增加删除进度条显示，实时反馈删除状态
   - 优化错误处理和重试机制，提高删除成功率

2. **上传限制更新**
   - 单文件大小限制从 10MB 提升到 300MB
   - 批量上传限制从 100 张提升到 1000 张
   - 更新相关错误提示信息

3. **用户体验改进**
   - 将默认分组名称从 "home" 改为 "默认"，更符合中文用户习惯
   - 优化删除进度显示，提供更清晰的操作反馈

### 🐛 问题修复

1. **批量删除问题**
   - 修复批量删除时服务器过载导致的失败问题
   - 解决删除后剩余少量图片的问题

2. **错误提示优化**
   - 修正文件大小限制的错误提示信息
   - 统一错误处理逻辑

3. **其他修复**
   - 优化分组管理功能
   - 改进前端交互体验

## 📦 Docker 镜像信息

### 镜像标签
- `jinkang19940922/gycsj-image:latest` - 最新稳定版
- `jinkang19940922/gycsj-image:2.0.1` - v2.0.1 版本

### 拉取镜像
```bash
# 拉取最新版本
docker pull jinkang19940922/gycsj-image:latest

# 拉取指定版本
docker pull jinkang19940922/gycsj-image:2.0.1
```

### 运行容器
```bash
docker run -d \
  -p 23400:3000 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/thumbnails:/app/thumbnails \
  -v $(pwd)/data:/app/data \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=admin123 \
  --name gycsj-image \
  jinkang19940922/gycsj-image:latest
```

### 使用 Docker Compose
```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 🆙 升级指南

### 从 v2.0.0 升级
1. 停止当前运行的容器
2. 拉取最新镜像
3. 重新启动容器
4. 数据会自动保留，无需额外操作

### 全新安装
参考 README.md 文件中的安装说明

## 📞 支持

如果遇到任何问题，请查看项目文档或提交 issue。

---

**版本号**: v2.0.1  
**发布日期**: 2026-03-10  
**项目地址**: https://github.com/jinkang19940922/gycsj-image