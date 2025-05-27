import { Router } from 'express';
import { ProductController } from '../../controllers/ProductController';
import {
  validateProduct,
  validateProductUpdate,
  validateUUID,
  validatePagination,
  validateSearch,
  validateCategory
} from '../../middleware/validation';

const router = Router();
const productController = new ProductController();

// 商品路由
router.get('/stats', productController.getProductStats);
router.get('/low-stock', validatePagination, productController.getLowStockProducts);
router.get('/search', validateSearch, productController.searchProducts);
router.get('/category/:category', validateCategory, validatePagination, productController.getProductsByCategory);
router.get('/:id', validateUUID, productController.getProductById);
router.get('/', validatePagination, productController.getAllProducts);

router.post('/', validateProduct, productController.createProduct);
router.put('/:id', validateUUID, validateProductUpdate, productController.updateProduct);
router.delete('/:id', validateUUID, productController.deleteProduct);

export default router;
