import { Pool, PoolClient } from 'pg';
import { Product, ProductCategory, PaginationParams, PaginationResult } from '../types';
import { Database } from '../config/database';

// 介面隔離原則 - 定義商品倉庫介面
export interface IProductRepository {
  findAll(params: PaginationParams): Promise<PaginationResult<Product>>;
  findById(id: string): Promise<Product | null>;
  findByCategory(category: ProductCategory, params: PaginationParams): Promise<PaginationResult<Product>>;
  findLowStock(): Promise<Product[]>;
  create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  update(id: string, product: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
  updateStock(id: string, quantity: number): Promise<boolean>;
  search(keyword: string, params: PaginationParams): Promise<PaginationResult<Product>>;
}

export class ProductRepository implements IProductRepository {
  private pool: Pool;

  constructor() {
    this.pool = Database.getInstance().getPool();
  }

  async findAll(params: PaginationParams): Promise<PaginationResult<Product>> {
    const offset = (params.page - 1) * params.limit;
    
    const [countResult, dataResult] = await Promise.all([
      this.pool.query('SELECT COUNT(*) FROM products'),
      this.pool.query(
        `SELECT * FROM products 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`,
        [params.limit, offset]
      )
    ]);

    const total = parseInt(countResult.rows[0].count);
    const products = dataResult.rows.map(this.mapRowToProduct);

    return {
      data: products,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit)
    };
  }

  async findById(id: string): Promise<Product | null> {
    const result = await this.pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProduct(result.rows[0]);
  }

  async findByCategory(category: ProductCategory, params: PaginationParams): Promise<PaginationResult<Product>> {
    const offset = (params.page - 1) * params.limit;
    
    const [countResult, dataResult] = await Promise.all([
      this.pool.query('SELECT COUNT(*) FROM products WHERE category = $1', [category]),
      this.pool.query(
        `SELECT * FROM products 
         WHERE category = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [category, params.limit, offset]
      )
    ]);

    const total = parseInt(countResult.rows[0].count);
    const products = dataResult.rows.map(this.mapRowToProduct);

    return {
      data: products,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit)
    };
  }

  async findLowStock(): Promise<Product[]> {
    const result = await this.pool.query(
      'SELECT * FROM products WHERE stock <= min_stock ORDER BY stock ASC'
    );

    return result.rows.map(this.mapRowToProduct);
  }

  async create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const result = await this.pool.query(
      `INSERT INTO products (name, category, description, unit, price, cost, stock, min_stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        productData.name,
        productData.category,
        productData.description,
        productData.unit,
        productData.price,
        productData.cost,
        productData.stock,
        productData.minStock
      ]
    );

    return this.mapRowToProduct(result.rows[0]);
  }

  async update(id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(productData).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = key === 'minStock' ? 'min_stock' : key;
        setClauses.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await this.pool.query(
      `UPDATE products SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProduct(result.rows[0]);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'DELETE FROM products WHERE id = $1',
      [id]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateStock(id: string, quantity: number): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE products SET stock = stock + $1 WHERE id = $2',
      [quantity, id]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  async search(keyword: string, params: PaginationParams): Promise<PaginationResult<Product>> {
    const offset = (params.page - 1) * params.limit;
    const searchPattern = `%${keyword}%`;
    
    const [countResult, dataResult] = await Promise.all([
      this.pool.query(
        'SELECT COUNT(*) FROM products WHERE name ILIKE $1 OR description ILIKE $1',
        [searchPattern]
      ),
      this.pool.query(
        `SELECT * FROM products 
         WHERE name ILIKE $1 OR description ILIKE $1
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [searchPattern, params.limit, offset]
      )
    ]);

    const total = parseInt(countResult.rows[0].count);
    const products = dataResult.rows.map(this.mapRowToProduct);

    return {
      data: products,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit)
    };
  }

  private mapRowToProduct(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      category: row.category as ProductCategory,
      description: row.description,
      unit: row.unit,
      price: parseFloat(row.price),
      cost: parseFloat(row.cost),
      stock: row.stock,
      minStock: row.min_stock,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
