// 商品分類枚舉
export enum ProductCategory {
  PEN = 'pen',
  PAPER = 'paper',
  OFFICE = 'office',
  OTHER = 'other'
}

// 庫存異動類型
export enum InventoryTransactionType {
  IN = 'in',    // 進貨
  OUT = 'out',  // 出貨
  ADJUST = 'adjust' // 調整
}

// 商品介面
export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description?: string;
  unit: string; // 單位：個、盒、包等
  price: number;
  cost: number; // 成本
  stock: number; // 庫存數量
  minStock: number; // 最低庫存警戒
  createdAt: Date;
  updatedAt: Date;
}

// 庫存異動記錄
export interface InventoryTransaction {
  id: string;
  productId: string;
  type: InventoryTransactionType;
  quantity: number;
  unitPrice?: number; // 單價（進貨時記錄）
  totalAmount?: number; // 總金額
  reason?: string; // 異動原因
  createdAt: Date;
}

// 銷售記錄
export interface SalesRecord {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  createdAt: Date;
}

// API 回應格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分頁介面
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 商品統計
export interface ProductStats {
  totalProducts: number;
  lowStockProducts: number;
  totalValue: number; // 庫存總價值
}

// 銷售統計
export interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  todaySales: number;
  todayRevenue: number;
}
