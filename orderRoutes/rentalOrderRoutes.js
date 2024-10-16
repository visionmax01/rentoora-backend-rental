// routes/orderRouter.js
import express from 'express';
import authenticateToken from '../middleware/authenticateToken.js';
import {
    getAllRentalPosts,
    getPostById,
    createOrder,
    updatePostStatus,
    cancelOrder
} from '../OrderController/rentalPostsdisplay.js'; // Ensure you have this controller file
import { getUserOrders, getMyBookedOrders } from '../OrderController/getOrderController.js';

const orderRouter = express.Router();

// Define the routes
orderRouter.get('/display-posts', getAllRentalPosts);
orderRouter.get("/post/:id", getPostById);
orderRouter.patch('/post/:postId', authenticateToken, updatePostStatus); // Ensure this is protected
orderRouter.post('/create', authenticateToken, createOrder);
orderRouter.put('/orders/:orderId/cancel', authenticateToken, cancelOrder); // Cancellation route
orderRouter.get('/user-orders', authenticateToken, getUserOrders); // Make sure this route is protected
orderRouter.get('/my-booked-orders', authenticateToken, getMyBookedOrders);

export default orderRouter;
