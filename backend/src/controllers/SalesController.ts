import { Request, Response } from 'express';
import { createSalesService, ISalesService } from '../services/SalesService';
import { ApiResponse } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export class SalesController {
  private salesService: ISalesService;

  constructor() {
    this.salesService = createSalesService();
  }

  // 取得所有銷售記錄
  getAllSales = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await this.salesService.getAllSales({ page, limit });
    
    res.json({
      success: true,
      data: result
    });
  });

  // 取得特定商品的銷售記錄
  getSalesByProduct = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await this.salesService.getSalesByProduct(id, { page, limit });
    
    res.json({
      success: true,
      data: result
    });
  });

  // 取得日期範圍內的銷售記錄
  getSalesByDateRange = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { startDate, endDate } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await this.salesService.getSalesByDateRange(
      new Date(startDate as string),
      new Date(endDate as string),
      { page, limit }
    );
    
    res.json({
      success: true,
      data: result
    });
  });

  // 建立銷售記錄
  createSale = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { productId, quantity, unitPrice } = req.body;
    
    const sale = await this.salesService.createSale(productId, quantity, unitPrice);
    
    res.status(201).json({
      success: true,
      data: sale,
      message: '銷售記錄建立成功'
    });
  });

  // 刪除銷售記錄
  deleteSale = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { id } = req.params;
    
    await this.salesService.deleteSale(id);
    
    res.json({
      success: true,
      message: '銷售記錄刪除成功'
    });
  });

  // 取得銷售統計
  getSalesStats = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const stats = await this.salesService.getSalesStats();
    
    res.json({
      success: true,
      data: stats
    });
  });
}
