# 构建阶段
FROM node:18-alpine AS build

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm install

# 复制应用代码
COPY . .

# 生产阶段
FROM node:18-alpine

WORKDIR /app

# 从构建阶段复制依赖和代码
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server.js ./
COPY --from=build /app/public ./public
COPY --from=build /app/src ./src

# 创建必要的目录
RUN mkdir -p /app/uploads /app/thumbnails /app/data && \
    chown -R node:node /app

# 切换到非root用户
USER node

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# 启动命令
CMD ["node", "server.js"]
