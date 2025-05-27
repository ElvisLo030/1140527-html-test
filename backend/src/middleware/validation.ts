import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ProductCategory, InventoryTransactionType } from '../types';
import { AppError } from './errorHandler';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg).join(', ');
    throw new AppError(errorMessages, 400);
  }
  next();
};

// 商品驗證規則
export const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('商品名稱長度必須在 1-255 字元之間'),
  
  body('category')
    .isIn(Object.values(ProductCategory))
    .withMessage('商品分類無效'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('商品描述不能超過 1000 字元'),
  
  body('unit')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('商品單位長度必須在 1-20 字元之間'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('售價必須為非負數'),
  
  body('cost')
    .isFloat({ min: 0 })
    .withMessage('成本必須為非負數'),
  
  body('stock')
    .isInt({ min: 0 })
    .withMessage('庫存必須為非負整數'),
  
  body('minStock')
    .isInt({ min: 0 })
    .withMessage('最低庫存必須為非負整數'),
  
  validateRequest
];

export const validateProductUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('商品名稱長度必須在 1-255 字元之間'),
  
  body('category')
    .optional()
    .isIn(Object.values(ProductCategory))
    .withMessage('商品分類無效'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('商品描述不能超過 1000 字元'),
  
  body('unit')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('商品單位長度必須在 1-20 字元之間'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('售價必須為非負數'),
  
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('成本必須為非負數'),
  
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('庫存必須為非負整數'),
  
  body('minStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('最低庫存必須為非負整數'),
  
  validateRequest
];

// 庫存異動驗證規則
export const validateStockIn = [
  body('productId')
    .isUUID()
    .withMessage('商品 ID 格式無效'),
  
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('數量必須為正整數'),
  
  body('unitPrice')
    .isFloat({ min: 0 })
    .withMessage('單價必須為非負數'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('原因不能超過 500 字元'),
  
  validateRequest
];

export const validateStockOut = [
  body('productId')
    .isUUID()
    .withMessage('商品 ID 格式無效'),
  
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('數量必須為正整數'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('原因不能超過 500 字元'),
  
  validateRequest
];

export const validateStockAdjust = [
  body('productId')
    .isUUID()
    .withMessage('商品 ID 格式無效'),
  
  body('quantity')
    .isInt()
    .custom((value) => value !== 0)
    .withMessage('調整數量不能為 0'),
  
  body('reason')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('調整原因長度必須在 1-500 字元之間'),
  
  validateRequest
];

// 銷售驗證規則
export const validateSale = [
  body('productId')
    .isUUID()
    .withMessage('商品 ID 格式無效'),
  
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('數量必須為正整數'),
  
  body('unitPrice')
    .isFloat({ min: 0.01 })
    .withMessage('單價必須大於 0'),
  
  validateRequest
];

// UUID 參數驗證
export const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('ID 格式無效'),
  
  validateRequest
];

// 分頁參數驗證
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('頁碼必須為正整數'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每頁數量必須在 1-100 之間'),
  
  validateRequest
];

// 搜尋參數驗證
export const validateSearch = [
  query('keyword')
    .trim()
    .isLength({ min: 1 })
    .withMessage('搜尋關鍵字不能為空'),
  
  ...validatePagination
];

// 日期範圍驗證
export const validateDateRange = [
  query('startDate')
    .isISO8601()
    .withMessage('開始日期格式無效'),
  
  query('endDate')
    .isISO8601()
    .withMessage('結束日期格式無效')
    .custom((value, { req }) => {
      const startDate = new Date(req.query?.startDate as string);
      const endDate = new Date(value);
      if (startDate >= endDate) {
        throw new Error('開始日期必須小於結束日期');
      }
      return true;
    }),
  
  ...validatePagination
];

// 商品分類驗證
export const validateCategory = [
  param('category')
    .isIn(Object.values(ProductCategory))
    .withMessage('商品分類無效'),
  
  validateRequest
];

// 異動類型驗證
export const validateTransactionType = [
  param('type')
    .isIn(Object.values(InventoryTransactionType))
    .withMessage('異動類型無效'),
  
  validateRequest
];
