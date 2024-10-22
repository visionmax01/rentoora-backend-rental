import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

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
        public_id: 'profilepic_' + uniqueSuffix, // Unique filename
        format: fileExtension.slice(1), // Get the format without the dot
      };
    } else if (file.fieldname === 'citizenshipImage') {
      return {
        folder: 'ClientDocuments/citizenshipImage',
        public_id: 'citizenship_' + uniqueSuffix,
        format: fileExtension.slice(1),
      };
    } else {
      throw new Error('Invalid file field name'); // Reject files with other field names
    }
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
    fileSize: 2 * 1024 * 1024 // 2MB limit for file size
  }
});

export default uploadClientDoc;
