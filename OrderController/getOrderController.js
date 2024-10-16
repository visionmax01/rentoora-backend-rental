// controllers/orderController.js
import Order from '../models/Order.js';
import RentalPost from '../models/rentalPostModel.js';
import jwt from 'jsonwebtoken';
// Get user orders
export const getUserOrders = async (req, res) => {
    try {
        // Check if user is authenticated and has a userId attached
        if (!req.user || !req.userId) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }

        // Fetch orders by userId and populate postId to get post details
        const orders = await Order.find({ userId: req.userId })
            .populate({
                path: 'postId',
                populate: {
                    path: 'clientId', // Assuming 'createdBy' references the User model in RentalPost
                    select: 'name phoneNo', // Select the fields you need from the User model
                },
            });

        if (orders.length === 0) {
            return res.status(404).json({ message: 'No orders founded.' });
        }

        // Send orders with populated post details
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};




// Controller to get all booked orders for the user's rental posts
export const getMyBookedOrders = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const clientId = decoded.id; // Assuming the clientId is the user's ID

        // Find rental posts created by the user
        const rentalPosts = await RentalPost.find({ clientId });

        if (!rentalPosts.length) {
            return res.status(404).json({ message: 'No rental posts found for this user.' });
        }

        // Find orders related to these rental posts
        const orders = await Order.find({
            postId: { $in: rentalPosts.map(post => post._id) },
            orderStatus: { $in: ['Order Confirmed', 'Order Canceled'] }, // Fetch both confirmed and canceled orders
        })
        .populate('postId', 'postType price address images description') // Populate post details as needed
        .populate('userId', 'name accountId phoneNo'); // Populate user details (if needed)

        if (orders.length === 0) {
            return res.status(404).json({ message: 'No orders Recieved.' });
        }

        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching booked orders:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};








