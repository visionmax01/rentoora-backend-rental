
import mongoose from 'mongoose';

const rentalPostSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    postType: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    images: [{ type: String }],
  },
  { timestamps: true }
);

const RentalPost = mongoose.model('RentalPost', rentalPostSchema);

export default RentalPost;
