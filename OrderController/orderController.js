// controllers/orderController.js
const Order = require("../models/Order"); // Assuming you have an Order model

// Accept an order
exports.acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update order status to 'Accepted'
    order.orderStatus = "Accepted";
    await order.save();

    return res.status(200).json({ message: "Order accepted successfully", order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to accept the order" });
  }
};

// Reject an order
exports.rejectOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update order status to 'Rejected'
    order.orderStatus = "Rejected";
    await order.save();

    return res.status(200).json({ message: "Order rejected successfully", order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to reject the order" });
  }
};
