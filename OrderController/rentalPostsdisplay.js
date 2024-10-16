import RentalPost from '../models/rentalPostModel.js'; 
import Order from '../models/Order.js';
import User from '../models/clientadModel.js'; 
import { v4 as uuidv4 } from 'uuid'; 
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer'; 
import dotenv from 'dotenv'; 

// Load environment variables
dotenv.config();

// Helper function to generate order ID
const generateOrderId = () => {
    const randomPart1 = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    const randomPart2 = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
    return `${randomPart1}-${randomPart2}`;
};

// Controller to get all rental posts
export const getAllRentalPosts = async (req, res) => {
    try {
        const rentalPosts = await RentalPost.find().populate('clientId', 'name accountId email'); 
        res.status(200).json(rentalPosts);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve rental posts', error: error.message });
    }
};

// Controller to get a single post by ID
export const getPostById = async (req, res) => {
    try {
        const post = await RentalPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: "Error fetching post", error: error.message });
    }
};

// Setup Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Create a new order

export const createOrder = async (req, res) => {
    const { postId, paymentMethod, transactionId } = req.body;

    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const post = await RentalPost.findById(postId).populate('clientId');
        if (!post) return res.status(404).json({ message: 'Rental post not found' });

        // Check if the rental post is already booked
        if (post.status === 'Booked') {
            return res.status(400).json({ message: 'Cannot create order. The rental post is already booked.' });
        }

        const newOrder = new Order({
            orderId: generateOrderId(),
            userId: user._id,
            accountId: user.accountId,
            postId,
            userName: user.name,
            paymentMethod,
            transactionId,
        });

        await newOrder.save();

        // Email template for the post owner
        const ownerMailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: post.clientId.email,
            subject: 'Your Rental Post Has Been Booked - Rentoora',
            text: `Dear ${post.clientId.name},

Your rental post (${post.postType}) has been booked by ${user.name} (Account ID: ${user.accountId}). Below are the booking details:

Booking ID: ${newOrder.orderId}
User Name: ${user.name}
Account ID: ${user.accountId}
Rental Post: ${post.postType}
Location: ${post.location}
Price: Rs.${post.price}

Please note that the booking status is now updated to "Booked".

Best regards,
The Rentoora Team`,
        };

        // Email template for the user
        const userMailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: user.email,
            subject: 'Booking Confirmation - Rentoora',
            text: `Dear ${user.name},

Thank you for your booking!

Your booking for the rental post (${post.postType}) has been confirmed. Below are the details:

Booking ID: ${newOrder.orderId}
Rental Post: ${post.postType}
Location: ${post.location}
Price: Rs.${post.price}
Payment Method: ${newOrder.paymentMethod}

If you have any questions, feel free to contact us.

Best regards,
The Rentoora Team`,
        };

        // Send emails
        transporter.sendMail(ownerMailOptions);
        transporter.sendMail(userMailOptions);

        res.status(201).json({ message: 'Order placed successfully', order: newOrder });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};




//order cancling
export const cancelOrder = async (req, res) => {
    const { orderId } = req.params;
    const { canceledById } = req.body; // Extract canceledById from the request body

    try {
        // Find the order by ID and populate the related post
        const order = await Order.findById(orderId).populate('postId');
        if (!order) return res.status(404).json({ message: 'Order not found.' });

        // Fetch the user who is canceling the order
        const cancelingUser = await User.findById(canceledById);
        if (!cancelingUser) return res.status(404).json({ message: 'User not found.' });

        // Update order status and cancel details
        order.orderStatus = 'Order Canceled';
        order.canceledBy = cancelingUser.name; // Store the name of the user who canceled the order
        order.canceledById = canceledById; // Store the ID of the user who canceled the order
        order.canceledAccountId = cancelingUser.accountId; // Store the account ID of the user who canceled the order

        await order.save();

        // Update post status if the order is linked to a post
        if (order.postId) {
            order.postId.status = 'not booked'; // Assuming you have a status field to indicate booking status
            await order.postId.save();
        }

        res.status(200).json({ message: 'Order canceled successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};







// Update rental post status
export const updatePostStatus = async (req, res) => {
    const { postId } = req.params;
    const { status } = req.body;

    try {
        const post = await RentalPost.findByIdAndUpdate(postId, { status }, { new: true });
        if (!post) return res.status(404).json({ message: 'Post not found' });

        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
