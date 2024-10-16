import multer from 'multer';
import path from 'path';

// Configure storage options for uploaded client documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/ClientDocuments'); // Directory to store client documents
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    
    // Naming based on the field type
    if (file.fieldname === 'profilePhoto') {
      cb(null, 'profilepic_' + uniqueSuffix + fileExtension);
    } else if (file.fieldname === 'citizenshipImage') {
      cb(null, 'citizenship_' + uniqueSuffix + fileExtension);
    } else {
      cb(null, file.fieldname + '_' + uniqueSuffix + fileExtension);
    }
  }
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
    fileSize: 1 * 1024 * 1024 // 1MB limit for file size
  }
});

export default uploadClientDoc;
