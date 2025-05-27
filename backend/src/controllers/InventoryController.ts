import { Request, Response } from 'express';
import { createInventoryService, IInventoryService } from '../services/InventoryService';
import { InventoryTransactionType, ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export class InventoryController {
  private inventoryService: IInventoryService;

  constructor() {
    this.inventoryService = createInventoryService();
  }

  // 取得所有庫存異動記錄
  getAllTransactions = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await this.inventoryService.getAllTransactions({ page, limit });
    
    res.json({
      success: true,
      data: result
    });
  });

  // 取得特定商品的庫存異動記錄
  getTransactionsByProduct = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await this.inventoryService.getTransactionsByProduct(id, { page, limit });
    
    res.json({
      success: true,
      data: result
    });
  });

  // 取得特定類型的庫存異動記錄
  getTransactionsByType = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { type } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await this.inventoryService.getTransactionsByType(
      type as InventoryTransactionType, 
      { page, limit }
    );
    
    res.json({
      success: true,
      data: result
    });
  });

  // 進貨
  stockIn = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { productId, quantity, unitPrice, reason } = req.body;
    
    const transaction = await this.inventoryService.stockIn(
      productId, 
      quantity, 
      unitPrice, 
      reason
    );
    
    res.status(201).json({
      success: true,
      data: transaction,
      message: '進貨記錄建立成功'
    });
  });

  // 出貨
  stockOut = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { productId, quantity, reason } = req.body;
    
    const transaction = await this.inventoryService.stockOut(
      productId, 
      quantity, 
      reason
    );
    
    res.status(201).json({
      success: true,
      data: transaction,
      message: '出貨記錄建立成功'
    });
  });

  // 庫存調整
  adjustStock = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { productId, quantity, reason } = req.body;
    
    const transaction = await this.inventoryService.adjustStock(
      productId, 
      quantity, 
      reason
    );
    
    res.status(201).json({
      success: true,
      data: transaction,
      message: '庫存調整成功'
    });
  });

  // 刪除庫存異動記錄
  deleteTransaction = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { id } = req.params;
    
    await this.inventoryService.deleteTransaction(id);
    
    res.json({
      success: true,
      message: '異動記錄刪除成功'
    });
  });
}
