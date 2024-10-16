import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  accountId: { type: String, required: true, unique: true },
  role: { type: Number, enum: [0, 1], default: 0 }, // 0 for client, 1 for admin
  profilePhotoPath: { type: String },
  citizenshipImagePath: { type: String },
  phoneNo: { type: String },
  dateOfBirth: { type: Date },
  province: { type: String },
  district: { type: String },
  municipality: { type: String },
  otp: { type: String }, // Add OTP field
  otpExpiry: { type: Date } // Add OTP expiry field
}, { timestamps: true }); // Add this line to include timestamps

// Middleware to format the date before saving
userSchema.pre('save', function(next) {
  if (this.dateOfBirth) {
    this.dateOfBirth.setUTCHours(0, 0, 0, 0); 
  }
  next();
});

export default mongoose.model('User', userSchema);
