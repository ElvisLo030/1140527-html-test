import { Router } from 'express';
import { InventoryController } from '../controllers/InventoryController';
import {
  validateStockIn,
  validateStockOut,
  validateStockAdjust,
  validateUUID,
  validatePagination,
  validateTransactionType
} from '../middleware/validation';

const router = Router();
const inventoryController = new InventoryController();

// 庫存異動路由
router.get('/type/:type', validateTransactionType, validatePagination, inventoryController.getTransactionsByType);
router.get('/product/:id', validateUUID, validatePagination, inventoryController.getTransactionsByProduct);
router.get('/', validatePagination, inventoryController.getAllTransactions);

router.post('/stock-in', validateStockIn, inventoryController.stockIn);
router.post('/stock-out', validateStockOut, inventoryController.stockOut);
router.post('/adjust', validateStockAdjust, inventoryController.adjustStock);

router.delete('/:id', validateUUID, inventoryController.deleteTransaction);

export default router;
