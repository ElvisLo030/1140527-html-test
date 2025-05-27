import { 
  IProductRepository, 
  ProductRepository 
} from '../models/ProductRepository';
import { 
  Product, 
  ProductCategory, 
  PaginationParams, 
  PaginationResult,
  ProductStats 
} from '../types';

export interface IProductService {
  getAllProducts(params: PaginationParams): Promise<PaginationResult<Product>>;
  getProductById(id: string): Promise<Product>;
  getProductsByCategory(category: ProductCategory, params: PaginationParams): Promise<PaginationResult<Product>>;
  getLowStockProducts(): Promise<Product[]>;
  searchProducts(keyword: string, params: PaginationParams): Promise<PaginationResult<Product>>;
  createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  updateProduct(id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  getProductStats(): Promise<ProductStats>;
}

export class ProductService implements IProductService {
  constructor(private productRepository: IProductRepository) {}

  async getAllProducts(params: PaginationParams): Promise<PaginationResult<Product>> {
    this.validatePaginationParams(params);
    return await this.productRepository.findAll(params);
  }

  async getProductById(id: string): Promise<Product> {
    this.validateId(id);
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('商品不存在');
    }
    return product;
  }

  async getProductsByCategory(category: ProductCategory, params: PaginationParams): Promise<PaginationResult<Product>> {
    this.validatePaginationParams(params);
    return await this.productRepository.findByCategory(category, params);
  }

  async getLowStockProducts(): Promise<Product[]> {
    return await this.productRepository.findLowStock();
  }

  async searchProducts(keyword: string, params: PaginationParams): Promise<PaginationResult<Product>> {
    if (!keyword || keyword.trim().length === 0) {
      throw new Error('搜尋關鍵字不能為空');
    }
    this.validatePaginationParams(params);
    return await this.productRepository.search(keyword.trim(), params);
  }

  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    this.validateProductData(productData);
    return await this.productRepository.create(productData);
  }

  async updateProduct(id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
    this.validateId(id);
    
    // 確保商品存在
    await this.getProductById(id);
    
    // 驗證更新資料
    if (Object.keys(productData).length === 0) {
      throw new Error('更新資料不能為空');
    }

    const updatedProduct = await this.productRepository.update(id, productData);
    if (!updatedProduct) {
      throw new Error('更新商品失敗');
    }
    
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    this.validateId(id);
    
    // 確保商品存在
    await this.getProductById(id);
    
    const deleted = await this.productRepository.delete(id);
    if (!deleted) {
      throw new Error('刪除商品失敗');
    }
  }

  async getProductStats(): Promise<ProductStats> {
    const [allProducts, lowStockProducts] = await Promise.all([
      this.productRepository.findAll({ page: 1, limit: Number.MAX_SAFE_INTEGER }),
      this.productRepository.findLowStock()
    ]);

    const totalValue = allProducts.data.reduce((sum, product) => {
      return sum + (product.stock * product.cost);
    }, 0);

    return {
      totalProducts: allProducts.total,
      lowStockProducts: lowStockProducts.length,
      totalValue
    };
  }

  private validateId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error('商品 ID 不能為空');
    }
  }

  private validatePaginationParams(params: PaginationParams): void {
    if (params.page < 1) {
      throw new Error('頁碼必須大於 0');
    }
    if (params.limit < 1 || params.limit > 100) {
      throw new Error('每頁數量必須在 1-100 之間');
    }
  }

  private validateProductData(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): void {
    if (!productData.name || productData.name.trim().length === 0) {
      throw new Error('商品名稱不能為空');
    }
    if (!productData.category || !Object.values(ProductCategory).includes(productData.category)) {
      throw new Error('商品分類無效');
    }
    if (!productData.unit || productData.unit.trim().length === 0) {
      throw new Error('商品單位不能為空');
    }
    if (productData.price < 0) {
      throw new Error('售價不能為負數');
    }
    if (productData.cost < 0) {
      throw new Error('成本不能為負數');
    }
    if (productData.stock < 0) {
      throw new Error('庫存不能為負數');
    }
    if (productData.minStock < 0) {
      throw new Error('最低庫存不能為負數');
    }
  }
}

// 工廠模式 - 建立服務實例
export const createProductService = (): IProductService => {
  const productRepository = new ProductRepository();
  return new ProductService(productRepository);
};
