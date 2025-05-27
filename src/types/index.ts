// 商品分類枚舉
export enum ProductCategory {
  PEN = 'pen',
  PAPER = 'paper',
  OFFICE = 'office',
  OTHER = 'other'
}

// 庫存異動類型
export enum InventoryTransactionType {
  IN = 'in',
  OUT = 'out',
  ADJUST = 'adjust'
}

// 商品介面
export interface Product {
  id: string
  name: string
  category: ProductCategory
  description?: string
  unit: string
  price: number
  cost: number
  stock: number
  minStock: number
  createdAt: string
  updatedAt: string
}

// 庫存異動記錄
export interface InventoryTransaction {
  id: string
  productId: string
  type: InventoryTransactionType
  quantity: number
  unitPrice?: number
  totalAmount?: number
  reason?: string
  createdAt: string
}

// 銷售記錄
export interface SalesRecord {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  totalAmount: number
  createdAt: string
}

// API 回應格式
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 分頁參數
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginationResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 統計資料
export interface ProductStats {
  totalProducts: number
  lowStockProducts: number
  totalValue: number
}

export interface SalesStats {
  totalSales: number
  totalRevenue: number
  todaySales: number
  todayRevenue: number
}

// 表單資料
export interface ProductForm {
  name: string
  category: ProductCategory
  description?: string
  unit: string
  price: number
  cost: number
  stock: number
  minStock: number
}

export interface StockInForm {
  productId: string
  quantity: number
  unitPrice: number
  reason?: string
}

export interface StockOutForm {
  productId: string
  quantity: number
  reason?: string
}

export interface StockAdjustForm {
  productId: string
  quantity: number
  reason: string
}

export interface SaleForm {
  productId: string
  quantity: number
  unitPrice: number
}

// 商品分類選項
export const PRODUCT_CATEGORIES = [
  { value: ProductCategory.PEN, label: '筆類' },
  { value: ProductCategory.PAPER, label: '紙類' },
  { value: ProductCategory.OFFICE, label: '辦公用品' },
  { value: ProductCategory.OTHER, label: '其他' }
]

// 異動類型選項
export const TRANSACTION_TYPES = [
  { value: InventoryTransactionType.IN, label: '進貨', color: 'green' },
  { value: InventoryTransactionType.OUT, label: '出貨', color: 'red' },
  { value: InventoryTransactionType.ADJUST, label: '調整', color: 'blue' }
]
