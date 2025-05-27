import { Pool } from 'pg';
import { SalesRecord, PaginationParams, PaginationResult, SalesStats } from '../types';
import { Database } from '../config/database';

export interface ISalesRecordRepository {
  findAll(params: PaginationParams): Promise<PaginationResult<SalesRecord>>;
  findByProductId(productId: string, params: PaginationParams): Promise<PaginationResult<SalesRecord>>;
  findByDateRange(startDate: Date, endDate: Date, params: PaginationParams): Promise<PaginationResult<SalesRecord>>;
  create(salesRecord: Omit<SalesRecord, 'id' | 'createdAt'>): Promise<SalesRecord>;
  delete(id: string): Promise<boolean>;
  getStats(): Promise<SalesStats>;
}

export class SalesRecordRepository implements ISalesRecordRepository {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async findAll(params: PaginationParams): Promise<PaginationResult<SalesRecord>> {
    const offset = (params.page - 1) * params.limit;
    
    const [countResult, dataResult] = await Promise.all([
      this.pool.query('SELECT COUNT(*) FROM sales_records'),
      this.pool.query(
        `SELECT sr.*, p.name as product_name
         FROM sales_records sr
         JOIN products p ON sr.product_id = p.id
         ORDER BY sr.created_at DESC 
         LIMIT $1 OFFSET $2`,
        [params.limit, offset]
      )
    ]);

    const total = parseInt(countResult.rows[0].count);
    const salesRecords = dataResult.rows.map(this.mapRowToSalesRecord);

    return {
      data: salesRecords,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit)
    };
  }

  async findByProductId(productId: string, params: PaginationParams): Promise<PaginationResult<SalesRecord>> {
    const offset = (params.page - 1) * params.limit;
    
    const [countResult, dataResult] = await Promise.all([
      this.pool.query('SELECT COUNT(*) FROM sales_records WHERE product_id = $1', [productId]),
      this.pool.query(
        `SELECT sr.*, p.name as product_name
         FROM sales_records sr
         JOIN products p ON sr.product_id = p.id
         WHERE sr.product_id = $1
         ORDER BY sr.created_at DESC 
         LIMIT $2 OFFSET $3`,
        [productId, params.limit, offset]
      )
    ]);

    const total = parseInt(countResult.rows[0].count);
    const salesRecords = dataResult.rows.map(this.mapRowToSalesRecord);

    return {
      data: salesRecords,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit)
    };
  }

  async findByDateRange(startDate: Date, endDate: Date, params: PaginationParams): Promise<PaginationResult<SalesRecord>> {
    const offset = (params.page - 1) * params.limit;
    
    const [countResult, dataResult] = await Promise.all([
      this.pool.query(
        'SELECT COUNT(*) FROM sales_records WHERE created_at >= $1 AND created_at <= $2',
        [startDate, endDate]
      ),
      this.pool.query(
        `SELECT sr.*, p.name as product_name
         FROM sales_records sr
         JOIN products p ON sr.product_id = p.id
         WHERE sr.created_at >= $1 AND sr.created_at <= $2
         ORDER BY sr.created_at DESC 
         LIMIT $3 OFFSET $4`,
        [startDate, endDate, params.limit, offset]
      )
    ]);

    const total = parseInt(countResult.rows[0].count);
    const salesRecords = dataResult.rows.map(this.mapRowToSalesRecord);

    return {
      data: salesRecords,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit)
    };
  }

  async create(salesData: Omit<SalesRecord, 'id' | 'createdAt'>): Promise<SalesRecord> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // 檢查庫存
      const stockResult = await client.query(
        'SELECT stock FROM products WHERE id = $1',
        [salesData.productId]
      );

      if (stockResult.rows.length === 0) {
        throw new Error('商品不存在');
      }

      const currentStock = stockResult.rows[0].stock;
      if (currentStock < salesData.quantity) {
        throw new Error('庫存不足');
      }

      // 建立銷售記錄
      const result = await client.query(
        `INSERT INTO sales_records (product_id, quantity, unit_price, total_amount)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          salesData.productId,
          salesData.quantity,
          salesData.unitPrice,
          salesData.totalAmount
        ]
      );

      // 更新商品庫存
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [salesData.quantity, salesData.productId]
      );

      // 建立庫存異動記錄
      await client.query(
        `INSERT INTO inventory_transactions (product_id, type, quantity, unit_price, total_amount, reason)
         VALUES ($1, 'out', $2, $3, $4, '銷售出貨')`,
        [
          salesData.productId,
          salesData.quantity,
          salesData.unitPrice,
          salesData.totalAmount
        ]
      );

      await client.query('COMMIT');

      // 獲取商品名稱
      const productResult = await client.query(
        'SELECT name FROM products WHERE id = $1',
        [salesData.productId]
      );

      const salesRecord = this.mapRowToSalesRecord({
        ...result.rows[0],
        product_name: productResult.rows[0]?.name
      });

      return salesRecord;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM sales_records WHERE id = $1',
      [id]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  async getStats(): Promise<SalesStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalResult, todayResult] = await Promise.all([
      this.pool.query(
        'SELECT COUNT(*) as total_sales, COALESCE(SUM(total_amount), 0) as total_revenue FROM sales_records'
      ),
      this.pool.query(
        'SELECT COUNT(*) as today_sales, COALESCE(SUM(total_amount), 0) as today_revenue FROM sales_records WHERE created_at >= $1 AND created_at < $2',
        [today, tomorrow]
      )
    ]);

    return {
      totalSales: parseInt(totalResult.rows[0].total_sales),
      totalRevenue: parseFloat(totalResult.rows[0].total_revenue),
      todaySales: parseInt(todayResult.rows[0].today_sales),
      todayRevenue: parseFloat(todayResult.rows[0].today_revenue)
    };
  }

  private mapRowToSalesRecord(row: any): SalesRecord {
    return {
      id: row.id,
      productId: row.product_id,
      quantity: row.quantity,
      unitPrice: parseFloat(row.unit_price),
      totalAmount: parseFloat(row.total_amount),
      createdAt: row.created_at
    };
  }
}
