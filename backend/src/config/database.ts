import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'stationery_shop',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async connect(): Promise<void> {
    try {
      await this.pool.connect();
      console.log('✅ 資料庫連線成功');
    } catch (error) {
      console.error('❌ 資料庫連線失敗:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    await this.pool.end();
    console.log('📴 資料庫連線已關閉');
  }

  public async initializeTables(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // 建立商品表
      await client.query(`
        CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          category VARCHAR(50) NOT NULL CHECK (category IN ('pen', 'paper', 'office', 'other')),
          description TEXT,
          unit VARCHAR(20) NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          cost DECIMAL(10,2) NOT NULL,
          stock INTEGER NOT NULL DEFAULT 0,
          min_stock INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 建立庫存異動表
      await client.query(`
        CREATE TABLE IF NOT EXISTS inventory_transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          type VARCHAR(10) NOT NULL CHECK (type IN ('in', 'out', 'adjust')),
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10,2),
          total_amount DECIMAL(10,2),
          reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 建立銷售記錄表
      await client.query(`
        CREATE TABLE IF NOT EXISTS sales_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          total_amount DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 建立索引
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
        CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id ON inventory_transactions(product_id);
        CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON inventory_transactions(created_at);
        CREATE INDEX IF NOT EXISTS idx_sales_records_product_id ON sales_records(product_id);
        CREATE INDEX IF NOT EXISTS idx_sales_records_created_at ON sales_records(created_at);
      `);

      // 建立更新時間觸發器
      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_products_updated_at ON products;
        CREATE TRIGGER update_products_updated_at
          BEFORE UPDATE ON products
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);

      console.log('✅ 資料庫表格初始化完成');
    } catch (error) {
      console.error('❌ 資料庫表格初始化失敗:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}
