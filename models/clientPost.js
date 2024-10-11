

import mongoose from 'mongoose';

const clientPostSchema = new mongoose.Schema({
  type: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  images: [String], // Array of image file paths
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User model (not 'Client')
}, { timestamps: true });

const ClientPost = mongoose.model('ClientPost', clientPostSchema);

export default ClientPost;
