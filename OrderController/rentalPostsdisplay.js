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

        // Construct full address from the post's address
        const fullAddress = `${post.address.province}, ${post.address.district}, ${post.address.municipality}${post.address.landmark ? ', ' + post.address.landmark : ''}`;

        // HTML email template for the post owner
        const ownerMailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: post.clientId.email,
            subject: 'Your Rental Post Has Been Booked - Rentoora',
            html: `
    <div style="font-family: Arial, sans-serif; color: #333;  padding: 20px;">
  <div style="max-width: 600px;  background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">

  <h2 style="color: #4CAF50;">Dear ${post.clientId.name},</h2>
  <p>Congratulations! Your rental post of <strong>${post.postType}</strong> has been  booked by ${user.name}.</p>
  <p><strong>Booking Details:</strong></p>
  <div style="padding: 16px  0; background-color: #f4daed; border-left: 4px solid #4f46e5; margin-bottom: 16px;">
  <ul style="font-size: 14px; list-style: none; color: #4b5563; display:flex; flex-direction:column; gap:15px;">
      <li><strong>Booking ID:</strong> ${newOrder.orderId}</li>
      <li><strong>Booked By:</strong> ${user.name}</li>
      <li><strong>Account ID:</strong> ${user.accountId}</li>
      <li><strong>Rental Post:</strong> ${post.postType}</li>
      <li><strong>Price:</strong> Rs.${post.price}</li>
      <li><strong>Mode of Payment:</strong> ${newOrder.paymentMethod}</li>
      <li><strong>Location:</strong> ${fullAddress}</li>

  </ul>
  </div>
  <p>Your rental post status has been updated to "Booked".</p>
  <p>If you have any questions, feel free to contact us.</p>
  <div>Best regards,<br>
  <img src="https://rentoora.bhishansah.com.np/assets/Main_logo-CEv0uvA6.png" style="width:150px; height:50px; margin-left: -7px;" alt="" srcset=""><br>
  The Rentoora Team</div>
</div>
</div>
            `,
        };

        // HTML email template for the user
        const userMailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: user.email,
            subject: 'Booking Confirmation - Rentoora',
            html: `
<div style="font-family: Arial, sans-serif; color: #333;  padding: 20px;">
    <div style="max-width: 600px;  background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #4CAF50;">Dear ${user.name},</h2>
    <p>Thank you for your booking! Your rental post <strong>${post.postType}</strong> has been confirmed.</p>
    <p><strong>Booking Details:</strong></p>
    <div style="padding: 16px 0; background-color: #f4daed; border-left: 4px solid #4f46e5; margin-bottom: 16px;">
    <ul style="font-size: 14px; list-style: none;color: #4b5563;">
        <li><strong>Booking ID:</strong> ${newOrder.orderId}</li><br>
        <li><strong>Rental Post:</strong> ${post.postType}</li><br>
        <li><strong>Price:</strong> Rs.${post.price}</li><br>
        <li><strong>Payment Method:</strong> ${newOrder.paymentMethod}</li><br>
        <li ><strong>Location:</strong> ${fullAddress}</li>
    </ul>
    </div>
    <p>If you have any questions, feel free to contact us.</p>
    <div>Best regards,<br>
    <img src="https://rentoora.bhishansah.com.np/assets/Main_logo-CEv0uvA6.png" style="width:150px; height:50px; margin-left: -7px;"  alt="" srcset="">
    <br>The Rentoora Team</div>
  </div>
  </div>
            `,
        };

        // Send emails
        transporter.sendMail(ownerMailOptions);
        transporter.sendMail(userMailOptions);

        res.status(201).json({ message: 'Order placed successfully', order: newOrder });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};






