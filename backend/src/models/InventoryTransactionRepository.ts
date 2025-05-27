import { Pool } from 'pg';
import { InventoryTransaction, InventoryTransactionType, PaginationParams, PaginationResult } from '../types';
import { Database } from '../config/database';

export interface IInventoryTransactionRepository {
  findAll(params: PaginationParams): Promise<PaginationResult<InventoryTransaction>>;
  findByProductId(productId: string, params: PaginationParams): Promise<PaginationResult<InventoryTransaction>>;
  findByType(type: InventoryTransactionType, params: PaginationParams): Promise<PaginationResult<InventoryTransaction>>;
  create(transaction: Omit<InventoryTransaction, 'id' | 'createdAt'>): Promise<InventoryTransaction>;
  delete(id: string): Promise<boolean>;
}

export class InventoryTransactionRepository implements IInventoryTransactionRepository {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async findAll(params: PaginationParams): Promise<PaginationResult<InventoryTransaction>> {
    const offset = (params.page - 1) * params.limit;
    
    const [countResult, dataResult] = await Promise.all([
      this.pool.query('SELECT COUNT(*) FROM inventory_transactions'),
      this.pool.query(
        `SELECT it.*, p.name as product_name
         FROM inventory_transactions it
         JOIN products p ON it.product_id = p.id
         ORDER BY it.created_at DESC 
         LIMIT $1 OFFSET $2`,
        [params.limit, offset]
      )
    ]);

    const total = parseInt(countResult.rows[0].count);
    const transactions = dataResult.rows.map(this.mapRowToTransaction);

    return {
      data: transactions,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit)
    };
  }

  async findByProductId(productId: string, params: PaginationParams): Promise<PaginationResult<InventoryTransaction>> {
    const offset = (params.page - 1) * params.limit;
    
    const [countResult, dataResult] = await Promise.all([
      this.pool.query('SELECT COUNT(*) FROM inventory_transactions WHERE product_id = $1', [productId]),
      this.pool.query(
        `SELECT it.*, p.name as product_name
         FROM inventory_transactions it
         JOIN products p ON it.product_id = p.id
         WHERE it.product_id = $1
         ORDER BY it.created_at DESC 
         LIMIT $2 OFFSET $3`,
        [productId, params.limit, offset]
      )
    ]);

    const total = parseInt(countResult.rows[0].count);
    const transactions = dataResult.rows.map(this.mapRowToTransaction);

    return {
      data: transactions,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit)
    };
  }

  async findByType(type: InventoryTransactionType, params: PaginationParams): Promise<PaginationResult<InventoryTransaction>> {
    const offset = (params.page - 1) * params.limit;
    
    const [countResult, dataResult] = await Promise.all([
      this.pool.query('SELECT COUNT(*) FROM inventory_transactions WHERE type = $1', [type]),
      this.pool.query(
        `SELECT it.*, p.name as product_name
         FROM inventory_transactions it
         JOIN products p ON it.product_id = p.id
         WHERE it.type = $1
         ORDER BY it.created_at DESC 
         LIMIT $2 OFFSET $3`,
        [type, params.limit, offset]
      )
    ]);

    const total = parseInt(countResult.rows[0].count);
    const transactions = dataResult.rows.map(this.mapRowToTransaction);

    return {
      data: transactions,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit)
    };
  }

  async create(transactionData: Omit<InventoryTransaction, 'id' | 'createdAt'>): Promise<InventoryTransaction> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // 建立異動記錄
      const result = await client.query(
        `INSERT INTO inventory_transactions (product_id, type, quantity, unit_price, total_amount, reason)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          transactionData.productId,
          transactionData.type,
          transactionData.quantity,
          transactionData.unitPrice,
          transactionData.totalAmount,
          transactionData.reason
        ]
      );

      // 更新商品庫存
      let stockChange = 0;
      switch (transactionData.type) {
        case InventoryTransactionType.IN:
          stockChange = transactionData.quantity;
          break;
        case InventoryTransactionType.OUT:
          stockChange = -transactionData.quantity;
          break;
        case InventoryTransactionType.ADJUST:
          stockChange = transactionData.quantity; // 可正可負
          break;
      }

      await client.query(
        'UPDATE products SET stock = stock + $1 WHERE id = $2',
        [stockChange, transactionData.productId]
      );

      await client.query('COMMIT');

      // 獲取商品名稱
      const productResult = await client.query(
        'SELECT name FROM products WHERE id = $1',
        [transactionData.productId]
      );

      const transaction = this.mapRowToTransaction({
        ...result.rows[0],
        product_name: productResult.rows[0]?.name
      });

      return transaction;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM inventory_transactions WHERE id = $1',
      [id]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  private mapRowToTransaction(row: any): InventoryTransaction {
    return {
      id: row.id,
      productId: row.product_id,
      type: row.type as InventoryTransactionType,
      quantity: row.quantity,
      unitPrice: row.unit_price ? parseFloat(row.unit_price) : undefined,
      totalAmount: row.total_amount ? parseFloat(row.total_amount) : undefined,
      reason: row.reason,
      createdAt: row.created_at
    };
  }
}
