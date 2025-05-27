import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import 'reflect-metadata';

import { Database } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// 路由
import productRoutes from './routes/products';
import inventoryRoutes from './routes/inventory';
import salesRoutes from './routes/sales';

// 載入環境變數
dotenv.config();

class App {
  public app: express.Application;
  private database: Database;

  constructor() {
    this.app = express();
    this.database = Database.getInstance();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // 安全性中介軟體
    this.app.use(helmet());
    
    // CORS 設定
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }));

    // 速率限制
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 分鐘
      max: 100, // 每個 IP 最多 100 個請求
      message: {
        success: false,
        error: '請求過於頻繁，請稍後再試'
      }
    });
    this.app.use('/api', limiter);

    // 壓縮回應
    this.app.use(compression());

    // 記錄請求
    this.app.use(morgan('combined'));

    // 解析請求體
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  private initializeRoutes(): void {
    // 健康檢查
    this.app.get('/api/health', (req, res) => {
      res.json({
        success: true,
        message: '文青文具小舖 API 正常運行',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // API 路由
    this.app.use('/api/products', productRoutes);
    this.app.use('/api/inventory', inventoryRoutes);
    this.app.use('/api/sales', salesRoutes);

    // 根路由
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: '歡迎使用文青文具小舖管理系統 API',
        endpoints: {
          health: '/api/health',
          products: '/api/products',
          inventory: '/api/inventory',
          sales: '/api/sales'
        }
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 處理
    this.app.use(notFoundHandler);
    
    // 錯誤處理
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    const port = process.env.PORT || 3000;

    try {
      // 連接資料庫
      await this.database.connect();
      
      // 初始化資料庫表格
      await this.database.initializeTables();

      // 啟動伺服器
      this.app.listen(port, () => {
        console.log(`🚀 文青文具小舖 API 伺服器已啟動`);
        console.log(`📍 位址: http://localhost:${port}`);
        console.log(`🔗 健康檢查: http://localhost:${port}/api/health`);
        console.log(`📚 API 文件: http://localhost:${port}/api`);
      });
    } catch (error) {
      console.error('❌ 伺服器啟動失敗:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.database.disconnect();
      console.log('🛑 伺服器已停止');
    } catch (error) {
      console.error('❌ 伺服器停止時發生錯誤:', error);
    }
  }
}

// 優雅關閉
const app = new App();

process.on('SIGTERM', async () => {
  console.log('📫 收到 SIGTERM 信號，正在優雅關閉...');
  await app.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📫 收到 SIGINT 信號，正在優雅關閉...');
  await app.stop();
  process.exit(0);
});

// 啟動應用程式
app.start().catch((error) => {
  console.error('❌ 應用程式啟動失敗:', error);
  process.exit(1);
});

export default app;
