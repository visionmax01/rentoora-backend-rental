// controllers/paymentController.js
import axios from 'axios';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';

export const verifyKhaltiPayment = async (req, res) => {
  const { token, amount, postId, userId } = req.body;

  try {
    // Verify Khalti payment using Khalti secret key
    const response = await axios.post(
      'https://khalti.com/api/v2/payment/verify/',
      {
        token: token,
        amount: amount,
      },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        },
      }
    );

    if (response.data && response.data.idx) {
      // Payment verified successfully, create payment record
      const payment = new Payment({
        userId,
        postId,
        orderId: req.body.orderId, // Pass the orderId from frontend
        paymentMethod: 'Wallet',
        paymentStatus: 'Completed',
        paymentDetails: response.data,
      });
      await payment.save();

      // Update order status to confirmed
      await Order.findByIdAndUpdate(req.body.orderId, { orderStatus: 'Order Confirmed' });

      return res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Khalti verification error:', error);
    return res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};
