# 文青文具小舖管理系統

一個使用 Vue 3 + TypeScript + Express.js + PostgreSQL 開發的現代化文具店管理系統。

## 📋 功能特色

- 🏪 **商品管理**：新增、編輯、刪除商品，支援分類管理
- 📦 **庫存管理**：進貨、出貨、庫存調整，低庫存警示
- 💰 **銷售管理**：銷售記錄、營收統計、銷售分析
- 📊 **數據儀表板**：即時統計資料和視覺化圖表
- 🔍 **搜尋功能**：快速搜尋商品和記錄
- 📱 **響應式設計**：支援桌面和行動裝置

## 🛠 技術棧

### 前端
- **Vue 3** - 漸進式 JavaScript 框架
- **TypeScript** - 型別安全的 JavaScript
- **Vite** - 快速的建構工具
- **Tailwind CSS** - 實用工具優先的 CSS 框架
- **Vue Router** - 官方路由管理
- **Pinia** - Vue 狀態管理庫
- **Axios** - HTTP 客戶端
- **Heroicons & Lucide Vue** - 圖示庫

### 後端
- **Node.js** - JavaScript 執行環境
- **Express.js** - Web 應用程式框架
- **TypeScript** - 型別安全的 JavaScript
- **PostgreSQL** - 關聯式資料庫
- **Express Validator** - 輸入驗證中間件

### 開發工具
- **Docker** - 容器化部署
- **ESLint** - 程式碼檢查
- **Prettier** - 程式碼格式化

## 📁 專案結構

```
1140527-html-test/
├── src/                          # 前端原始碼
│   ├── components/               # Vue 元件
│   ├── types/                    # TypeScript 型別定義
│   ├── App.vue                   # 主應用程式元件
│   └── main.ts                   # 應用程式入口點
├── backend/                      # 後端原始碼
│   ├── src/
│   │   ├── controllers/          # 控制器層
│   │   ├── services/             # 業務邏輯層
│   │   ├── models/               # 資料存取層
│   │   ├── routes/               # 路由定義
│   │   ├── middleware/           # 中間件
│   │   ├── config/               # 配置檔案
│   │   └── types/                # 型別定義
│   └── package.json              # 後端依賴管理
├── database/                     # 資料庫初始化腳本
├── docker-compose.yml            # Docker 容器編排
└── package.json                  # 前端依賴管理
```

## 🚀 快速開始

### 環境需求

- Node.js 18+ 
- PostgreSQL 12+
- Docker & Docker Compose (可選)

### 方法一：使用 Docker (推薦)

1. **克隆專案**
   ```bash
   git clone <repository-url>
   cd 1140527-html-test
   ```

2. **啟動所有服務**
   ```bash
   docker-compose up -d
   ```

3. **訪問應用程式**
   - 前端：http://localhost:5173
   - 後端 API：http://localhost:3000

### 方法二：本地開發

1. **克隆專案**
   ```bash
   git clone <repository-url>
   cd 1140527-html-test
   ```

2. **設定資料庫**
   ```bash
   # 建立 PostgreSQL 資料庫
   createdb stationery_shop
   
   # 執行初始化腳本
   psql -d stationery_shop -f database/init.sql
   ```

3. **後端設定**
   ```bash
   cd backend
   
   # 安裝依賴
   npm install
   
   # 建立環境變數檔案
   cp .env.example .env
   
   # 編輯 .env 設定資料庫連線
   # DB_HOST=localhost
   # DB_PORT=5432
   # DB_NAME=stationery_shop
   # DB_USER=your_username
   # DB_PASSWORD=your_password
   
   # 啟動開發伺服器
   npm run dev
   ```

4. **前端設定**
   ```bash
   # 回到專案根目錄
   cd ..
   
   # 安裝依賴
   npm install
   
   # 啟動開發伺服器
   npm run dev
   ```

## 📚 API 文件

### 商品管理
- `GET /api/products` - 取得所有商品
- `GET /api/products/:id` - 取得單一商品
- `POST /api/products` - 新增商品
- `PUT /api/products/:id` - 更新商品
- `DELETE /api/products/:id` - 刪除商品

### 庫存管理
- `GET /api/inventory/transactions` - 取得庫存異動記錄
- `POST /api/inventory/in` - 商品進貨
- `POST /api/inventory/out` - 商品出貨
- `POST /api/inventory/adjust` - 庫存調整

### 銷售管理
- `GET /api/sales` - 取得銷售記錄
- `POST /api/sales` - 新增銷售記錄
- `GET /api/sales/stats` - 取得銷售統計

## 🔧 開發指令

### 前端
```bash
npm run dev          # 啟動開發伺服器
npm run build        # 建構生產版本
npm run preview      # 預覽生產版本
```

### 後端
```bash
cd backend
npm run dev          # 啟動開發伺服器
npm run build        # 編譯 TypeScript
npm run start        # 啟動生產伺服器
npm run test         # 執行測試
```

## 🐳 Docker 部署

使用 Docker Compose 一鍵部署：

```bash
# 啟動所有服務
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 查看日誌
docker-compose logs -f

# 停止服務
docker-compose down
```

## 📝 環境變數

### 後端環境變數 (.env)
```env
# 伺服器設定
PORT=3000
NODE_ENV=development

# 資料庫設定
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stationery_shop
DB_USER=your_username
DB_PASSWORD=your_password

# CORS 設定
FRONTEND_URL=http://localhost:5173
```

## 🤝 貢獻指南

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權條款

此專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 檔案

## 📞 聯絡資訊

- 專案維護者：文青文具小舖開發團隊
- 電子郵件：[your-email@example.com]
- 專案連結：[https://github.com/your-username/1140527-html-test]

## 🔗 相關連結

- [Vue.js 官方文件](https://vuejs.org/)
- [TypeScript 官方文件](https://www.typescriptlang.org/)
- [Express.js 官方文件](https://expressjs.com/)
- [PostgreSQL 官方文件](https://www.postgresql.org/)
- [Tailwind CSS 官方文件](https://tailwindcss.com/)
