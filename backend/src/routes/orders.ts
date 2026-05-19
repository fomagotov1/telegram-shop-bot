import { Router } from 'express';
import { orderController } from '../controllers/orders';

const router = Router();

router.post('/', orderController.create);
router.get('/currencies', orderController.getSupportedCurrencies);
router.get('/:id', orderController.getById);
router.get('/user/:telegramId', orderController.getByUser);

export { router as orderRouter };
