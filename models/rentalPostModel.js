import mongoose from 'mongoose';

const rentalPostSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  postType: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  address: {
    province: { type: String, required: true },
    district: { type: String, required: true },
    municipality: { type: String, required: true },
    landmark: { type: String },  // New field for landmark
  },
  images: [{ type: String }],
  status: {
    type: String,
    enum: ['booked', 'not booked'],
    default: 'not booked', // Default status
  },
}, { timestamps: true });

const RentalPost = mongoose.model('RentalPost', rentalPostSchema);

export default RentalPost;
