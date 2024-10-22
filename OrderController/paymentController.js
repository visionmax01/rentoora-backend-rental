import axios from 'axios';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';

export const verifyKhaltiPayment = async (req, res) => {
  const { token, amount, postId, userId } = req.body;

  try {
    const response = await axios.post(
      'https://khalti.com/api/v2/payment/verify/',  // Use this for live mode as well
      {
        token: token,
        amount: amount,
      },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`, // Use your live secret key here
        },
      }
    );

    if (response.data && response.data.idx) {
      // Payment verified successfully
      const payment = new Payment({
        userId,
        postId,
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
