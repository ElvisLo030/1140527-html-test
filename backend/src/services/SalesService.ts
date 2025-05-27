import { 
  ISalesRecordRepository,
  SalesRecordRepository 
} from '../models/SalesRecordRepository';
import { 
  SalesRecord, 
  SalesStats,
  PaginationParams, 
  PaginationResult 
} from '../types';

export interface ISalesService {
  getAllSales(params: PaginationParams): Promise<PaginationResult<SalesRecord>>;
  getSalesByProduct(productId: string, params: PaginationParams): Promise<PaginationResult<SalesRecord>>;
  getSalesByDateRange(startDate: Date, endDate: Date, params: PaginationParams): Promise<PaginationResult<SalesRecord>>;
  createSale(productId: string, quantity: number, unitPrice: number): Promise<SalesRecord>;
  deleteSale(id: string): Promise<void>;
  getSalesStats(): Promise<SalesStats>;
}

export class SalesService implements ISalesService {
  constructor(private salesRepository: ISalesRecordRepository) {}

  async getAllSales(params: PaginationParams): Promise<PaginationResult<SalesRecord>> {
    this.validatePaginationParams(params);
    return await this.salesRepository.findAll(params);
  }

  async getSalesByProduct(productId: string, params: PaginationParams): Promise<PaginationResult<SalesRecord>> {
    this.validateId(productId, '商品');
    this.validatePaginationParams(params);
    return await this.salesRepository.findByProductId(productId, params);
  }

  async getSalesByDateRange(startDate: Date, endDate: Date, params: PaginationParams): Promise<PaginationResult<SalesRecord>> {
    this.validateDateRange(startDate, endDate);
    this.validatePaginationParams(params);
    return await this.salesRepository.findByDateRange(startDate, endDate, params);
  }

  async createSale(productId: string, quantity: number, unitPrice: number): Promise<SalesRecord> {
    this.validateId(productId, '商品');
    this.validateQuantity(quantity);
    this.validatePrice(unitPrice, '單價');

    const totalAmount = quantity * unitPrice;

    const salesData: Omit<SalesRecord, 'id' | 'createdAt'> = {
      productId,
      quantity,
      unitPrice,
      totalAmount
    };

    return await this.salesRepository.create(salesData);
  }

  async deleteSale(id: string): Promise<void> {
    this.validateId(id, '銷售記錄');
    
    const deleted = await this.salesRepository.delete(id);
    if (!deleted) {
      throw new Error('刪除銷售記錄失敗');
    }
  }

  async getSalesStats(): Promise<SalesStats> {
    return await this.salesRepository.getStats();
  }

  private validateId(id: string, type: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error(`${type} ID 不能為空`);
    }
  }

  private validateQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('數量必須大於 0');
    }
    if (!Number.isInteger(quantity)) {
      throw new Error('數量必須為整數');
    }
  }

  private validatePrice(price: number, fieldName: string): void {
    if (price <= 0) {
      throw new Error(`${fieldName}必須大於 0`);
    }
  }

  private validateDateRange(startDate: Date, endDate: Date): void {
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      throw new Error('開始日期格式無效');
    }
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      throw new Error('結束日期格式無效');
    }
    if (startDate >= endDate) {
      throw new Error('開始日期必須小於結束日期');
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
}

// 工廠模式 - 建立服務實例
export const createSalesService = (): ISalesService => {
  const salesRepository = new SalesRecordRepository();
  return new SalesService(salesRepository);
};
