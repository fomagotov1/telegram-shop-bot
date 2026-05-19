import { Router } from 'express';
import { paymentController } from '../controllers/payments';

const router = Router();

router.post('/webhook', paymentController.webhook);
router.post('/check/:orderId', paymentController.checkStatus);

export { router as paymentRouter };
