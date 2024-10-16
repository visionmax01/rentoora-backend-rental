// routes/orders.js
const express = require("express");
const { acceptOrder, rejectOrder } = require("../controllers/orderController");
const { verifyToken } = require("../middleware/authMiddleware"); // Middleware for token verification

const router = express.Router();

// Accept an order
router.put("/orders/:orderId/accepted", verifyToken, acceptOrder);

// Reject an order
router.put("/orders/:orderId/rejected", verifyToken, rejectOrder);

module.exports = router;
