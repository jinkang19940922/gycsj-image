FROM node:18-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制应用代码
COPY . .

# 创建 uploads 目录
RUN mkdir -p /app/uploads

# 暴露端口
EXPOSE 23400

# 启动命令
CMD ["node", "server.js"]
