import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RentalPost', // Reference to the RentalPost model
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
    accountId: {
        type: String,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['Wallet', 'Cash on Delivery'],
        required: true,
    },
    orderStatus: {
        type: String,
        enum: ['Order Confirmed', 'Order Canceled'],
        default: 'Order Confirmed', // Default status when the order is placed
    },
    canceledBy: {
        type: String, // Name of the user who canceled the order
        default: null,
    },
    canceledById: {
        type: mongoose.Schema.Types.ObjectId, // ID of the user who canceled the order
        ref: 'User', // Reference to the User model
        default: null,
    },
    canceledAccountId: { // Field to store the account ID of the user who canceled the order
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
