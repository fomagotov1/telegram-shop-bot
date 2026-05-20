import { Router } from 'express';
import { paymentController } from '../controllers/payments';

const router = Router();

router.post('/check/:orderId', paymentController.checkStatus);
router.post('/webhook', paymentController.handleWebhook);

export { router as paymentRouter };
