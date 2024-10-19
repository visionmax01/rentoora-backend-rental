import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path'; // Import path module
import jwt from 'jsonwebtoken';
import User from '../models/User'; // Import User model (update the path as needed)

dotenv.config();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: (req, file) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname); // Get the file extension

    // Naming based on the field type
    if (file.fieldname === 'profilePhoto') {
      return {
        folder: 'ClientDocuments/profilePhoto', // Set folder in Cloudinary
        public_id: 'profilepic_' + req.user._id + '_' + uniqueSuffix, // Filename includes user ID
        format: fileExtension.slice(1), // Get the format without the dot
      };
    }
    return {
      folder: 'ClientDocuments/others',
      public_id: file.fieldname + '_' + uniqueSuffix,
      format: fileExtension.slice(1),
    };
  },
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Not an image! Please upload an image.'), false); // Reject the file
  }
};

// Limit the file size to 1MB
const uploadClientDoc = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB limit for file size
  },
}).single('profilePhoto'); // Ensure to handle 'profilePhoto' field only

export default uploadClientDoc;

// Update profile picture function
export const updateProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const token = req.headers.authorization?.split(' ')[1]; // Assuming Bearer token

    if (!token) {
      return res.status(401).json({ message: 'No token provided.' });
    }

    // Verify and decode the token to get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Delete the old profile picture from Cloudinary if it exists
    if (user.profilePhotoPath) {
      const oldPublicId = user.profilePhotoPath.split('/').pop().split('.')[0]; // Get the public ID
      await cloudinary.v2.uploader.destroy(oldPublicId, { invalidate: true });
    }

    // Update the user's profile picture path with the new URL
    user.profilePhotoPath = req.file.path;
    await user.save();

    res.status(200).json({ message: 'Profile picture updated successfully.', profilePhotoPath: user.profilePhotoPath });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile picture.', error: error.message });
  }
};
