import { Router } from 'express';
import { SalesController } from '../controllers/SalesController';
import {
  validateSale,
  validateUUID,
  validatePagination,
  validateDateRange
} from '../middleware/validation';

const router = Router();
const salesController = new SalesController();

// 銷售路由
router.get('/stats', salesController.getSalesStats);
router.get('/date-range', validateDateRange, salesController.getSalesByDateRange);
router.get('/product/:id', validateUUID, validatePagination, salesController.getSalesByProduct);
router.get('/', validatePagination, salesController.getAllSales);

router.post('/', validateSale, salesController.createSale);
router.delete('/:id', validateUUID, salesController.deleteSale);

export default router;
