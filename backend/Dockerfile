# 使用官方 Node.js 運行時作為基底映像
FROM node:18-alpine

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production

# 複製應用程式代碼
COPY . .

# 建立應用程式
RUN npm run build

# 暴露端口
EXPOSE 3000

# 建立非 root 使用者
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 切換到非 root 使用者
USER nodejs

# 啟動應用程式
CMD ["npm", "start"]
