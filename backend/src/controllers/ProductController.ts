import { Request, Response } from 'express';
import { createProductService, IProductService } from '../services/ProductService';
import { ProductCategory, ApiResponse, PaginationParams } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

export class ProductController {
  private productService: IProductService;

  constructor() {
    this.productService = createProductService();
  }

  // 取得所有商品
  getAllProducts = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await this.productService.getAllProducts({ page, limit });
    
    res.json({
      success: true,
      data: result
    });
  });

  // 取得單一商品
  getProductById = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { id } = req.params;
    
    const product = await this.productService.getProductById(id);
    
    res.json({
      success: true,
      data: product
    });
  });

  // 依分類取得商品
  getProductsByCategory = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { category } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await this.productService.getProductsByCategory(
      category as ProductCategory, 
      { page, limit }
    );
    
    res.json({
      success: true,
      data: result
    });
  });

  // 取得低庫存商品
  getLowStockProducts = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const products = await this.productService.getLowStockProducts();
    
    res.json({
      success: true,
      data: products
    });
  });

  // 搜尋商品
  searchProducts = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { keyword } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await this.productService.searchProducts(
      keyword as string, 
      { page, limit }
    );
    
    res.json({
      success: true,
      data: result
    });
  });

  // 建立商品
  createProduct = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const productData = req.body;
    
    const product = await this.productService.createProduct(productData);
    
    res.status(201).json({
      success: true,
      data: product,
      message: '商品建立成功'
    });
  });

  // 更新商品
  updateProduct = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { id } = req.params;
    const productData = req.body;
    
    const product = await this.productService.updateProduct(id, productData);
    
    res.json({
      success: true,
      data: product,
      message: '商品更新成功'
    });
  });

  // 刪除商品
  deleteProduct = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { id } = req.params;
    
    await this.productService.deleteProduct(id);
    
    res.json({
      success: true,
      message: '商品刪除成功'
    });
  });

  // 取得商品統計
  getProductStats = asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const stats = await this.productService.getProductStats();
    
    res.json({
      success: true,
      data: stats
    });
  });
}
