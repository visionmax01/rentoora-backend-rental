// routes/paymentRoutes.js
import express from 'express';
import { verifyKhaltiPayment } from '../OrderController/paymentController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const paymentRouter = express.Router();

paymentRouter.post('/khalti/verify', authenticateToken, verifyKhaltiPayment);

export default paymentRouter;
