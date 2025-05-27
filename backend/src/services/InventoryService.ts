import { 
  IInventoryTransactionRepository,
  InventoryTransactionRepository 
} from '../models/InventoryTransactionRepository';
import { 
  InventoryTransaction, 
  InventoryTransactionType, 
  PaginationParams, 
  PaginationResult 
} from '../types';

export interface IInventoryService {
  getAllTransactions(params: PaginationParams): Promise<PaginationResult<InventoryTransaction>>;
  getTransactionsByProduct(productId: string, params: PaginationParams): Promise<PaginationResult<InventoryTransaction>>;
  getTransactionsByType(type: InventoryTransactionType, params: PaginationParams): Promise<PaginationResult<InventoryTransaction>>;
  stockIn(productId: string, quantity: number, unitPrice: number, reason?: string): Promise<InventoryTransaction>;
  stockOut(productId: string, quantity: number, reason?: string): Promise<InventoryTransaction>;
  adjustStock(productId: string, quantity: number, reason: string): Promise<InventoryTransaction>;
  deleteTransaction(id: string): Promise<void>;
}

export class InventoryService implements IInventoryService {
  constructor(private inventoryRepository: IInventoryTransactionRepository) {}

  async getAllTransactions(params: PaginationParams): Promise<PaginationResult<InventoryTransaction>> {
    this.validatePaginationParams(params);
    return await this.inventoryRepository.findAll(params);
  }

  async getTransactionsByProduct(productId: string, params: PaginationParams): Promise<PaginationResult<InventoryTransaction>> {
    this.validateId(productId, '商品');
    this.validatePaginationParams(params);
    return await this.inventoryRepository.findByProductId(productId, params);
  }

  async getTransactionsByType(type: InventoryTransactionType, params: PaginationParams): Promise<PaginationResult<InventoryTransaction>> {
    this.validatePaginationParams(params);
    return await this.inventoryRepository.findByType(type, params);
  }

  async stockIn(productId: string, quantity: number, unitPrice: number, reason?: string): Promise<InventoryTransaction> {
    this.validateId(productId, '商品');
    this.validateQuantity(quantity);
    this.validatePrice(unitPrice, '單價');

    const transactionData: Omit<InventoryTransaction, 'id' | 'createdAt'> = {
      productId,
      type: InventoryTransactionType.IN,
      quantity,
      unitPrice,
      totalAmount: quantity * unitPrice,
      reason: reason || '商品進貨'
    };

    return await this.inventoryRepository.create(transactionData);
  }

  async stockOut(productId: string, quantity: number, reason?: string): Promise<InventoryTransaction> {
    this.validateId(productId, '商品');
    this.validateQuantity(quantity);

    const transactionData: Omit<InventoryTransaction, 'id' | 'createdAt'> = {
      productId,
      type: InventoryTransactionType.OUT,
      quantity,
      reason: reason || '商品出貨'
    };

    return await this.inventoryRepository.create(transactionData);
  }

  async adjustStock(productId: string, quantity: number, reason: string): Promise<InventoryTransaction> {
    this.validateId(productId, '商品');
    
    if (quantity === 0) {
      throw new Error('調整數量不能為 0');
    }
    
    if (!reason || reason.trim().length === 0) {
      throw new Error('庫存調整必須提供原因');
    }

    const transactionData: Omit<InventoryTransaction, 'id' | 'createdAt'> = {
      productId,
      type: InventoryTransactionType.ADJUST,
      quantity,
      reason: reason.trim()
    };

    return await this.inventoryRepository.create(transactionData);
  }

  async deleteTransaction(id: string): Promise<void> {
    this.validateId(id, '異動記錄');
    
    const deleted = await this.inventoryRepository.delete(id);
    if (!deleted) {
      throw new Error('刪除異動記錄失敗');
    }
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
    if (price < 0) {
      throw new Error(`${fieldName}不能為負數`);
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
export const createInventoryService = (): IInventoryService => {
  const inventoryRepository = new InventoryTransactionRepository();
  return new InventoryService(inventoryRepository);
};