//order canclation
export const cancelOrder = async (req, res) => {
    const { orderId } = req.params;
    const { canceledById } = req.body; // Extract canceledById from the request body

    try {
        // Find the order by ID and populate the related post and its clientId (owner of the post)
        const order = await Order.findById(orderId).populate({
            path: 'postId',
            populate: { path: 'clientId' } // Populate the clientId to get the owner's details
        });

        if (!order) return res.status(404).json({ message: 'Order not found.' });

        // Fetch the user who is canceling the order (the user making the cancellation)
        const cancelingUser = await User.findById(canceledById);
        if (!cancelingUser) return res.status(404).json({ message: 'Canceling user not found.' });

        // Update order status and cancellation details
        order.orderStatus = 'Order Canceled';
        order.canceledBy = cancelingUser.name;
        order.canceledById = canceledById;
        order.canceledAccountId = cancelingUser.accountId;

        await order.save();

        // Update post status if the order is linked to a post
        if (order.postId) {
            order.postId.status = 'not booked'; // Assuming you have a status field to indicate booking status
            await order.postId.save();
        }

        // Get the owner's email (owner of the post) from the populated clientId
        const ownerEmail = order.postId.clientId.email;
        const ownerName = order.postId.clientId.name;

        // Get the email and name of the user who created the order
        const orderCreator = await User.findById(order.userId); 
        if (!orderCreator) return res.status(404).json({ message: 'Order creator not found.' });
        const orderCreatorEmail = orderCreator.email;

        // HTML email template for the post owner (who created the post)
        const ownerMailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: ownerEmail,
            subject: 'Order Cancellation Notification - Rentoora',
            html: `
   <div style="font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #2c3e50; font-size: 24px;">Dear ${ownerName},</h2>
    <p style="font-size: 16px; line-height: 1.6;">Your rental post <strong style="color: #e74c3c;">"${order.postId.postType}"</strong> has been canceled. Below are the details:</p>
    <div style="padding: 16px; background-color: #f4daed; border-left: 4px solid #4f46e5; margin-bottom: 16px;">
      <p style="font-size: 14px; color: #4b5563;"><strong>Order ID:</strong> ${order.orderId}</p>
      <p style="font-size: 14px; color: #4b5563;"><strong>Canceled By:</strong> ${cancelingUser.name}</p>
      <p style="font-size: 14px; color: #4b5563;"><strong>Canceled On:</strong> ${new Date(order.updatedAt).toLocaleString()}</p>
    </div>
    <p style="font-size: 16px; line-height: 1.6;">If you have any questions or concerns, please contact us.</p>
    <p style="font-size: 16px; line-height: 1.6;">Best regards,<br>
    <img src="https://rentoora.bhishansah.com.np/assets/Main_logo-CEv0uvA6.png" style="width:150px; height:50px; margin-left:-7px;" alt=""><br>
    <strong style="color: #2980b9;">The Rentoora Team</strong></p>
  
  </div>
</div>


            `,
        };

        // HTML email template for the user who made the order
        const userMailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: orderCreatorEmail, // Email of the user who made the order
            subject: 'Your Order Has Been Canceled - Rentoora',
            html: `
<div style="font-family: Arial, sans-serif; color: #333; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #2c3e50; font-size: 24px;">Dear ${orderCreator.name},</h2>
      <p style="font-size: 16px; line-height: 1.6;">We regret to inform you that the order for your rental post <strong style="color: #e74c3c;">${order.postId.postType}</strong> has been canceled by ${cancelingUser.name}. Below are the details:</p>
  
      <div style="padding: 16px; background-color: #f4daed; border-left: 4px solid #4f46e5; margin-bottom: 16px;">
        <p style="font-size: 14px; color: #4b5563; ">
          <span><strong>Order ID:</strong> ${order.orderId}</span><br><br>
          <span><strong>Rental Post:</strong> ${order.postId.postType}</span><br><br>
          <span><strong>Canceled By:</strong> <span style="color: #e74c3c;">${cancelingUser.name}</span></span><br><br>
          <span><strong>Canceled On:</strong> ${new Date(order.updatedAt).toLocaleString()}</span>
        </p>
      </div>
  
      <p style="font-size: 16px; line-height: 1.6;">If you have any questions or need further assistance, please feel free to contact us.</p>
  
      <p style="font-size: 16px; line-height: 1.6;">Best regards,<br>
      <img src="https://rentoora.bhishansah.com.np/assets/Main_logo-CEv0uvA6.png" style="width:150px; height:50px; margin-left: -7px;" alt="" srcset=""><br>
      <strong style="color: #2980b9;">The Rentoora Team</strong></p>
    </div>
  </div>
            `,
        };

        // Send emails to both the post owner and the user who made the order
        await transporter.sendMail(ownerMailOptions);
        await transporter.sendMail(userMailOptions);

        res.status(200).json({ message: 'Order canceled successfully and notifications sent.' });
    } catch (error) {
        console.error('Error while canceling order:', error); // Log the error for debugging
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
