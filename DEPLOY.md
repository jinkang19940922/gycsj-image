# 光影穿梭机 - Docker 部署说明

## 快速部署

### 方式一：使用 Docker Compose（推荐）

```bash
# 1. 拉取 Docker 镜像
docker pull jinkang19940922/gycsj-image:latest

# 2. 启动容器
docker-compose up -d

# 3. 查看运行状态
docker-compose ps
```

### 方式二：使用 Docker Run

```bash
# 1. 拉取 Docker 镜像
docker pull jinkang19940922/gycsj-image:latest

# 2. 创建数据目录
mkdir uploads thumbnails data

# 3. 启动容器
docker run -d -p 23400:23400 \
  -v ./uploads:/app/uploads \
  -v ./thumbnails:/app/thumbnails \
  -v ./data:/app/data \
  -e PORT=23400 \
  -e ADMIN_USERNAME=jinkang \
  -e ADMIN_PASSWORD=70719405 \
  --name gycsj-image \
  jinkang19940922/gycsj-image:latest
```

## 访问服务

- 服务地址：http://localhost:3000
- 默认管理员账号：
  - 用户名：`admin`
  - 密码：`admin123`

## 修改配置

如需修改管理员账号等配置，编辑 `docker-compose.yml` 中的环境变量：

```yaml
environment:
  - ADMIN_USERNAME=your-username
  - ADMIN_PASSWORD=your-password
  - SESSION_SECRET=your-secret-key
```

## 常用命令

```bash
# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 进入容器
docker exec -it gycsj-image sh
```

## 注意事项

1. 确保已安装 Docker 和 Docker Compose
2. 确保 3000 端口未被占用
3. 数据持久化在 `uploads`、`thumbnails`、`data` 目录
4. 生产环境请修改默认密码和 SESSION_SECRET
